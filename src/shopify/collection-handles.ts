const COLLECTION_DISPLAY_TITLES: Record<string, string> = {
  aguas: 'Aguas',
  refrescos: 'Refrescos',
};

/** Handle de la URL (/categorias/:handle) → handle en Shopify Storefront API */
export function resolveShopifyCollectionHandle(urlHandle: string): string {
  return urlHandle;
}

/** Handle de Shopify → handle canónico para URLs internas */
export function toCanonicalCollectionHandle(shopifyHandle: string): string {
  return shopifyHandle;
}

/** Título para UI/SEO a partir del handle de la URL */
export function getCollectionDisplayTitle(urlHandle: string): string | undefined {
  return COLLECTION_DISPLAY_TITLES[urlHandle];
}
