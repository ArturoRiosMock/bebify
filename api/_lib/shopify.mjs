// Helpers Admin API para funciones serverless (metafields Shop + Files).
// Credenciales SOLO en env del backend — nunca con prefijo VITE_.

const STORE_DOMAIN = (
  process.env.SHOPIFY_ADMIN_STORE_DOMAIN ||
  process.env.SHOPIFY_STORE_DOMAIN ||
  'mrbrownmx.myshopify.com'
).replace(/^https?:\/\//, '');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_TOKEN || '';

const adminUrl = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;

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

export const adminGraphql = (query, variables) => {
  if (!ADMIN_TOKEN) {
    throw new Error('SHOPIFY_ADMIN_API_TOKEN no configurado');
  }
  return gql(adminUrl, { 'X-Shopify-Access-Token': ADMIN_TOKEN }, query, variables);
};

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
