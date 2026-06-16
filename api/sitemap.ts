/**
 * Genera sitemap.xml con las URLs canónicas en español del headless storefront.
 * Expuesto en /sitemap.xml vía rewrite en vercel.json.
 */
export const config = { runtime: 'nodejs' };

const SITE_ORIGIN = 'https://www.mrbrown.com.mx';
const API_VERSION = '2024-10';
const PAGE_SIZE = 250;

type SitemapUrl = {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
};

const STATIC_PAGES: SitemapUrl[] = [
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

function getStorefrontCredentials(): { domain: string; token: string } | null {
  const domain =
    process.env.VITE_SHOPIFY_STORE_DOMAIN ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    '';
  const token =
    process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    '';
  if (!domain || !token || domain.includes('YOUR_STORE')) return null;
  return { domain, token };
}

async function storefrontRequest<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const creds = getStorefrontCredentials();
  if (!creds) throw new Error('Shopify Storefront API no configurada');

  const res = await fetch(
    `https://${creds.domain}/api/${API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': creds.token,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!res.ok) {
    throw new Error(`Storefront API HTTP ${res.status}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }
  if (!json.data) throw new Error('Storefront API sin datos');
  return json.data;
}

function toIsoDate(value?: string | null): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

async function fetchProductUrls(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = [];
  let after: string | null = null;
  let hasNextPage = true;

  const query = `
    query SitemapProducts($first: Int!, $after: String) {
      products(first: $first, after: $after) {
        edges {
          cursor
          node {
            handle
            updatedAt
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  `;

  while (hasNextPage) {
    const data = await storefrontRequest<{
      products: {
        edges: { cursor: string; node: { handle: string; updatedAt: string } }[];
        pageInfo: { hasNextPage: boolean };
      };
    }>(query, { first: PAGE_SIZE, after });

    for (const { node, cursor } of data.products.edges) {
      if (!node.handle) continue;
      urls.push({
        loc: `/producto/${node.handle}`,
        lastmod: toIsoDate(node.updatedAt),
        changefreq: 'weekly',
        priority: 0.8,
      });
      after = cursor;
    }
    hasNextPage = data.products.pageInfo.hasNextPage;
  }

  return urls;
}

async function fetchCollectionUrls(): Promise<SitemapUrl[]> {
  const query = `
    query SitemapCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            handle
            updatedAt
          }
        }
      }
    }
  `;

  const data = await storefrontRequest<{
    collections: {
      edges: { node: { handle: string; updatedAt: string } }[];
    };
  }>(query, { first: PAGE_SIZE });

  return data.collections.edges
    .map(({ node }) => node)
    .filter((c) => c.handle && c.handle !== 'ofertas-relampago')
    .map((c) => ({
      loc: `/categorias/${c.handle}`,
      lastmod: toIsoDate(c.updatedAt),
      changefreq: 'weekly' as const,
      priority: 0.85,
    }));
}

async function fetchArticleUrls(): Promise<SitemapUrl[]> {
  const query = `
    query SitemapArticles($first: Int!) {
      articles(first: $first, sortKey: PUBLISHED_AT, reverse: true) {
        edges {
          node {
            handle
            publishedAt
          }
        }
      }
    }
  `;

  const data = await storefrontRequest<{
    articles: {
      edges: { node: { handle: string; publishedAt: string } }[];
    };
  }>(query, { first: PAGE_SIZE });

  return data.articles.edges
    .map(({ node }) => node)
    .filter((a) => a.handle)
    .map((a) => ({
      loc: `/blog/${a.handle}`,
      lastmod: toIsoDate(a.publishedAt),
      changefreq: 'monthly' as const,
      priority: 0.6,
    }));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSitemapXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((entry) => {
      const loc = escapeXml(`${SITE_ORIGIN}${entry.loc}`);
      const parts = [`    <loc>${loc}</loc>`];
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`);
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`);
      if (entry.priority != null) parts.push(`    <priority>${entry.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const dynamicUrls = getStorefrontCredentials()
      ? await Promise.all([fetchProductUrls(), fetchCollectionUrls(), fetchArticleUrls()])
      : [[], [], []];

    const seen = new Set<string>();
    const allUrls: SitemapUrl[] = [];

    for (const entry of [...STATIC_PAGES, ...dynamicUrls.flat()]) {
      if (seen.has(entry.loc)) continue;
      seen.add(entry.loc);
      allUrls.push(entry);
    }

    const xml = buildSitemapXml(allUrls);

    return new Response(req.method === 'HEAD' ? null : xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (err) {
    console.error('[sitemap]', err);
    const xml = buildSitemapXml(STATIC_PAGES);
    return new Response(req.method === 'HEAD' ? null : xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300',
      },
    });
  }
}
