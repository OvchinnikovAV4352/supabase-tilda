import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    // Проверяем что ключ доступен
    const hasKey = !!process.env.SUPABASE_SERVICE_KEY;
    const keyLength = hasKey ? process.env.SUPABASE_SERVICE_KEY.length : 0;
    
    // Пробуем подключиться к Supabase
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    // Тестовый запрос к Supabase
    const { data, error } = await supabase
      .from('_test')
      .select('count')
      .limit(1)
      .maybeSingle(); // Используем maybeSingle чтобы не падать если таблицы нет
    
    return res.json({
      status: 'ok',
      supabase: {
        url: process.env.SUPABASE_URL ? 'SET' : 'MISSING',
        service_key: hasKey ? `SET (${keyLength} chars)` : 'MISSING',
        connection: error ? 'FAILED' : 'SUCCESS',
        error: error ? error.message : null
      },
      message: error && error.code === 'PGRST116' 
        ? 'Supabase connected but test table not found (this is normal)' 
        : 'Supabase connection test complete',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      error: error.message,
      details: 'Failed to connect to Supabase'
    });
  }
}
