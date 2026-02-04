import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Supabase client initialized');
} catch (error) {
  console.error('Failed to initialize Supabase:', error);
}

export default async function handler(req, res) {
  // Устанавливаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  console.log(`[PROXY] ${req.method} ${req.url}`);
  
  try {
    // Получаем путь из запроса
    const { path = [] } = req.query;
    console.log('Path segments:', path);
    
    // Если запрос к корню /api/proxy
    if (!path || path.length === 0) {
      return res.status(200).json({
        message: 'Supabase Proxy API',
        version: '1.0',
        endpoints: [
          'GET    /api/proxy/:table',
          'GET    /api/proxy/:table/:id',
          'POST   /api/proxy/:table',
          'PUT    /api/proxy/:table/:id',
          'DELETE /api/proxy/:table/:id'
        ],
        example: '/api/proxy/leads'
      });
    }
    
    const [table, id] = path;
    
    // Если нет таблицы
    if (!table) {
      return res.status(400).json({ error: 'Table name is required' });
    }
    
    // Проверяем Supabase клиент
    if (!supabase) {
      return res.status(500).json({ 
        error: 'Supabase client not initialized',
        details: 'Check environment variables'
      });
    }
    
    // Обрабатываем методы
    if (req.method === 'GET') {
      let query = supabase.from(table).select('*');
      
      if (id) {
        query = query.eq('id', id).single();
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: `Table "${table}" not found` });
        }
        return res.status(400).json({ error: error.message });
      }
      
      return res.json({ 
        success: true, 
        data: data || [],
        count: Array.isArray(data) ? data.length : 1
      });
    }
    
    if (req.method === 'POST') {
      const body = req.body || {};
      
      const { data, error } = await supabase
        .from(table)
        .insert([{
          ...body,
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        console.error('Supabase error:', error);
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: `Table "${table}" not found` });
        }
        return res.status(400).json({ error: error.message });
      }
      
      return res.status(201).json({
        success: true,
        data: data[0],
        message: 'Record created'
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
