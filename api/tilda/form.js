import { createClient } from '@supabase/supabase-js';

// Инициализация
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS для Tilda
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const formData = req.body;
    const table = req.query.table || 'tilda_submissions';
    const formId = formData.formid || formData.FormId || formData.formId || 'unknown';
    
    console.log(`📝 Tilda form received: ${formId}, table: ${table}`);
    
    // Подготавливаем данные
    const submission = {
      form_id: formId,
      form_name: formData.formname || formData.FormName || 'unknown',
      page_url: formData.pageUrl || req.headers.referer || formData['page-url'] || 'unknown',
      page_title: formData.pageTitle || document?.title || 'unknown',
      form_data: formData,
      raw_data: req.body,
      metadata: {
        user_agent: req.headers['user-agent'],
        ip_address: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        timestamp: new Date().toISOString()
      }
    };
    
    // Сохраняем в Supabase
    const { data, error } = await supabase
      .from(table)
      .insert([submission])
      .select();
    
    if (error) {
      console.error('❌ Tilda submission error:', error);
      
      // Если таблицы нет, создаем автоматически (опционально)
      if (error.code === 'PGRST116') {
        console.log(`Table ${table} doesn't exist. Creating...`);
        // Можно добавить автоматическое создание таблицы здесь
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to save form data',
        details: error.message
      });
    }
    
    // Ответ для Tilda (важно для правильной работы)
    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
      submission_id: data[0]?.id,
      redirect_url: req.query.redirect || formData.redirectUrl || null
    });
    
  } catch (error) {
    console.error('❌ Tilda handler error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}
