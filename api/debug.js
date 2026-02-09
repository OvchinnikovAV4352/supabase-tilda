export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? 
      `${process.env.SUPABASE_URL.substring(0, 30)}...` : '❌ MISSING',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 
      '✅ SET (hidden for security)' : '❌ MISSING',
    NODE_ENV: process.env.NODE_ENV || 'development',
    VERCEL: process.env.VERCEL ? '✅ Deployed on Vercel' : '⚠️ Local',
    NODE_VERSION: process.version
  };
  
  return res.json({
    status: 'debug',
    environment: env,
    instructions: {
      missing_variables: 'Add SUPABASE_URL and SUPABASE_SERVICE_KEY in Vercel Project Settings → Environment Variables',
      testing: 'Test with: GET /api/proxy/leads, POST /api/tilda/form',
      tilda_integration: 'Set form action to: POST /api/tilda/form?table=your_table'
    },
    timestamp: new Date().toISOString()
  });
}
