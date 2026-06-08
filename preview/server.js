const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const PORT = 3912;
const ROOT = __dirname;

const mime = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.mp4':   'video/mp4',
  '.mp3':   'audio/mpeg',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff':  'font/woff',
  '.ico':   'image/x-icon',
};

http.createServer((req, res) => {
  const parsed = url.parse(req.url);
  let filePath = path.join(ROOT, decodeURIComponent(parsed.pathname));
  if (filePath.endsWith('/') || !path.extname(filePath)) {
    filePath = path.join(filePath.replace(/\/$/, ''), 'index.html');
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    const ext   = path.extname(filePath).toLowerCase();
    const ct    = mime[ext] || 'application/octet-stream';
    const total = stat.size;
    const rangeHeader = req.headers['range'];

    if (rangeHeader) {
      const [, start, end] = /bytes=(\d+)-(\d*)/.exec(rangeHeader) || [];
      const s = parseInt(start, 10);
      const e = end ? parseInt(end, 10) : total - 1;
      const chunkSize = e - s + 1;
      const file = fs.createReadStream(filePath, { start: s, end: e });
      res.writeHead(206, {
        'Content-Range':  `bytes ${s}-${e}/${total}`,
        'Accept-Ranges':  'bytes',
        'Content-Length': chunkSize,
        'Content-Type':   ct,
        'Cache-Control':  'no-cache',
      });
      file.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Type':   ct,
        'Content-Length': total,
        'Accept-Ranges':  'bytes',
        'Cache-Control':  'no-cache',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  });
}).listen(PORT, () => {
  process.stdout.write(`IRTH v4 server running on http://localhost:${PORT}\n`);
});
