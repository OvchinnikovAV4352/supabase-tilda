
import { createClient } from '@supabase/supabase-js';

// Проверяем переменные окружения
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('ERROR: Missing Supabase environment variables');
}

// Создаем клиент
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  // Устанавливаем CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Обрабатываем preflight запросы
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Получаем путь
    const path = req.query.path || [];
    console.log(`Request: ${req.method} /api/proxy/${path.join('/')}`);
    
    // Если путь пустой - возвращаем информацию
    if (path.length === 0) {
      return res.status(200).json({
        message: 'Supabase Proxy API',
        endpoints: {
          'GET /api/proxy/:table': 'Get all records from table',
          'GET /api/proxy/:table/:id': 'Get single record',
          'POST /api/proxy/:table': 'Create record',
          'PUT /api/proxy/:table/:id': 'Update record',
          'DELETE /api/proxy/:table/:id': 'Delete record'
        },
        tables: ['leads', 'users', 'orders'] // Укажите ваши таблицы
      });
    }
    
    const [table, id] = path;
    
    // Проверяем наличие таблицы
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    // Обрабатываем в зависимости от метода
    switch (req.method) {
      case 'GET':
        return await handleGet(table, id, req, res);
      case 'POST':
        return await handlePost(table, req, res);
      case 'PUT':
        return await handlePut(table, id, req, res);
      case 'DELETE':
        return await handleDelete(table, id, req, res);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// GET - получение данных
async function handleGet(table, id, req, res) {
  try {
    let query = supabase.from(table).select('*');
    
    if (id) {
      // Получаем одну запись по ID
      query = query.eq('id', id).single();
    }
    
    // Применяем простые фильтры из query параметров
    const { limit, order } = req.query;
    if (limit) query = query.limit(parseInt(limit));
    if (order) {
      const [column, direction] = order.split(':');
      query = query.order(column, { ascending: direction !== 'desc' });
    }
    
    const { data, error } = await query;
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Таблица не найдена
        return res.status(404).json({ error: `Table "${table}" not found` });
      }
      throw error;
    }
    
    return res.status(200).json({
      success: true,
      data: data || [],
      count: Array.isArray(data) ? data.length : 1
    });
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// POST - создание данных
async function handlePost(table, req, res) {
  try {
    const body = req.body;
    
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }
    
    // Добавляем метаданные
    const dataToInsert = {
      ...body,
      created_at: new Date().toISOString(),
      ip_address: req.headers['x-forwarded-for'] || 'unknown'
    };
    
    const { data, error } = await supabase
      .from(table)
      .insert([dataToInsert])
      .select();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: `Table "${table}" not found` });
      }
      throw error;
    }
    
    return res.status(201).json({
      success: true,
      data: data[0],
      message: `Record created in "${table}"`
    });
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// PUT - обновление данных
async function handlePut(table, id, req, res) {
  try {
    if (!id) {
      return res.status(400).json({ error: 'Record ID is required' });
    }
    
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ error: 'Invalid update data' });
    }
    
    const { data, error } = await supabase
      .from(table)
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: `Table "${table}" not found` });
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: `Record with ID "${id}" not found` });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0],
      message: `Record ${id} updated in "${table}"`
    });
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// DELETE - удаление данных
async function handleDelete(table, id, req, res) {
  try {
    if (!id) {
      return res.status(400).json({ error: 'Record ID is required' });
    }
    
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: `Table "${table}" not found` });
      }
      throw error;
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({ error: `Record with ID "${id}" not found` });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0],
      message: `Record ${id} deleted from "${table}"`
    });
    
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
