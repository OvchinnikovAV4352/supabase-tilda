import { createClient } from '@supabase/supabase-js';

// Инициализация клиента с проверкой переменных
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
};

export default async function handler(req, res) {
  // Устанавливаем CORS headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.query.path || [];
    const [table, id] = path;

    console.log(`Request: ${req.method} /${path.join('/')}`);

    // Проверяем API ключ если он установлен
    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (process.env.API_KEY && apiKey !== `Bearer ${process.env.API_KEY}`) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'Invalid API key' 
      });
    }

    // Обработка запросов
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, table, id);
      case 'POST':
        return await handlePost(req, res, table);
      case 'PUT':
        return await handlePut(req, res, table, id);
      case 'DELETE':
        return await handleDelete(req, res, table, id);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// GET handler
async function handleGet(req, res, table, id) {
  if (!table) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    let query = supabase.from(table).select('*');

    // Если есть ID - получаем одну запись
    if (id) {
      query = query.eq('id', id).single();
    }

    // Применяем фильтры из query params
    const { select, filter, order, limit, offset } = req.query;
    
    if (select) query = query.select(select);
    
    if (filter) {
      const filters = JSON.parse(filter);
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    
    if (order) {
      const [column, direction] = order.split(':');
      query = query.order(column, { ascending: direction !== 'desc' });
    }
    
    if (limit) query = query.limit(parseInt(limit));
    if (offset) query = query.range(parseInt(offset), parseInt(offset) + (parseInt(limit) || 10) - 1);

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: id ? data : data || [],
      count: Array.isArray(data) ? data.length : 1
    });
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// POST handler
async function handlePost(req, res, table) {
  if (!table) {
    return res.status(400).json({ error: 'Table name is required' });
  }

  try {
    const body = req.body;
    
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    // Добавляем метаданные
    const dataToInsert = {
      ...body,
      created_at: new Date().toISOString(),
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
      user_agent: req.headers['user-agent']
    };

    const { data, error } = await supabase
      .from(table)
      .insert([dataToInsert])
      .select();

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data: data[0],
      message: `Record created in ${table}`
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// PUT handler
async function handlePut(req, res, table, id) {
  if (!table || !id) {
    return res.status(400).json({ 
      error: 'Table name and ID are required' 
    });
  }

  try {
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

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data[0],
      message: `Record ${id} updated`
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// DELETE handler
async function handleDelete(req, res, table, id) {
  if (!table || !id) {
    return res.status(400).json({ 
      error: 'Table name and ID are required' 
    });
  }

  try {
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data: data[0],
      message: `Record ${id} deleted`
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
