/**
 * Genera public/sitemap.xml antes del build de Vite.
 * Usa las rutas canónicas en español (/producto, /categorias, /blog).
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../public/sitemap.xml');

const SITE_ORIGIN = 'https://www.mrbrown.com.mx';
const API_VERSION = '2024-10';
const PAGE_SIZE = 250;

const STATIC_PAGES = [
  { loc: '/', changefreq: 'daily', priority: 1 },
  { loc: '/productos', changefreq: 'daily', priority: 0.9 },
  { loc: '/cotizar-evento', changefreq: 'monthly', priority: 0.7 },
  { loc: '/page/sobre-nosotros', changefreq: 'monthly', priority: 0.6 },
  { loc: '/preguntas-frecuentes', changefreq: 'monthly', priority: 0.5 },
  { loc: '/contacto', changefreq: 'monthly', priority: 0.6 },
  { loc: '/blog', changefreq: 'weekly', priority: 0.7 },
  { loc: '/aviso-de-privacidad', changefreq: 'yearly', priority: 0.3 },
  { loc: '/politica-de-reembolso', changefreq: 'yearly', priority: 0.3 },
  { loc: '/terminos-de-servicio', changefreq: 'yearly', priority: 0.3 },
];

function credentials() {
  const domain =
    process.env.VITE_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN || '';
  const token =
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    '';
  if (!domain || !token || domain.includes('YOUR_STORE')) return null;
  return { domain, token };
}

async function storefront(query, variables = {}) {
  const creds = credentials();
  if (!creds) return null;

  const res = await fetch(`https://${creds.domain}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': creds.token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Storefront HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join('; '));
  return json.data;
}

function toIsoDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

async function fetchProducts() {
  const urls = [];
  let after = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const data = await storefront(
      `query($first:Int!,$after:String){
        products(first:$first,after:$after){
          edges{cursor node{handle updatedAt}}
          pageInfo{hasNextPage}
        }
      }`,
      { first: PAGE_SIZE, after }
    );
    if (!data) break;

    for (const { node, cursor } of data.products.edges) {
      if (node.handle) {
        urls.push({
          loc: `/producto/${node.handle}`,
          lastmod: toIsoDate(node.updatedAt),
          changefreq: 'weekly',
          priority: 0.8,
        });
      }
      after = cursor;
    }
    hasNextPage = data.products.pageInfo.hasNextPage;
  }
  return urls;
}

async function fetchCollections() {
  const data = await storefront(
    `query($first:Int!){
      collections(first:$first){
        edges{node{handle updatedAt}}
      }
    }`,
    { first: PAGE_SIZE }
  );
  if (!data) return [];

  return data.collections.edges
    .map(({ node }) => node)
    .filter((c) => c.handle && c.handle !== 'ofertas-relampago')
    .map((c) => ({
      loc: `/categorias/${c.handle}`,
      lastmod: toIsoDate(c.updatedAt),
      changefreq: 'weekly',
      priority: 0.85,
    }));
}

async function fetchArticles() {
  const data = await storefront(
    `query($first:Int!){
      articles(first:$first,sortKey:PUBLISHED_AT,reverse:true){
        edges{node{handle publishedAt}}
      }
    }`,
    { first: PAGE_SIZE }
  );
  if (!data) return [];

  return data.articles.edges
    .map(({ node }) => node)
    .filter((a) => a.handle)
    .map((a) => ({
      loc: `/blog/${a.handle}`,
      lastmod: toIsoDate(a.publishedAt),
      changefreq: 'monthly',
      priority: 0.6,
    }));
}

function escapeXml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildXml(urls) {
  const body = urls
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(`${SITE_ORIGIN}${entry.loc}`)}</loc>`];
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority != null) parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

async function main() {
  let dynamic = [];
  try {
    if (credentials()) {
      const [products, collections, articles] = await Promise.all([
        fetchProducts(),
        fetchCollections(),
        fetchArticles(),
      ]);
      dynamic = [...products, ...collections, ...articles];
      console.log(
        `[sitemap] ${products.length} productos, ${collections.length} colecciones, ${articles.length} artículos`
      );
    } else {
      console.warn('[sitemap] Shopify no configurado — solo páginas estáticas');
    }
  } catch (err) {
    console.warn('[sitemap] Error al consultar Shopify:', err.message);
  }

  const seen = new Set();
  const all = [];
  for (const entry of [...STATIC_PAGES, ...dynamic]) {
    if (seen.has(entry.loc)) continue;
    seen.add(entry.loc);
    all.push(entry);
  }

  writeFileSync(OUT, buildXml(all), 'utf8');
  console.log(`[sitemap] Escrito ${all.length} URLs → public/sitemap.xml`);
}

main();
