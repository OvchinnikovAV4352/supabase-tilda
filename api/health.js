export default function handler(req, res) {
  return res.status(200).json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString(),
    path: req.url
  });
}
