export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Простейший тест - просто проверяем что прокси работает
  return res.status(200).json({
    success: true,
    message: 'Proxy is working!',
    method: req.method,
    path: req.query.path || [],
    table: req.query.path?.[0] || 'no table specified',
    timestamp: new Date().toISOString()
  });
}
