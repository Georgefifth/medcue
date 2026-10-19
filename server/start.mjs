import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiHandler } from './ai.mjs';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.srt': 'application/x-subrip', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  try {
    await aiHandler(req, res, async () => {
      if (req.url === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end(); }
      let pathname;
      try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400); return res.end(); }
      const target = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
      if (!target.startsWith(root.endsWith(sep) ? root : root + sep)) { res.writeHead(403); return res.end(); }
      try {
        if (!(await stat(target)).isFile()) throw new Error('not a file');
        const content = await readFile(target);
        res.writeHead(200, { 'Content-Type': types[extname(target)] || 'application/octet-stream', 'Cache-Control': extname(target) === '.html' ? 'no-cache' : 'public, max-age=3600' });
        res.end(req.method === 'HEAD' ? undefined : content);
      } catch { res.writeHead(404); res.end('Not found'); }
    });
  } catch { if (!res.headersSent) res.writeHead(500); res.end(); }
});
server.requestTimeout = 60000;
server.listen(Number(process.env.PORT) || 8080, process.env.HOST || '127.0.0.1', () => console.log(`MedCue server ready on port ${server.address().port}`));
