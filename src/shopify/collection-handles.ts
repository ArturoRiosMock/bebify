/**
 * En Admin, las colecciones `aguas` y `refrescos` tienen el handle invertido
 * respecto a su contenido. Las URLs públicas usan handles semánticos; al consultar
 * Shopify se resuelve al handle real de la colección.
 */
const SWAPPED_COLLECTION_HANDLES: Record<string, string> = {
  aguas: 'refrescos',
  refrescos: 'aguas',
};

/** Handle de la URL (/categorias/:handle) → handle en Shopify Storefront API */
export function resolveShopifyCollectionHandle(urlHandle: string): string {
  return SWAPPED_COLLECTION_HANDLES[urlHandle] ?? urlHandle;
}

/** Handle de Shopify → handle canónico para URLs internas */
export function toCanonicalCollectionHandle(shopifyHandle: string): string {
  return SWAPPED_COLLECTION_HANDLES[shopifyHandle] ?? shopifyHandle;
}

const COLLECTION_DISPLAY_TITLES: Record<string, string> = {
  aguas: 'Refrescos',
  refrescos: 'Aguas',
};

/** Título para UI/SEO a partir del handle de la URL */
export function getCollectionDisplayTitle(urlHandle: string): string | undefined {
  return COLLECTION_DISPLAY_TITLES[urlHandle];
}
