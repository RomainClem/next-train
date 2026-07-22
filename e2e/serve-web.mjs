// Minimal static file server for the exported Expo web build (`dist/`).
// Zero dependencies. Used as the Playwright `webServer` so tests run against a
// fast, pre-built bundle instead of the Metro dev server (no per-navigation
// re-bundling, no long silent startup).
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const ROOT = join(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 8099);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`[serve-web] No build at ${ROOT}. Run: npx expo export -p web`);
  process.exit(1);
}

/** Resolve a request path to a file inside dist, or null. */
function resolveFile(pathname) {
  // Prevent path traversal.
  const rel = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = [
    join(ROOT, rel),
    join(ROOT, `${rel}.html`), // `/search` -> `search.html`
    join(ROOT, rel, 'index.html'),
  ];
  for (const c of candidates) {
    if (existsSync(c) && statSync(c).isFile()) return c;
  }
  return null;
}

createServer((req, res) => {
  const pathname = (req.url ?? '/').split('?')[0];
  // Static-rendered SPA: unknown routes fall back to index.html so
  // client-side navigation still resolves.
  const file =
    pathname === '/' ? join(ROOT, 'index.html') : (resolveFile(pathname) ?? join(ROOT, 'index.html'));

  res.setHeader('Content-Type', TYPES[extname(file)] ?? 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  createReadStream(file)
    .on('error', () => {
      res.statusCode = 500;
      res.end('read error');
    })
    .pipe(res);
}).listen(PORT, () => {
  console.log(`[serve-web] serving ${ROOT} at http://localhost:${PORT}`);
});
