export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  return res.json({
    message: 'Proxy API',
    path: req.url,
    query: req.query,
    method: req.method
  });
}
