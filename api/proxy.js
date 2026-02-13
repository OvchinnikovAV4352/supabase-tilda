export default function handler(req, res) {
  // Простейшие CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  
  // Ответ на preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Всегда возвращаем 200 OK с информацией о запросе
  return res.status(200).json({
    status: 'ok',
    message: 'Proxy endpoint работает!',
    method: req.method,
    url: req.url,
    path: req.query.path || [],
    timestamp: Date.now()
  });
}
