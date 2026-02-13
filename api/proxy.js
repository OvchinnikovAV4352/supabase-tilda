import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }
} catch (error) {
  console.error('❌ Supabase init error:', error);
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Получаем таблицу из URL: /api/proxy/leads → ['leads']
    const url = new URL(req.url, `http://${req.headers.host}`);
    const path = url.pathname.replace('/api/proxy', '').split('/').filter(Boolean);
    const [table, id] = path;
    
    console.log(`📌 ${req.method} /${table || ''} ${id || ''}`);

    // Если нет таблицы - показываем документацию
    if (!table) {
      return res.status(200).json({
        success: true,
        message: 'Supabase Proxy работает!',
        endpoints: {
          GET: '/api/proxy/:table',
          POST: '/api/proxy/:table',
          GET_ID: '/api/proxy/:table/:id',
          PUT: '/api/proxy/:table/:id',
          DELETE: '/api/proxy/:table/:id'
        },
        example: '/api/proxy/leads'
      });
    }

    // POST - создание записи
    if (req.method === 'POST') {
      if (!supabase) {
        return res.status(500).json({ 
          success: false, 
          error: 'Supabase не инициализирован' 
        });
      }

      const { data, error } = await supabase
        .from(table)
        .insert([req.body])
        .select();

      if (error) {
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(201).json({
        success: true,
        data: data[0]
      });
    }

    // GET - чтение записей
    if (req.method === 'GET') {
      if (!supabase) {
        return res.status(500).json({ 
          success: false, 
          error: 'Supabase не инициализирован' 
        });
      }

      let query = supabase.from(table).select('*');
      
      if (id) {
        query = query.eq('id', id).single();
      }

      const { data, error } = await query;

      if (error) {
        return res.status(400).json({ 
          success: false, 
          error: error.message 
        });
      }

      return res.status(200).json({
        success: true,
        data: data || []
      });
    }

    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });

  } catch (error) {
    console.error('❌ Ошибка:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
