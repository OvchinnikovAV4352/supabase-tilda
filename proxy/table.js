import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { table, action, id } = req.query;
    
    if (!table) {
      return res.status(400).json({ error: 'Table parameter is required' });
    }
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );
    
    if (req.method === 'GET') {
      let query = supabase.from(table).select('*');
      
      if (id) {
        query = query.eq('id', id).single();
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return res.json({
        success: true,
        data: data || []
      });
    }
    
    if (req.method === 'POST') {
      const { data, error } = await supabase
        .from(table)
        .insert([req.body])
        .select();
      
      if (error) throw error;
      
      return res.status(201).json({
        success: true,
        data: data[0]
      });
    }
    
    return res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
}
