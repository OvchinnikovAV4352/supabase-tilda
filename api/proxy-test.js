export default function handler(req, res) {
  console.log('Proxy test called:', req.method, req.url);
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.json({
    status: 'ok',
    message: 'Proxy test endpoint',
    url: req.url,
    method: req.method,
    query: req.query,
    timestamp: new Date().toISOString()
  });
}
