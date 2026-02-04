export default async function handler(req, res) {
  // Всегда возвращаем 200
  res.status(200).json({
    success: true,
    message: 'Supabase proxy is working',
    endpoint: req.url,
    method: req.method
  });
}
