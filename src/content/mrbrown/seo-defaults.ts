/**
 * Constantes y defaults SEO centralizados.
 *
 * Editar SITE_URL si el dominio cambia. El resto de páginas calculan canonical
 * y schemas a partir de aquí.
 */

export const SITE_NAME = 'Mr. Brown';
export const SITE_URL = 'https://www.mrbrown.com.mx';
export const SITE_LOGO = `${SITE_URL}/favicon.png`;

export const DEFAULT_TITLE = 'Vinos, Licores y más.. Mr. Brown';

export const DEFAULT_DESCRIPTION =
  'Vinos, licores y bebidas premium en línea: tequila, whisky, mezcal, gin y mixología con envío rápido en CDMX y zona metropolitana. 100% originales y barras para eventos.';

/** Sufijo para concatenar al final de los títulos por página. */
export const TITLE_SUFFIX = ` | ${SITE_NAME}`;

/**
 * Imagen Open Graph por defecto. Aparece como preview cuando se comparte
 * cualquier URL del sitio que no establezca su propia imagen (categoría,
 * página de política, FAQ, etc.). Para una OG dedicada, sustituir el archivo
 * en `/public/og-default.jpg` (1200×630) y actualizar esta constante.
 */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-share.jpg`;
export const DEFAULT_OG_IMAGE_ALT =
  'Conoce Mr. Brown — barra libre, mixología y tienda en Valle de Bravo';
export const DEFAULT_OG_IMAGE_WIDTH = '1024';
export const DEFAULT_OG_IMAGE_HEIGHT = '454';

/** URL absoluta a partir de un path interno. */
export const absoluteUrl = (path: string): string => {
  if (!path) return SITE_URL;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

/** Schema.org Organization — válido como bloque global del sitio. */
export const organizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: SITE_LOGO,
  sameAs: [
    'https://www.facebook.com/profile.php?id=100076305783446',
    'https://www.instagram.com/mrbrown.mx/',
    'https://www.tiktok.com/@mrbrown.com.mx',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'hola@mrbrown.com.mx',
    contactType: 'customer service',
    areaServed: 'MX',
    availableLanguage: ['es-MX'],
  },
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Avenida Contreras 267 int. 1, San Jerónimo Lídice',
    addressLocality: 'La Magdalena Contreras',
    addressRegion: 'CDMX',
    postalCode: '10200',
    addressCountry: 'MX',
  },
});

/** Schema.org WebSite para la home. */
export const websiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  inLanguage: 'es-MX',
});
