/**
 * Genera public/sitemap.xml con URLs canónicas headless.
 * Productos: valores SEO de public/product-handle-redirects.json → /producto/{handle}
 *
 * Uso: node scripts/generate-sitemap.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const MAP_PATH = resolve(ROOT, 'public/product-handle-redirects.json');
const OUT_PATH = resolve(ROOT, 'public/sitemap.xml');
const SITE = (process.env.SITEMAP_SITE_URL || 'https://www.mrbrown.com.mx').replace(/\/$/, '');

const STATIC_PATHS = [
  '/',
  '/productos',
  '/cotizar-evento',
  '/page/sobre-nosotros',
  '/preguntas-frecuentes',
  '/contacto',
  '/blog',
  '/aviso-de-privacidad',
  '/politica-de-reembolso',
  '/terminos-de-servicio',
];

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, { changefreq = 'weekly', priority = '0.5' } = {}) {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function main() {
  if (!existsSync(MAP_PATH)) {
    throw new Error(`Falta mapa de handles: ${MAP_PATH}`);
  }

  const map = JSON.parse(readFileSync(MAP_PATH, 'utf8'));
  const handles = [
    ...new Set(
      Object.values(map)
        .map((h) => String(h || '').trim())
        .filter(Boolean),
    ),
  ].sort();

  const urls = [
    ...STATIC_PATHS.map((p) =>
      urlEntry(`${SITE}${p === '/' ? '/' : p}`, {
        changefreq: p === '/' || p === '/productos' ? 'daily' : 'weekly',
        priority: p === '/' ? '1.0' : p === '/productos' ? '0.9' : '0.7',
      }),
    ),
    ...handles.map((h) =>
      urlEntry(`${SITE}/producto/${h}`, { changefreq: 'weekly', priority: '0.6' }),
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;

  writeFileSync(OUT_PATH, xml, 'utf8');
  console.log(
    `[sitemap] ${OUT_PATH} (${STATIC_PATHS.length} estáticas + ${handles.length} productos)`,
  );
}

main();
