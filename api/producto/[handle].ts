/**
 * Vercel Edge Function: SSR de metadatos para páginas de producto.
 *
 * Intercepta /producto/:handle, obtiene el producto de Shopify Storefront API
 * y sirve el index.html con las metas SEO inyectadas (title, description,
 * canonical, Open Graph, Twitter Cards, JSON-LD Product).
 *
 * Esto permite que Googlebot indexe las metas de producto sin ejecutar JS.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = {
  runtime: 'edge',
};

const SITE_NAME = 'Mr. Brown';
const SITE_URL = 'https://www.mrbrown.com.mx';
const TITLE_SUFFIX = ` | ${SITE_NAME}`;
const DEFAULT_TITLE = 'Vinos, Licores y más.. Mr. Brown';
const DEFAULT_DESCRIPTION =
  'Vinos, licores y bebidas premium en línea: tequila, whisky, mezcal, gin y mixología con envío rápido en CDMX y zona metropolitana. 100% originales y barras para eventos.';

interface ShopifyProductResponse {
  data?: {
    product?: {
      id: string;
      title: string;
      description: string;
      handle: string;
      productType: string;
      vendor: string;
      tags: string[];
      seo?: {
        title?: string | null;
        description?: string | null;
      };
      priceRange: {
        minVariantPrice: {
          amount: string;
          currencyCode: string;
        };
      };
      images: {
        edges: Array<{
          node: {
            url: string;
            altText: string | null;
          };
        }>;
      };
      variants: {
        edges: Array<{
          node: {
            id: string;
            sku: string | null;
            barcode: string | null;
            availableForSale: boolean;
            price: {
              amount: string;
              currencyCode: string;
            };
          };
        }>;
      };
      metafields?: Array<{
        key: string;
        value: string;
        namespace: string;
      } | null>;
    } | null;
  };
  errors?: unknown;
}

const GET_PRODUCT_FOR_SEO = `
  query GetProductForSEO($handle: String!) {
    product(handle: $handle) {
      id
      title
      description
      handle
      productType
      vendor
      tags
      seo {
        title
        description
      }
      priceRange {
        minVariantPrice {
          amount
          currencyCode
        }
      }
      images(first: 5) {
        edges {
          node {
            url
            altText
          }
        }
      }
      variants(first: 1) {
        edges {
          node {
            id
            sku
            barcode
            availableForSale
            price {
              amount
              currencyCode
            }
          }
        }
      }
    }
  }
`;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeJsonLd(str: string): string {
  return str.replace(/<\/script/gi, '<\\/script');
}

function truncate(text: string, max: number): string {
  if (!text) return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 1).trimEnd()}…`;
}

interface ProductData {
  name: string;
  description: string;
  handle: string;
  price: number;
  currency: string;
  availableForSale: boolean;
  images: string[];
  sku: string | null;
  gtin: string | null;
  vendor: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  productType: string | null;
}

function buildMetaDescription(product: ProductData): string {
  if (product.seoDescription) {
    return truncate(product.seoDescription, 160);
  }
  const parts = [
    product.vendor && `Marca: ${product.vendor}.`,
    product.productType && `Tipo: ${product.productType}.`,
    `Precio $${product.price.toFixed(2)} MXN.`,
    'Compra en Mr. Brown con envío rápido en CDMX.',
    product.description ? truncate(product.description, 80) : '',
  ].filter(Boolean);
  return truncate(parts.join(' '), 160);
}

function buildProductJsonLd(product: ProductData): object {
  const canonical = `${SITE_URL}/producto/${product.handle}`;
  const availability = product.availableForSale
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock';

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: canonical,
    description: product.description
      ? truncate(product.description.replace(/\s+/g, ' ').trim(), 500)
      : undefined,
    offers: {
      '@type': 'Offer',
      url: canonical,
      priceCurrency: product.currency,
      price: product.price.toFixed(2),
      availability,
      itemCondition: 'https://schema.org/NewCondition',
    },
  };

  if (product.images.length > 0) {
    schema.image = product.images.slice(0, 5);
  }

  if (product.vendor) {
    schema.brand = { '@type': 'Brand', name: product.vendor };
  }

  if (product.sku) {
    schema.sku = product.sku;
  }

  if (product.gtin) {
    schema.gtin = product.gtin;
  }

  if (product.productType) {
    schema.category = product.productType;
  }

  return schema;
}

function buildFullTitle(product: ProductData): string {
  const baseTitle = product.seoTitle || product.name;
  if (baseTitle.includes(SITE_NAME)) {
    return baseTitle;
  }
  return `${baseTitle}${TITLE_SUFFIX}`;
}

function injectProductMetas(
  html: string,
  product: ProductData
): string {
  const canonical = `${SITE_URL}/producto/${product.handle}`;
  const fullTitle = buildFullTitle(product);
  const description = buildMetaDescription(product);
  const ogImage = product.images[0] || `${SITE_URL}/og-share.jpg`;
  const availability = product.availableForSale ? 'in stock' : 'out of stock';
  const jsonLd = buildProductJsonLd(product);

  const escapedTitle = escapeHtml(fullTitle);
  const escapedDescription = escapeHtml(description);
  const escapedCanonical = escapeHtml(canonical);
  const escapedImage = escapeHtml(ogImage);
  const escapedImageAlt = escapeHtml(`${product.name} — Mr. Brown`);
  const jsonLdString = escapeJsonLd(JSON.stringify(jsonLd));

  // Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/i,
    `<title>${escapedTitle}</title>`
  );

  // Replace canonical
  html = html.replace(
    /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${escapedCanonical}" />`
  );

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escapedDescription}" />`
  );

  // Replace Open Graph metas
  html = html.replace(
    /<meta\s+property="og:type"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:type" content="product" />`
  );
  html = html.replace(
    /<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:title" content="${escapedTitle}" />`
  );
  html = html.replace(
    /<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:description" content="${escapedDescription}" />`
  );
  html = html.replace(
    /<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${escapedCanonical}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image" content="${escapedImage}" />`
  );
  html = html.replace(
    /<meta\s+property="og:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:image:alt" content="${escapedImageAlt}" />`
  );

  // Remove og:image:width and og:image:height (product images have unknown dimensions)
  html = html.replace(/<meta\s+property="og:image:width"\s+content="[^"]*"\s*\/?>\s*/gi, '');
  html = html.replace(/<meta\s+property="og:image:height"\s+content="[^"]*"\s*\/?>\s*/gi, '');

  // Replace Twitter Card metas
  html = html.replace(
    /<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:title" content="${escapedTitle}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:description" content="${escapedDescription}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image" content="${escapedImage}" />`
  );
  html = html.replace(
    /<meta\s+name="twitter:image:alt"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="twitter:image:alt" content="${escapedImageAlt}" />`
  );

  // Inject product-specific OG metas before </head>
  const productMetas = `
    <meta property="product:price:amount" content="${product.price.toFixed(2)}" />
    <meta property="product:price:currency" content="${product.currency}" />
    <meta property="product:availability" content="${availability}" />
  `;
  html = html.replace('</head>', `${productMetas}</head>`);

  // Inject JSON-LD Product schema before </head>, marked for client detection
  const jsonLdScript = `<script type="application/ld+json" data-ssr-product="true">${jsonLdString}</script>`;
  html = html.replace('</head>', `${jsonLdScript}\n</head>`);

  return html;
}

async function fetchProductFromShopify(
  handle: string,
  storeDomain: string,
  storefrontToken: string
): Promise<ProductData | null> {
  const apiUrl = `https://${storeDomain}/api/2024-10/graphql.json`;

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': storefrontToken,
    },
    body: JSON.stringify({
      query: GET_PRODUCT_FOR_SEO,
      variables: { handle },
    }),
  });

  if (!response.ok) {
    console.error(`[producto-ssr] Shopify HTTP error: ${response.status}`);
    return null;
  }

  const json = (await response.json()) as ShopifyProductResponse;

  if (json.errors) {
    console.error('[producto-ssr] Shopify GraphQL errors:', json.errors);
    return null;
  }

  const product = json.data?.product;
  if (!product) {
    return null;
  }

  const firstVariant = product.variants.edges[0]?.node;
  const images = product.images.edges.map((e) => e.node.url).filter(Boolean);
  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const availableForSale = product.variants.edges.some(
    (e) => e.node.availableForSale
  );

  return {
    name: product.title,
    description: product.description,
    handle: product.handle,
    price,
    currency: product.priceRange.minVariantPrice.currencyCode || 'MXN',
    availableForSale,
    images,
    sku: firstVariant?.sku || null,
    gtin: firstVariant?.barcode || null,
    vendor: product.vendor || null,
    seoTitle: product.seo?.title || null,
    seoDescription: product.seo?.description || null,
    productType: product.productType || null,
  };
}

async function fetchIndexHtml(req: Request): Promise<string> {
  const url = new URL(req.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  const indexUrl = `${baseUrl}/index.html`;

  const response = await fetch(indexUrl, {
    headers: {
      'User-Agent': 'Vercel-Edge-Function/SSR',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch index.html: ${response.status}`);
  }

  return response.text();
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  const handle = pathParts[1];

  if (!handle) {
    return new Response('Not Found', { status: 404 });
  }

  const storeDomain = process.env.VITE_SHOPIFY_STORE_DOMAIN;
  const storefrontToken = process.env.VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN;

  if (!storeDomain || !storefrontToken) {
    console.error(
      '[producto-ssr] Missing VITE_SHOPIFY_STORE_DOMAIN or VITE_SHOPIFY_STOREFRONT_ACCESS_TOKEN'
    );
    try {
      const html = await fetchIndexHtml(req);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    } catch {
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  try {
    const [product, indexHtml] = await Promise.all([
      fetchProductFromShopify(handle, storeDomain, storefrontToken),
      fetchIndexHtml(req),
    ]);

    if (!product) {
      return new Response(indexHtml, {
        status: 404,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const finalHtml = injectProductMetas(indexHtml, product);

    return new Response(finalHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[producto-ssr] Error:', error);

    try {
      const html = await fetchIndexHtml(req);
      return new Response(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    } catch {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
}
