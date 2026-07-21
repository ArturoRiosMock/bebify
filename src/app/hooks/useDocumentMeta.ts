import { useEffect } from 'react';
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_OG_IMAGE_ALT,
  DEFAULT_OG_IMAGE_HEIGHT,
  DEFAULT_OG_IMAGE_WIDTH,
  DEFAULT_TITLE,
  SITE_NAME,
  SITE_URL,
  TITLE_SUFFIX,
  absoluteUrl,
} from '@/content/mrbrown/seo-defaults';

type Availability = 'in stock' | 'out of stock' | 'preorder' | 'discontinued';

interface DocumentMetaOptions {
  /** Título de la página, sin el sufijo del sitio. Si se omite, se restaura el title por defecto. */
  title?: string;
  /** Texto para `<meta name="description">`. */
  description?: string;
  /** Path interno (ej. "/categorias/whisky") o URL absoluta para `<link rel="canonical">`. */
  canonicalPath?: string;
  /** URL absoluta para `og:image`. Si se omite, se usa la imagen por defecto del sitio. */
  ogImage?: string;
  /** Texto alternativo para la imagen Open Graph y Twitter Card. */
  imageAlt?: string;
  /** og:type (`website`, `product`, `article`…). Default: `website`. */
  ogType?: string;
  /** Si true, añade `<meta name="robots" content="noindex, follow">`. */
  noindex?: boolean;
  /** Para og:type=product — precio numérico (ej. 549.00). */
  priceAmount?: number;
  /** Para og:type=product — ISO currency (ej. "MXN"). */
  priceCurrency?: string;
  /** Para og:type=product — disponibilidad. Default cuando se omite: ninguna meta. */
  availability?: Availability;
}

const ensureMeta = (selector: string, attr: 'name' | 'property', name: string): HTMLMetaElement => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  return el;
};

const ensureLink = (rel: string): HTMLLinkElement => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.rel = rel;
    document.head.appendChild(el);
  }
  return el;
};

const removeMeta = (selector: string): void => {
  const el = document.head.querySelector(selector);
  if (el) el.parentNode?.removeChild(el);
};

/**
 * Hook que sincroniza title + meta description + canonical + Open Graph + Twitter
 * Cards + robots con la página actual. Diseñado para una SPA: en el unmount
 * restaura los defaults para que páginas sin metadatos explícitos no hereden
 * los anteriores. Las metas específicas de producto se eliminan al desmontar.
 */
export const useDocumentMeta = (options: DocumentMetaOptions): void => {
  const {
    title,
    description = DEFAULT_DESCRIPTION,
    canonicalPath,
    ogImage,
    imageAlt,
    ogType = 'website',
    noindex = false,
    priceAmount,
    priceCurrency,
    availability,
  } = options;

  useEffect(() => {
    // Si el título ya incluye el nombre del sitio (p. ej. seo.title de Shopify), no duplicar sufijo.
    const fullTitle = title
      ? title.includes(SITE_NAME)
        ? title
        : `${title}${TITLE_SUFFIX}`
      : DEFAULT_TITLE;
    document.title = fullTitle;

    const descMeta = ensureMeta('meta[name="description"]', 'name', 'description');
    descMeta.content = description;

    const canonical = ensureLink('canonical');
    canonical.href = canonicalPath
      ? absoluteUrl(canonicalPath)
      : `${SITE_URL}${window.location.pathname}`;

    // Open Graph básico
    const ogTitle = ensureMeta('meta[property="og:title"]', 'property', 'og:title');
    ogTitle.content = fullTitle;

    const ogDesc = ensureMeta('meta[property="og:description"]', 'property', 'og:description');
    ogDesc.content = description;

    const ogTypeMeta = ensureMeta('meta[property="og:type"]', 'property', 'og:type');
    ogTypeMeta.content = ogType;

    const ogUrl = ensureMeta('meta[property="og:url"]', 'property', 'og:url');
    ogUrl.content = canonical.href;

    const ogSiteName = ensureMeta('meta[property="og:site_name"]', 'property', 'og:site_name');
    ogSiteName.content = SITE_NAME;

    const ogLocale = ensureMeta('meta[property="og:locale"]', 'property', 'og:locale');
    ogLocale.content = 'es_MX';

    // Imagen OG (siempre presente — usa default si no se pasa)
    const finalImage = ogImage || DEFAULT_OG_IMAGE;
    const finalImageAlt = imageAlt || DEFAULT_OG_IMAGE_ALT;
    const usingDefaultImage = !ogImage;

    const ogImg = ensureMeta('meta[property="og:image"]', 'property', 'og:image');
    ogImg.content = finalImage;

    const ogImgAlt = ensureMeta('meta[property="og:image:alt"]', 'property', 'og:image:alt');
    ogImgAlt.content = finalImageAlt;

    if (usingDefaultImage) {
      const ogImgW = ensureMeta('meta[property="og:image:width"]', 'property', 'og:image:width');
      ogImgW.content = DEFAULT_OG_IMAGE_WIDTH;
      const ogImgH = ensureMeta('meta[property="og:image:height"]', 'property', 'og:image:height');
      ogImgH.content = DEFAULT_OG_IMAGE_HEIGHT;
    } else {
      // Tamaño del producto desconocido → quitar para no mentir.
      removeMeta('meta[property="og:image:width"]');
      removeMeta('meta[property="og:image:height"]');
    }

    // Twitter Cards (sincronizadas con OG)
    const twCard = ensureMeta('meta[name="twitter:card"]', 'name', 'twitter:card');
    twCard.content = 'summary_large_image';

    const twTitle = ensureMeta('meta[name="twitter:title"]', 'name', 'twitter:title');
    twTitle.content = fullTitle;

    const twDesc = ensureMeta('meta[name="twitter:description"]', 'name', 'twitter:description');
    twDesc.content = description;

    const twImg = ensureMeta('meta[name="twitter:image"]', 'name', 'twitter:image');
    twImg.content = finalImage;

    const twImgAlt = ensureMeta('meta[name="twitter:image:alt"]', 'name', 'twitter:image:alt');
    twImgAlt.content = finalImageAlt;

    // Metadatos extendidos de producto (Open Graph product:*)
    let productPriceAmount: HTMLMetaElement | null = null;
    let productPriceCurrency: HTMLMetaElement | null = null;
    let productAvailability: HTMLMetaElement | null = null;

    if (ogType === 'product') {
      if (priceAmount !== undefined && priceAmount !== null && Number.isFinite(priceAmount)) {
        productPriceAmount = ensureMeta(
          'meta[property="product:price:amount"]',
          'property',
          'product:price:amount',
        );
        productPriceAmount.content = priceAmount.toFixed(2);
      }
      if (priceCurrency) {
        productPriceCurrency = ensureMeta(
          'meta[property="product:price:currency"]',
          'property',
          'product:price:currency',
        );
        productPriceCurrency.content = priceCurrency;
      }
      if (availability) {
        productAvailability = ensureMeta(
          'meta[property="product:availability"]',
          'property',
          'product:availability',
        );
        productAvailability.content = availability;
      }
    }

    const robots = ensureMeta('meta[name="robots"]', 'name', 'robots');
    robots.content = noindex ? 'noindex, follow' : 'index, follow';

    return () => {
      // Restaurar valores por defecto al desmontar para evitar fugas entre rutas.
      document.title = DEFAULT_TITLE;
      const desc = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
      if (desc) desc.content = DEFAULT_DESCRIPTION;
      const robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
      if (robotsEl) robotsEl.content = 'index, follow';

      // Las metas específicas de producto no deben sobrevivir a la siguiente ruta.
      removeMeta('meta[property="product:price:amount"]');
      removeMeta('meta[property="product:price:currency"]');
      removeMeta('meta[property="product:availability"]');
    };
  }, [
    title,
    description,
    canonicalPath,
    ogImage,
    imageAlt,
    ogType,
    noindex,
    priceAmount,
    priceCurrency,
    availability,
  ]);
};
