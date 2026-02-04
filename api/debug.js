export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? 
      `${process.env.SUPABASE_URL.substring(0, 20)}...` : 'MISSING',
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY ? 
      'SET (hidden)' : 'MISSING',
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || 'not set'
  };
  
  return res.json({
    status: 'debug',
    environment: env,
    message: 'Environment variables check',
    note: 'If SUPABASE_URL is missing, add it in Vercel Project Settings → Environment Variables',
    timestamp: new Date().toISOString()
  });
}
