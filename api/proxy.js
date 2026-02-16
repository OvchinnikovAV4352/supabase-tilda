export default function handler(req, res) {
  // 1. CORS для всех
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 2. Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Получаем таблицу из query-параметра
  //    /api/proxy?table=sugnup
  const table = req.query.table;

  // 4. Если таблица не указана
  if (!table) {
    return res.status(200).json({
      success: true,
      message: 'Минимальный proxy работает!',
      usage: 'Добавь параметр table: /api/proxy?table=название',
      example: '/api/proxy?table=sugnup',
      query: req.query
    });
  }

  // 5. Просто возвращаем то, что получили
  return res.status(200).json({
    success: true,
    message: `Запрос к таблице: ${table}`,
    method: req.method,
    table: table,
    data: req.method === 'POST' ? req.body : null,
    timestamp: Date.now()
  });
}
