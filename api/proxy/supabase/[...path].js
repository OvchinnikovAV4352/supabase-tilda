import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase клиента
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Настройка CORS для Tilda
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Обработка предварительных запросов CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const path = req.query.path || [];
    const [action, table] = path;
    
    console.log(`Proxy request: ${req.method} ${action}/${table || ''}`);
    
    // Валидация API ключа (опционально, для безопасности)
    const apiKey = req.headers['x-api-key'];
    if (process.env.API_KEY && apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    // Обработка разных методов
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, table);
      case 'POST':
        return await handlePost(req, res, action, table);
      case 'PUT':
        return await handlePut(req, res, table);
      case 'DELETE':
        return await handleDelete(req, res, table);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Обработчик GET запросов
async function handleGet(req, res, table) {
  const { 
    select = '*', 
    filter, 
    order, 
    limit, 
    page = 1,
    eq, // Фильтр равенства: field=value
    neq, // Не равно
    gt, // Больше
    lt // Меньше
  } = req.query;

  try {
    let query = supabase.from(table).select(select);

    // Применяем фильтры
    if (filter) {
      const filters = JSON.parse(filter);
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Фильтр равенства из query параметров
    if (eq) {
      const [field, value] = eq.split(':');
      if (field && value) {
        query = query.eq(field, value);
      }
    }

    // Фильтр "не равно"
    if (neq) {
      const [field, value] = neq.split(':');
      if (field && value) {
        query = query.neq(field, value);
      }
    }

    // Фильтр "больше чем"
    if (gt) {
      const [field, value] = gt.split(':');
      if (field && value) {
        query = query.gt(field, value);
      }
    }

    // Фильтр "меньше чем"
    if (lt) {
      const [field, value] = lt.split(':');
      if (field && value) {
        query = query.lt(field, value);
      }
    }

    // Сортировка
    if (order) {
      const [column, direction] = order.split(':');
      query = query.order(column, { ascending: direction !== 'desc' });
    }

    // Пагинация
    const pageSize = limit ? parseInt(limit) : 100;
    const from = (parseInt(page) - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: pageSize,
        total: count || data.length
      }
    });

  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
}

// Обработчик POST запросов
async function handlePost(req, res, action, table) {
  try {
    const body = req.body;
    
    // Добавляем метаданные
    const enhancedData = {
      ...body,
      created_at: new Date().toISOString(),
      source: 'tilda_proxy',
      ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress
    };

    let result;
    
    if (action === 'rpc') {
      // Вызов хранимой процедуры
      const { function: funcName, ...params } = body;
      result = await supabase.rpc(funcName, params);
    } else {
      // Вставка данных
      result = await supabase
        .from(table)
        .insert([enhancedData])
        .select();
    }

    const { data, error } = result;

    if (error) throw error;

    return res.status(201).json({
      success: true,
      data,
      message: `Data inserted into ${table} successfully`
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Обработчик PUT запросов (обновление)
async function handlePut(req, res, table) {
  try {
    const { id, ...updates } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'ID is required for update' });
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
      data,
      message: `Record ${id} updated successfully`
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

// Обработчик DELETE запросов
async function handleDelete(req, res, table) {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID is required for deletion' });
    }

    const { data, error } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .select();

    if (error) throw error;

    return res.status(200).json({
      success: true,
      data,
      message: `Record ${id} deleted successfully`
    });

  } catch (error) {
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}
