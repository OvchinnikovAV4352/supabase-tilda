export default async function handler(req, res) {
  // ✅ ПРАВИЛЬНЫЕ CORS-ЗАГОЛОВКИ для твоего домена
  res.setHeader('Access-Control-Allow-Origin', 'http://familyon-line.ru'); // Твой домен
  // или временно для теста можно поставить '*' 
  // res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // ✅ ОБЯЗАТЕЛЬНО обрабатываем preflight-запрос (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Если пришли на корень прокси — показываем тестовый ответ
  if (req.url === '/api/proxy' || req.url === '/api/proxy/') {
    return res.status(200).json({ 
      success: true, 
      message: 'Proxy работает! CORS настроен.',
      note: 'Попробуй /api/proxy/sugnup'
    });
  }

  // --- Здесь твой основной код для работы с Supabase ---
  // (вставь сюда свою логику создания клиента и обработки запросов)
  
  // Для начала просто вернём успех, чтобы проверить CORS
  return res.status(200).json({
    success: true,
    message: 'Запрос получен, CORS работает!',
    method: req.method,
    url: req.url
  });
}
