import { shopifyConfig } from '@/shopify/config';

function normalizeEnv(value: unknown, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  return String(value).trim();
}

export const HELIUM_CF_VERSION = normalizeEnv(import.meta.env.VITE_HELIUM_CF_VERSION, '5.3.0');

export const HELIUM_REGISTRATION_FORM_ID = normalizeEnv(
  import.meta.env.VITE_HELIUM_REGISTRATION_FORM_ID,
  'kntKby',
);

export const HELIUM_FORM_UPDATED_AT = Number(
  normalizeEnv(import.meta.env.VITE_HELIUM_REGISTRATION_FORM_UPDATED_AT, '1772043628'),
);

export const HELIUM_CAPTCHA_SITE_KEY = normalizeEnv(
  import.meta.env.VITE_HELIUM_CAPTCHA_SITE_KEY,
  '6Lcw5vApAAAAAMg1fq6zsrykmIe_kdVrlPayKgLX',
);

export const heliumShopDomain = shopifyConfig.storeDomain;

export const heliumAssetBaseUrl = `https://static.customerfields.com/releases/${HELIUM_CF_VERSION}`;

/** Ruta relativa al app proxy de Helium (misma que en el tema Shopify). Debe ir antes del catch-all SPA en Vercel. */
export const HELIUM_PROXY_PATH = '/tools/customr';

export const heliumProxyUrl = HELIUM_PROXY_PATH;

export const heliumFormApiUrl = (formId: string, updatedAt: number) =>
  `https://app.customerfields.com/embed_api/v4/forms/${formId}.json?v=${updatedAt}`;
