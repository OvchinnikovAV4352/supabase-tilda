import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS настройки
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { table } = req.query;
    const { filter, orderBy, limit } = req.query;

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    let query = supabase.from(table).select('*');

    // Применение фильтров
    if (filter) {
      const filterObj = JSON.parse(filter);
      if (filterObj.field && filterObj.value !== undefined) {
        query = query.eq(filterObj.field, filterObj.value);
      }
    }

    // Сортировка
    if (orderBy) {
      const orderObj = JSON.parse(orderBy);
      query = query.order(orderObj.field, { 
        ascending: orderObj.ascending !== false 
      });
    }

    // Лимит
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({ 
      success: true, 
      data,
      count: data ? data.length : 0
    });

  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
