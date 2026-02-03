import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Получаем список таблиц через SQL запрос
    const { data, error } = await supabase.rpc('get_tables_list');

    if (error) {
      // Альтернативный способ: через информацию схемы
      const { data: tablesData } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      return res.status(200).json({
        success: true,
        tables: tablesData.map(t => t.table_name)
      });
    }

    return res.status(200).json({
      success: true,
      tables: data
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
