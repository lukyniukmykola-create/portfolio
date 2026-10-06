const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../outputs/mykola-lukyniuk.html');
http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/mykola-lukyniuk.html') {
    res.writeHead(200, {'Content-Type':'text/html; charset=utf-8', 'Cache-Control':'no-store'});
    res.end(fs.readFileSync(file));
  } else { res.writeHead(404); res.end('Not found'); }
}).listen(8765, '127.0.0.1', () => process.stdout.write('Preview: http://127.0.0.1:8765\n'));
