// Resuelve un carrito compartido de Shopify Online Store (cart_link_id)
// vía Ajax Cart API en el dominio .myshopify.com.

export const config = { runtime: 'nodejs' };

const STORE_DOMAIN =
  process.env.SHOPIFY_ADMIN_STORE_DOMAIN?.replace(/^https?:\/\//, '') ||
  'mrbrownmx.myshopify.com';

const CART_LINK_ID_RE = /^[A-Za-z0-9_-]{4,64}$/;
const FETCH_TIMEOUT_MS = 5_000;

type AjaxCartItem = {
  variant_id: number;
  quantity: number;
  title?: string;
  product_title?: string;
  image?: string | null;
  price?: number;
};

type AjaxCart = {
  item_count: number;
  items: AjaxCartItem[];
  currency?: string;
};

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function cookieHeaderFromResponse(res: Response): string {
  const getSetCookie = (res.headers as Headers & { getSetCookie?: () => string[] }).getSetCookie;
  const raw = typeof getSetCookie === 'function' ? getSetCookie.call(res.headers) : [];
  const fallback = res.headers.get('set-cookie');
  const parts = raw.length > 0 ? raw : fallback ? [fallback] : [];
  return parts.map((c) => c.split(';')[0]?.trim()).filter(Boolean).join('; ');
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function discardBody(res: Response): Promise<void> {
  try {
    await res.body?.cancel?.();
  } catch {
    // ignore
  }
}

async function fetchAjaxCart(cartLinkId: string, country: string): Promise<AjaxCart> {
  const base = `https://${STORE_DOMAIN}`;
  let cookies = '';

  const cartPageUrl = `${base}/cart?cart_link_id=${encodeURIComponent(cartLinkId)}&country=${encodeURIComponent(country)}`;
  try {
    const pageRes = await fetchWithTimeout(cartPageUrl, {
      redirect: 'follow',
      headers: {
        Accept: 'text/html',
        'User-Agent': 'MrBrown-CartLink/1.0',
      },
    });
    cookies = cookieHeaderFromResponse(pageRes);
    // No leer el HTML completo — en Vercel eso bloqueaba la función varios segundos.
    await discardBody(pageRes);
  } catch (error) {
    console.warn('[cart-link] cart page fetch failed:', error);
  }

  const cartRes = await fetchWithTimeout(`${base}/cart.js`, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MrBrown-CartLink/1.0',
      ...(cookies ? { Cookie: cookies } : {}),
    },
  });

  if (!cartRes.ok) {
    throw new Error(`cart.js respondió ${cartRes.status}`);
  }

  return (await cartRes.json()) as AjaxCart;
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(
    req.url,
    `https://${process.env.VERCEL_URL ?? 'www.mrbrown.com.mx'}`,
  );

  const cartLinkId = url.searchParams.get('cart_link_id')?.trim() ?? '';
  const country = url.searchParams.get('country')?.trim() || 'MX';

  if (!cartLinkId || !CART_LINK_ID_RE.test(cartLinkId)) {
    return json(400, { ok: false, error: 'cart_link_id inválido' });
  }

  try {
    const ajaxCart = await fetchAjaxCart(cartLinkId, country);

    const lines = ajaxCart.items
      .filter((item) => item.variant_id && item.quantity > 0)
      .map((item) => ({
        variantId: `gid://shopify/ProductVariant/${item.variant_id}`,
        quantity: item.quantity,
        title: item.product_title || item.title || '',
        image: item.image ?? null,
        price: typeof item.price === 'number' ? item.price / 100 : null,
      }));

    return json(200, {
      ok: true,
      itemCount: ajaxCart.item_count,
      currency: ajaxCart.currency ?? 'MXN',
      lines,
    });
  } catch (error) {
    console.error('[cart-link]', error);
    return json(502, { ok: false, error: 'No se pudo cargar el carrito compartido' });
  }
}
