// Tipos para productos de Shopify
export interface ShopifyProduct {
  id: string;
  title: string;
  description: string;
  descriptionHtml: string;
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
    maxVariantPrice: {
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
      node: ShopifyVariant;
    }>;
  };
}

export interface ShopifyVariant {
  id: string;
  title: string;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice: {
    amount: string;
    currencyCode: string;
  } | null;
  availableForSale: boolean;
  image: {
    url: string;
    altText: string | null;
  } | null;
  selectedOptions: Array<{
    name: string;
    value: string;
  }>;
}

// Tipo para colecciones
export interface ShopifyCollection {
  id: string;
  title: string;
  handle: string;
  description: string;
  image: {
    url: string;
    altText: string | null;
  } | null;
  products: {
    edges: Array<{
      node: ShopifyProduct;
    }>;
  };
}

// Tipos para el carrito
export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  cost: {
    subtotalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalAmount: {
      amount: string;
      currencyCode: string;
    };
    totalTaxAmount: {
      amount: string;
      currencyCode: string;
    } | null;
  };
  lines: {
    edges: Array<{
      node: ShopifyCartLine;
    }>;
  };
  totalQuantity: number;
}

export interface ShopifyCartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      id: string;
      title: string;
      handle: string;
    };
    image: {
      url: string;
      altText: string | null;
    } | null;
    price: {
      amount: string;
      currencyCode: string;
    };
    selectedOptions?: Array<{ name: string; value: string }>;
  };
}

// === BLOG ===

export interface ShopifyArticleImage {
  url: string;
  altText: string | null;
  width?: number | null;
  height?: number | null;
}

export interface ShopifyArticleAuthor {
  name: string;
  bio?: string | null;
}

export interface ShopifyArticle {
  id: string;
  handle: string;
  title: string;
  excerpt: string | null;
  contentHtml?: string;
  publishedAt: string;
  tags: string[];
  authorV2: ShopifyArticleAuthor | null;
  image: ShopifyArticleImage | null;
  blog?: { handle: string; title: string } | null;
}

/** Tipo simplificado usado en componentes (lista o detalle). */
export interface BlogArticle {
  id: string;
  handle: string;
  title: string;
  excerpt: string;
  contentHtml?: string;
  publishedAt: string;
  tags: string[];
  authorName?: string;
  authorBio?: string;
  image?: { url: string; alt: string };
  blogHandle?: string;
}

// Tipo para checkout
export interface ShopifyCheckout {
  id: string;
  webUrl: string;
  ready: boolean;
  totalPrice: {
    amount: string;
    currencyCode: string;
  };
}

// Tipo convertido al formato de la app
export interface Product {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  description: string;
  descriptionHtml?: string;
  image: string;
  images?: string[];
  shopifyId?: string;
  variantId?: string;
  handle?: string;
  /** Valor de la opción de variante "Cantidad" en Shopify (ej. "1 Botella") */
  cantidadLabel?: string;
  vendor?: string;
  tags?: string[];
  /** Graduación alcohólica (ej. "40% Vol.") — NOM-142-SSA1/SCFI-2014 */
  abvLabel?: string;
  /** Contenido neto / capacidad (ej. "750 ml") — NOM-142-SSA1/SCFI-2014 */
  volumeLabel?: string;
  /** Tipo de bebida (ej. "Whisky", "Tequila") — NOM-142-SSA1/SCFI-2014 */
  beverageType?: string;
  /** País / región de origen (ej. "México") — NOM-142-SSA1/SCFI-2014 */
  origin?: string;
  /** Meta title de Shopify Admin (seo.title), si está definido */
  seoTitle?: string;
  /** Meta description de Shopify Admin (seo.description), si está definida */
  seoDescription?: string;
}
