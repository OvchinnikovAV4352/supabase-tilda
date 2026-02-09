export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    status: 'ok',
    service: 'Tilda + Supabase Proxy',
    version: '1.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /api/health': 'Service status',
      'GET /api/debug': 'Debug information',
      'GET /api/proxy': 'Proxy API documentation',
      'GET/POST/PUT/DELETE /api/proxy/:table': 'CRUD operations',
      'POST /api/tilda/form': 'Tilda forms submission'
    },
    uptime: process.uptime()
  });
}
