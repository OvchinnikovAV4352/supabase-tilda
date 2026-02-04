import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Настройки CORS
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
    const { 
      formid, // ID формы Tilda
      table = 'tilda_submissions', // Таблица по умолчанию
      redirect, // URL для редиректа
      ...formData 
    } = req.body;

    // Валидация
    if (!formid) {
      return res.status(400).json({ error: 'Form ID is required' });
    }

    // Подготовка данных
    const submissionData = {
      form_id: formid,
      form_data: formData,
      raw_data: req.body,
      metadata: {
        user_agent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        referer: req.headers.referer,
        timestamp: new Date().toISOString()
      }
    };

    // Сохранение в Supabase
    const { data, error } = await supabase
      .from(table)
      .insert([submissionData])
      .select();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Логирование успешной отправки
    console.log(`Form ${formid} submitted successfully`);

    // Ответ для Tilda
    const response = {
      success: true,
      message: 'Form submitted successfully',
      submission_id: data[0]?.id
    };

    // Если нужен редирект
    if (redirect) {
      response.redirect = redirect;
    }

    // Отправляем ответ в формате, который понимает Tilda
    res.status(200).json(response);

  } catch (error) {
    console.error('Proxy error:', error);
    
    // Отправляем понятную ошибку для Tilda
    res.status(500).json({
      success: false,
      error: 'Form submission failed',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
