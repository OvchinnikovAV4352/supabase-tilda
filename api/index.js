export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>🚀 Tilda + Supabase Proxy</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        max-width: 1000px; 
        margin: 0 auto; 
        padding: 20px; 
        line-height: 1.6; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        min-height: 100vh;
        color: white;
      }
      .container {
        background: rgba(255,255,255,0.95);
        border-radius: 20px;
        padding: 40px;
        margin-top: 30px;
        color: #333;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      }
      h1 { 
        font-size: 3em; 
        margin-bottom: 10px; 
        background: linear-gradient(45deg, #667eea, #764ba2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      h2 { color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
      .endpoint { 
        background: #f8f9fa; 
        border-left: 4px solid #667eea; 
        padding: 15px; 
        margin: 15px 0; 
        border-radius: 0 8px 8px 0;
        transition: transform 0.2s;
      }
      .endpoint:hover { transform: translateX(5px); }
      code { 
        background: #e9ecef; 
        padding: 4px 8px; 
        border-radius: 4px; 
        font-family: 'Courier New', monospace; 
        font-size: 0.9em; 
      }
      .method { 
        display: inline-block; 
        padding: 4px 12px; 
        border-radius: 4px; 
        font-weight: bold; 
        margin-right: 10px; 
        font-size: 0.8em;
      }
      .get { background: #61affe; color: white; }
      .post { background: #49cc90; color: white; }
      .put { background: #fca130; color: white; }
      .delete { background: #f93e3e; color: white; }
      .status { 
        display: inline-block; 
        padding: 2px 8px; 
        background: #28a745; 
        color: white; 
        border-radius: 12px; 
        font-size: 0.8em; 
        margin-left: 10px; 
      }
      a { 
        color: #667eea; 
        text-decoration: none; 
        font-weight: 500; 
      }
      a:hover { text-decoration: underline; }
      .btn {
        display: inline-block;
        background: #667eea;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        text-decoration: none;
        margin: 10px 5px;
        transition: background 0.3s;
      }
      .btn:hover {
        background: #764ba2;
        text-decoration: none;
      }
      .test-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 20px 0;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>🚀 Tilda + Supabase Proxy API</h1>
      <p>Универсальный прокси для интеграции форм Tilda с базой данных Supabase</p>
      
      <div class="test-buttons">
        <a href="/api/health" class="btn">🩺 Health Check</a>
        <a href="/api/debug" class="btn">🐛 Debug Info</a>
        <a href="/api/proxy" class="btn">📡 Proxy API</a>
        <a href="/api/tilda/form" class="btn">📝 Tilda Forms</a>
      </div>
      
      <h2>📡 Доступные Endpoints</h2>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/api/health</code> <span class="status">работает</span>
        <p>Проверка работоспособности сервиса</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/api/debug</code> <span class="status">работает</span>
        <p>Отладка переменных окружения и конфигурации</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/api/proxy</code> <span class="status">работает</span>
        <p>Документация универсального Supabase прокси</p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/api/proxy/:table</code>
        <p>Получить все записи из таблицы</p>
        <p><small>Пример: <code>/api/proxy/leads</code> - получить все лиды</small></p>
      </div>
      
      <div class="endpoint">
        <span class="method get">GET</span> <code>/api/proxy/:table/:id</code>
        <p>Получить одну запись по ID</p>
        <p><small>Пример: <code>/api/proxy/leads/123</code></small></p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/api/proxy/:table</code>
        <p>Создать новую запись в таблице</p>
        <p><small>Пример: <code>POST /api/proxy/leads</code> с JSON телом</small></p>
      </div>
      
      <div class="endpoint">
        <span class="method post">POST</span> <code>/api/tilda/form</code> <span class="status">работает</span>
        <p>Специальный endpoint для форм Tilda</p>
        <p><small>Пример: <code>POST /api/tilda/form?table=leads</code></small></p>
      </div>
      
      <h2>🔧 Интеграция с Tilda</h2>
      <p>В настройках формы Tilda установите:</p>
      <ul>
        <li><strong>URL:</strong> <code>POST https://${req.headers.host}/api/tilda/form?table=название_таблицы</code></li>
        <li><strong>Метод:</strong> <code>POST</code></li>
        <li><strong>Формат:</strong> <code>JSON</code></li>
        <li><strong>Тело запроса:</strong> <code>{{all form fields}}</code></li>
      </ul>
      
      <h2>🧪 Быстрое тестирование</h2>
      <div class="test-buttons">
        <button onclick="testGet()" class="btn">🔍 GET Test</button>
        <button onclick="testPost()" class="btn">📤 POST Test</button>
        <button onclick="testTilda()" class="btn">📝 Tilda Test</button>
      </div>
      
      <script>
        const BASE_URL = '${req.headers.host}';
        
        async function testGet() {
          try {
            const res = await fetch('/api/proxy/leads?limit=2');
            const data = await res.json();
            alert('GET Test: ' + (data.success ? '✅ Success' : '❌ Failed'));
            console.log('GET Result:', data);
          } catch (error) {
            alert('GET Test Error: ' + error.message);
          }
        }
        
        async function testPost() {
          try {
            const res = await fetch('/api/proxy/test_table', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: 'Test User',
                email: 'test@example.com',
                test: true,
                timestamp: new Date().toISOString()
              })
            });
            const data = await res.json();
            alert('POST Test: ' + (data.success ? '✅ Created ID: ' + data.data?.id : '❌ Failed'));
          } catch (error) {
            alert('POST Test Error: ' + error.message);
          }
        }
        
        async function testTilda() {
          try {
            const res = await fetch('/api/tilda/form?table=test_table', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                formid: 'test_form_123',
                name: 'Tilda User',
                email: 'tilda@example.com',
                phone: '+1234567890',
                message: 'Test from Tilda form'
              })
            });
            const data = await res.json();
            alert('Tilda Test: ' + (data.success ? '✅ Submitted' : '❌ Failed'));
          } catch (error) {
            alert('Tilda Test Error: ' + error.message);
          }
        }
      </script>
      
      <footer style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666;">
        <p>🚀 API работает на Vercel • Node.js ${process.version} • ${new Date().toLocaleDateString('ru-RU')}</p>
      </footer>
    </div>
  </body>
  </html>
  `;
  
  res.send(html);
}
