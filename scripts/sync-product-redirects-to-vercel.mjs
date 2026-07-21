/**
 * Sincroniza public/product-handle-redirects.json →
 *   1) middleware.js (308 en edge — escala a miles de handles)
 *   2) limpia redirects de producto en vercel.json (límite ~1024 de Vercel)
 *
 * Uso:
 *   node scripts/sync-product-redirects-to-vercel.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MAP_PATH = resolve(ROOT, 'public/product-handle-redirects.json');
const VERCEL_PATH = resolve(ROOT, 'vercel.json');
const MIDDLEWARE_PATH = resolve(ROOT, 'middleware.js');

function isStaticRedirect(r) {
  const src = String(r?.source || '');
  if (src.includes(':')) return true;
  if (!/^\/(producto|products)\/[^/]+$/.test(src)) return true;
  return false;
}

function writeMiddleware(map) {
  const body = `/**
 * Generado por scripts/sync-product-redirects-to-vercel.mjs — no editar a mano.
 * 308 old SKU handle → SEO handle en mrbrown.com.mx
 */
const MAP = ${JSON.stringify(map)};

export const config = {
  matcher: ['/producto/:handle*', '/products/:handle*'],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return;
  const handle = parts[1];
  const next = MAP[handle];
  if (!next || next === handle) return;
  url.pathname = '/producto/' + next;
  return Response.redirect(url, 308);
}
`;
  writeFileSync(MIDDLEWARE_PATH, body, 'utf8');
}

function cleanVercelJson() {
  if (!existsSync(VERCEL_PATH)) return 0;
  const vercel = JSON.parse(readFileSync(VERCEL_PATH, 'utf8'));
  const existing = Array.isArray(vercel.redirects) ? vercel.redirects : [];
  const staticRedirects = existing.filter(isStaticRedirect);
  const removed = existing.length - staticRedirects.length;
  vercel.redirects = staticRedirects;
  writeFileSync(VERCEL_PATH, JSON.stringify(vercel, null, 2) + '\n', 'utf8');
  return removed;
}

function main() {
  if (!existsSync(MAP_PATH)) {
    throw new Error(`Falta mapa: ${MAP_PATH}`);
  }
  const map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
  writeMiddleware(map);
  const removed = cleanVercelJson();
  console.log(
    `OK: middleware.js con ${Object.keys(map).length} handles; vercel.json sin ${removed} redirects de producto (estáticos conservados)`
  );
}

main();
