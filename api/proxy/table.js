import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    // GET - список всех таблиц
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name');
      
      if (error) throw error;
      
      return res.json({
        success: true,
        tables: data.map(t => t.table_name),
        count: data.length
      });
    }
    
    // POST - создать новую таблицу
    if (req.method === 'POST') {
      const { tableName, columns = [] } = req.body;
      
      if (!tableName) {
        return res.status(400).json({ error: 'tableName is required' });
      }
      
      // SQL для создания таблицы
      const sql = `
        CREATE TABLE IF NOT EXISTS ${tableName} (
          id BIGSERIAL PRIMARY KEY,
          ${columns.map(col => `${col.name} ${col.type || 'TEXT'}`).join(',\n          ')},
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Enable all for service" ON ${tableName}
          FOR ALL USING (true);
      `;
      
      const { error } = await supabase.rpc('exec_sql', { query: sql });
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        message: `Table ${tableName} created successfully`,
        table: tableName
      });
    }
    
  } catch (error) {
    console.error('Tables error:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
