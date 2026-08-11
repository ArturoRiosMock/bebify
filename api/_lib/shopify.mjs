// Helpers Admin API para funciones serverless (metafields Shop + Files).
// Credenciales SOLO en env del backend — nunca con prefijo VITE_.
//
// Preferencia de auth:
// 1) SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET → token del día vía client_credentials
//    (cache en memoria de la instancia; se renueva antes de expirar)
// 2) Fallback: SHOPIFY_ADMIN_API_TOKEN / SHOPIFY_ADMIN_TOKEN (estático; caduca ~24h)

const STORE_DOMAIN = (
  process.env.SHOPIFY_ADMIN_STORE_DOMAIN ||
  process.env.SHOPIFY_STORE_DOMAIN ||
  'mrbrownmx.myshopify.com'
).replace(/^https?:\/\//, '');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const adminUrl = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

/** @type {{ token: string, expiresAt: number } | null} */
let tokenCache = null;

function storeSubdomain() {
  return STORE_DOMAIN.replace(/\.myshopify\.com$/, '').replace(/\/$/, '');
}

function hasClientCredentials() {
  return Boolean(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);
}

function isAuthError(err) {
  const msg = String(err?.message || err || '');
  return /invalid api key|unrecognized login|wrong password|unauthorized|401/i.test(msg);
}

async function fetchClientCredentialsToken() {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const url = `https://${storeSubdomain()}.myshopify.com/admin/oauth/access_token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    signal: AbortSignal.timeout(15_000),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(
      `No se pudo renovar Admin token (client_credentials): ${res.status} ${JSON.stringify(data)}`,
    );
  }

  // Shopify suele devolver expires_in ≈ 86399 (24h). Renovar 2 min antes.
  const expiresInSec = Number(data.expires_in) || 60 * 60 * 23;
  const expiresAt = Date.now() + Math.max(60, expiresInSec - 120) * 1000;
  return { token: data.access_token, expiresAt };
}

/**
 * Token Admin fresco. Con CLIENT_ID/SECRET se renueva solo (key del día).
 * // declared: cache por instancia Fluid; upgrade: shared KV si hace falta multi-instance
 */
export async function getAdminAccessToken({ forceRefresh = false } = {}) {
  if (!forceRefresh && tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  if (hasClientCredentials()) {
    tokenCache = await fetchClientCredentialsToken();
    return tokenCache.token;
  }

  const staticToken = process.env.SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN || '';
  if (!staticToken) {
    throw new Error(
      'Falta auth Admin: configura SHOPIFY_CLIENT_ID + SHOPIFY_CLIENT_SECRET (recomendado) o SHOPIFY_ADMIN_API_TOKEN',
    );
  }
  // Sin OAuth no hay expires_in; no cachear como “fresco”.
  return staticToken;
}

async function gql(url, headers, query, variables) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error('GraphQL error: ' + JSON.stringify(json.errors));
  }
  return json.data;
}

export async function adminGraphql(query, variables) {
  const run = async (forceRefresh) => {
    const token = await getAdminAccessToken({ forceRefresh });
    return gql(adminUrl, { 'X-Shopify-Access-Token': token }, query, variables);
  };

  try {
    return await run(false);
  } catch (err) {
    if (hasClientCredentials() && isAuthError(err)) {
      tokenCache = null;
      return run(true);
    }
    throw err;
  }
}

export async function getShopMetafieldJson(namespace, key) {
  const data = await adminGraphql(
    `query($namespace: String!, $key: String!) {
       shop { metafield(namespace: $namespace, key: $key) { value } }
     }`,
    { namespace, key },
  );
  const raw = data?.shop?.metafield?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function setShopMetafieldJson(namespace, key, obj) {
  const shopData = await adminGraphql(`{ shop { id } }`);
  const shopId = shopData?.shop?.id;
  if (!shopId) {
    throw new Error('No se pudo obtener el ID de la tienda');
  }

  const data = await adminGraphql(
    `mutation($metafields: [MetafieldsSetInput!]!) {
       metafieldsSet(metafields: $metafields) {
         metafields { key namespace }
         userErrors { field message }
       }
     }`,
    {
      metafields: [
        {
          ownerId: shopId,
          namespace,
          key,
          type: 'json',
          value: JSON.stringify(obj),
        },
      ],
    },
  );

  const errors = data?.metafieldsSet?.userErrors;
  if (errors?.length) {
    throw new Error('metafieldsSet: ' + JSON.stringify(errors));
  }
}

export { STORE_DOMAIN, API_VERSION };
