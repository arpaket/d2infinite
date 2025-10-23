const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const DATA_PATH = path.join(__dirname, '..', 'data', 'products.json');
let productsCache = [];

function loadProducts() {
  try {
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      productsCache = parsed;
    } else {
      console.warn('Products data is not an array, fallback to empty list');
      productsCache = [];
    }
  } catch (error) {
    console.error('Failed to read products data:', error);
    productsCache = [];
  }
}

loadProducts();

function sendJson(res, data, statusCode = 200) {
  const payload = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(payload);
}

function serveStaticFile(filePath, res) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('ไม่พบหน้าเว็บที่ร้องขอ');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const map = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    const contentType = map[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const { pathname, query } = parsedUrl;

  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/products') {
      let items = [...productsCache];
      if (query.category) {
        items = items.filter((product) => product.category === query.category);
      }
      sendJson(res, { products: items });
      return;
    }

    if (pathname === '/api/categories') {
      const categories = Array.from(new Set(productsCache.map((product) => product.category)));
      sendJson(res, { categories });
      return;
    }

    sendJson(res, { error: 'ไม่พบ API ที่ร้องขอ' }, 404);
    return;
  }

  let filePath = path.join(__dirname, '..', 'public', pathname === '/' ? 'index.html' : pathname);
  if (!filePath.startsWith(path.join(__dirname, '..', 'public'))) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  serveStaticFile(filePath, res);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
