// Helpers de Shopify para las funciones serverless (Admin + Storefront).
// Las credenciales SOLO viven en variables de entorno del backend (Vercel),
// nunca se exponen al navegador.

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || 'mr-brown-mayoreo.myshopify.com';
const API_VERSION = process.env.SHOPIFY_API_VERSION || '2025-10';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_TOKEN || '';
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN || '';

const adminUrl = `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`;
const storefrontUrl = `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`;

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

export const adminGraphql = (query, variables) =>
  gql(adminUrl, { 'X-Shopify-Access-Token': ADMIN_TOKEN }, query, variables);

export const storefrontGraphql = (query, variables) =>
  gql(storefrontUrl, { 'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN }, query, variables);

// Verifica el access token del cliente (Storefront) y devuelve su identidad.
export async function getCustomerFromToken(customerAccessToken) {
  const data = await storefrontGraphql(
    `query($t: String!) { customer(customerAccessToken: $t) { id email firstName lastName } }`,
    { t: customerAccessToken },
  );
  return data?.customer || null;
}

// Lee los tags del cliente desde la Admin API (la Storefront API no los expone).
export async function getCustomerTags(customerGid) {
  const data = await adminGraphql(
    `query($id: ID!) { customer(id: $id) { id tags } }`,
    { id: customerGid },
  );
  return data?.customer?.tags || [];
}

// Devuelve, para cada variante, su precio base y el id de producto.
export async function getVariantsInfo(variantGids) {
  if (!variantGids.length) return {};
  const data = await adminGraphql(
    `query($ids: [ID!]!) {
       nodes(ids: $ids) {
         ... on ProductVariant {
           id
           price
           product { id legacyResourceId }
         }
       }
     }`,
    { ids: variantGids },
  );
  const map = {};
  for (const node of data?.nodes || []) {
    if (!node) continue;
    map[node.id] = {
      basePrice: parseFloat(node.price),
      productLegacyId: node.product?.legacyResourceId, // id numérico que usa SAMI
    };
  }
  return map;
}

// Crea un draft order con descuentos por línea y devuelve la URL de pago (invoiceUrl).
export async function createDraftOrder({ customerId, lineItems, note }) {
  const data = await adminGraphql(
    `mutation($input: DraftOrderInput!) {
       draftOrderCreate(input: $input) {
         draftOrder { id name invoiceUrl totalPriceSet { presentmentMoney { amount currencyCode } } }
         userErrors { field message }
       }
     }`,
    {
      input: {
        customerId,
        lineItems,
        note: note || 'Pedido de mayoreo (headless)',
        tags: ['samita-wholesale', 'headless-wholesale'],
        useCustomerDefaultAddress: true,
      },
    },
  );
  const result = data?.draftOrderCreate;
  if (result?.userErrors?.length) {
    throw new Error('draftOrderCreate: ' + JSON.stringify(result.userErrors));
  }
  return result.draftOrder;
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
