import { createClient } from '@supabase/supabase-js';

// Инициализация Supabase (добавь проверку переменных)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase;
try {
  if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  } else {
    console.error('❌ Missing Supabase environment variables');
  }
} catch (error) {
  console.error('❌ Supabase init error:', error);
}

export default async function handler(req, res) {
  // 1. CORS — разрешаем твой домен
  res.setHeader('Access-Control-Allow-Origin', 'http://familyon-line.ru');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 2. Обработка preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 3. Получаем имя таблицы из URL
    //    /api/proxy/sugnup -> ['sugnup']
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathParts = url.pathname.split('/').filter(Boolean); // убираем пустые части
    // Индекс 0 = 'api', 1 = 'proxy', 2 = имя таблицы
    const table = pathParts[2]; 

    console.log('📌 Path parts:', pathParts);
    console.log('📌 Table name:', table);

    // 4. Если таблица не указана — возвращаем справку
    if (!table) {
      return res.status(200).json({
        success: true,
        message: 'Supabase Proxy API',
        endpoints: {
          POST: '/api/proxy/:table_name',
          GET: '/api/proxy/:table_name',
        },
        example: '/api/proxy/sugnup',
        note: 'Замени "sugnup" на название твоей таблицы'
      });
    }

    // 5. Проверка инициализации Supabase
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase client not initialized',
        details: 'Check SUPABASE_URL and SUPABASE_SERVICE_KEY'
      });
    }

    // 6. POST — создание записи
    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from(table)
        .insert([req.body])
        .select();

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message,
          code: error.code
        });
      }

      return res.status(201).json({
        success: true,
        data: data[0],
        message: `✅ Запись создана в таблице "${table}"`
      });
    }

    // 7. GET — чтение записей
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      return res.status(200).json({
        success: true,
        data: data,
        count: data.length
      });
    }

    // 8. Другие методы не поддерживаем
    return res.status(405).json({
      success: false,
      error: `Method ${req.method} not allowed`
    });

  } catch (error) {
    console.error('❌ Server error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
