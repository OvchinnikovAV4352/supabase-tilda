export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Просто возвращаем то, что получили
  return res.status(200).json({
    success: true,
    message: 'Proxy is working!',
    method: req.method,
    path: req.query.path || [],
    table: req.query.path?.[0] || null,
    id: req.query.path?.[1] || null,
    query: req.query,
    body: req.method === 'POST' ? req.body : null
  });
}
