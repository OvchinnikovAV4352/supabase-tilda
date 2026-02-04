import { createClient } from '@supabase/supabase-js';

// Инициализируем клиент
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized');
  } else {
    console.error('Missing Supabase environment variables');
  }
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
}

export default async function handler(req, res) {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Разбираем URL
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/supabase', '').split('/').filter(Boolean);
    
    console.log(`Request: ${req.method} ${req.url}`);
    console.log('Path segments:', path);
    
    // Если запрос к корню /api/supabase
    if (path.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Supabase Proxy API',
        endpoints: {
          'GET /api/supabase/:table': 'Get all records from table',
          'GET /api/supabase/:table/:id': 'Get single record',
          'POST /api/supabase/:table': 'Create new record',
          'PUT /api/supabase/:table/:id': 'Update record',
          'DELETE /api/supabase/:table/:id': 'Delete record'
        },
        example: '/api/supabase/leads'
      });
    }
    
    const [table, id] = path;
    
    // Проверяем наличие таблицы
    if (!table) {
      return res.status(400).json({
        success: false,
        error: 'Table name is required'
      });
    }
    
    // Проверяем инициализацию Supabase
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase client not initialized',
        details: 'Check environment variables in Vercel'
      });
    }
    
    // Обрабатываем HTTP методы
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
        return res.status(405).json({
          success: false,
          error: `Method ${req.method} not allowed`
        });
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

// GET - получение данных
async function handleGet(req, res, table, id) {
  try {
    console.log(`GET from table: ${table}, id: ${id || 'all'}`);
    
    let query = supabase.from(table).select('*');
    
    // Если есть ID, получаем одну запись
    if (id) {
      query = query.eq('id', id).single();
    }
    
    // Применяем query параметры
    const { limit, order, filter } = req.query;
    
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    if (order) {
      const [column, direction] = order.split(':');
      query = query.order(column, { ascending: direction !== 'desc' });
    }
    
    if (filter) {
      try {
        const filters = JSON.parse(filter);
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      } catch (e) {
        console.error('Invalid filter:', e);
      }
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Supabase GET error:', error);
      
      // Обрабатываем специфические ошибки
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `Table "${table}" not found in database`
        });
      }
      
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data || [],
      count: Array.isArray(data) ? data.length : (data ? 1 : 0)
    });
    
  } catch (error) {
    console.error('GET handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// POST - создание данных
async function handlePost(req, res, table) {
  try {
    console.log(`POST to table: ${table}`);
    
    const body = req.body;
    
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected JSON object'
      });
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
    
    if (error) {
      console.error('Supabase POST error:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `Table "${table}" not found in database`
        });
      }
      
      return res.status(400).json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
    
    return res.status(201).json({
      success: true,
      data: data[0],
      message: `Record created successfully in table "${table}"`
    });
    
  } catch (error) {
    console.error('POST handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// PUT - обновление данных
async function handlePut(req, res, table, id) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Record ID is required for update'
      });
    }
    
    console.log(`PUT to table: ${table}, id: ${id}`);
    
    const updates = req.body;
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid update data. Expected JSON object'
      });
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
      console.error('Supabase PUT error:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `Table "${table}" not found in database`
        });
      }
      
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Record with ID "${id}" not found in table "${table}"`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0],
      message: `Record ${id} updated successfully`
    });
    
  } catch (error) {
    console.error('PUT handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

// DELETE - удаление данных
async function handleDelete(req, res, table, id) {
  try {
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Record ID is required for deletion'
      });
    }
    
    console.log(`DELETE from table: ${table}, id: ${id}`);
    
    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();
    
    if (error) {
      console.error('Supabase DELETE error:', error);
      
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: `Table "${table}" not found in database`
        });
      }
      
      return res.status(400).json({
        success: false,
        error: error.message
      });
    }
    
    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Record with ID "${id}" not found in table "${table}"`
      });
    }
    
    return res.status(200).json({
      success: true,
      data: data[0],
      message: `Record ${id} deleted successfully`
    });
    
  } catch (error) {
    console.error('DELETE handler error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
