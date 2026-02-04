export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.json({
    status: 'ok',
    message: 'Test endpoint',
    endpoints: {
      'GET /api/test': 'This message',
      'GET /api/supabase': 'API documentation',
      'GET /api/supabase/:table': 'Get data from table',
      'POST /api/supabase/:table': 'Submit data to table',
      'GET /api/debug': 'Debug environment variables'
    },
    timestamp: new Date().toISOString()
  });
}
