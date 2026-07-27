// Sync de precios mayoreo desde Samita → snapshot { groups }.
// Compartido por CLI, GitHub Actions y POST /api/sync-wholesale-pricing.
import { put, list, del } from '@vercel/blob';

export const WHOLESALE_BLOB_PATHNAME = 'wholesale/pricing.json';

const API_BASE = 'https://wholesale.samita.io/api/v1/wholesale-pricings';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parsePrice(value) {
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

// En la API real de Samita, "fixed-amount" es el PRECIO FINAL de mayoreo
// (verificado contra el snapshot bueno del 27/07: ZERU 8645509382420 = 389.8).
// "amount" y "percent" son descuentos relativos y no se usan para el snapshot.
function unitPriceFromDiscountGroup(group) {
  if (!group) return null;
  const type = String(group.type ?? '').toLowerCase();
  if (type === 'fixed-amount' || type === 'fixed' || type === 'fixed_price' || type === 'set_price') {
    return parsePrice(group.value);
  }
  return null;
}

function customerTags(rule) {
  const apply = rule.apply_customer ?? {};
  const type = String(apply.type ?? '').toLowerCase();
  if (type === 'all') return ['*'];
  // La API real usa "customer-tags" (con guion).
  if (type === 'customer-tags' || type === 'tags' || type === 'customer_tags' || type === 'tag') {
    return (apply.tags ?? []).map(String).filter(Boolean);
  }
  return [];
}

function addPrice(groups, tag, productId, price) {
  if (!tag || productId == null || price == null || price <= 0) return;
  const key = String(productId);
  if (!groups[tag]) groups[tag] = {};
  const existing = groups[tag][key];
  if (existing == null || price < existing) {
    groups[tag][key] = price;
  }
}

function extractPricesFromRule(rule, groups) {
  const tags = customerTags(rule);
  if (!tags.length) return;

  const entries = rule.discount_for_variants ?? rule.products ?? [];

  for (const entry of entries) {
    const productId = entry.id ?? entry.product_id;
    if (productId == null) continue;

    // El precio fixed-amount vive en discount_groups a nivel producto;
    // las variantes suelen traer percent/null y se revisan como fallback.
    const discountGroupLists = [entry.discount_groups ?? []];
    for (const variant of entry.variants ?? []) {
      discountGroupLists.push(variant.discount_groups ?? []);
    }

    for (const discountGroups of discountGroupLists) {
      for (const dg of discountGroups) {
        const price = unitPriceFromDiscountGroup(dg);
        if (price == null) continue;

        const dgName = String(dg.name ?? '').trim();
        const targets =
          dgName && dgName !== 'all' && tags.includes(dgName)
            ? [dgName]
            : tags.filter((tag) => tag !== '*');
        for (const tag of targets) {
          addPrice(groups, tag, productId, price);
        }
      }
    }
  }
}

async function fetchPage({ apiKey, shopUrl, page, limit, rateLimitMs, maxRetries }) {
  const url = new URL(API_BASE);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', String(limit));
  // Sin filtro status: el 27/07 Samita empezó a devolver SOLO 5 reglas
  // desactivadas con status=active (filtro roto server-side); sin el
  // parámetro devuelve las 47 reglas reales, igual que el snapshot bueno.
  url.searchParams.set('sort', 'descrease');

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const res = await fetch(url, {
      headers: {
        'X-SAMITA-API-KEY': apiKey,
        'X-SAMITA-SHOP-URL': shopUrl,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      if (!rateLimitMs || attempt === maxRetries) {
        const err = new Error(`Samita API 429 en página ${page}`);
        err.code = 'RATE_LIMITED';
        throw err;
      }
      console.warn(`Samita 429 (página ${page}, intento ${attempt}/${maxRetries}). Esperando…`);
      await sleep(rateLimitMs);
      continue;
    }

    if (!res.ok) {
      throw new Error(`Samita API ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data?.data ?? data?.wholesale_pricings ?? [];
  }

  const err = new Error(`Samita API 429: agotados reintentos en página ${page}`);
  err.code = 'RATE_LIMITED';
  throw err;
}

/**
 * @param {{
 *   apiKey?: string,
 *   shopUrl?: string,
 *   limit?: number,
 *   maxPages?: number,
 *   rateLimitMs?: number | null,
 *   maxRetries?: number,
 * }} [opts]
 */
export async function buildWholesaleSnapshot(opts = {}) {
  const apiKey = (opts.apiKey || process.env.SAMITA_API_KEY || '').trim();
  const shopUrl = (
    opts.shopUrl ||
    process.env.SAMITA_SHOP_URL ||
    process.env.SHOPIFY_STORE_DOMAIN ||
    'mr-brown-mayoreo.myshopify.com'
  ).trim();

  if (!apiKey) {
    throw new Error('Falta SAMITA_API_KEY');
  }

  // Samita rechaza limit > 20 con 422 "Limit must be at most 20".
  const limit = Math.min(opts.limit ?? 20, 20);
  const maxPages = opts.maxPages ?? 50;
  const rateLimitMs = opts.rateLimitMs === undefined ? 310_000 : opts.rateLimitMs;
  const maxRetries = opts.maxRetries ?? 8;

  const rules = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const batch = await fetchPage({
      apiKey,
      shopUrl,
      page,
      limit,
      rateLimitMs,
      maxRetries,
    });
    if (!batch.length) break;
    rules.push(...batch);
    if (batch.length < limit) break;
    if (rateLimitMs) {
      console.log(`Página ${page} ok (${batch.length} reglas). Esperando antes de la siguiente…`);
      await sleep(rateLimitMs);
    }
  }

  const groups = {};
  for (const rule of rules) {
    extractPricesFromRule(rule, groups);
  }

  // Nunca devolver un snapshot vacío: el 27/07 un sync con parsing roto
  // publicó 0 grupos y borró todos los descuentos de producción.
  if (rules.length > 0 && Object.keys(groups).length === 0) {
    const err = new Error(
      `Samita devolvió ${rules.length} reglas pero no se extrajo ningún precio; formato de API inesperado. Abortando para no pisar precios vigentes.`,
    );
    err.code = 'EMPTY_SNAPSHOT';
    throw err;
  }

  return {
    _generatedFrom: 'SAMI wholesale-pricings API',
    _generatedAt: new Date().toISOString(),
    _shop: shopUrl,
    _ruleCount: rules.length,
    groups,
  };
}

export async function publishWholesaleSnapshotToBlob(snapshot, { allowShrink = false } = {}) {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new Error('Falta BLOB_READ_WRITE_TOKEN');
  }

  // Si el snapshot nuevo pierde más de la mitad de los grupos vigentes,
  // es casi seguro un problema de API (como el filtro status roto del 27/07)
  // y no un cambio real del cliente. Abortar antes de pisar producción.
  if (!allowShrink) {
    // Fail-open a propósito: si no se puede leer el Blob actual, el guard
    // no debe bloquear la publicación, pero el motivo queda logueado.
    let current = null;
    try {
      current = await fetchWholesaleSnapshotFromBlob();
    } catch (err) {
      console.warn('[samitaWholesale] guard sin snapshot actual:', err?.message || err);
    }
    const currentCount = Object.keys(current?.groups || {}).length;
    const newCount = Object.keys(snapshot?.groups || {}).length;
    if (currentCount >= 4 && newCount < currentCount / 2) {
      const err = new Error(
        `El snapshot nuevo tiene ${newCount} grupos y producción tiene ${currentCount}; caída sospechosa, se aborta para no borrar descuentos. Si el cambio es intencional, publicar con allowShrink.`,
      );
      err.code = 'SHRUNK_SNAPSHOT';
      throw err;
    }
  }

  try {
    await del(WHOLESALE_BLOB_PATHNAME, { token });
  } catch (err) {
    console.warn('[samitaWholesale] blob del skipped:', err?.message || err);
  }

  const blob = await put(WHOLESALE_BLOB_PATHNAME, `${JSON.stringify(snapshot)}\n`, {
    access: 'public',
    contentType: 'application/json',
    addRandomSuffix: false,
    token,
  });

  return blob.url;
}

export async function fetchWholesaleSnapshotFromBlob() {
  const directUrl = process.env.WHOLESALE_PRICING_BLOB_URL?.trim();
  if (directUrl) {
    const res = await fetch(directUrl, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return null;

  const { blobs } = await list({
    prefix: WHOLESALE_BLOB_PATHNAME,
    limit: 1,
    token,
  });
  const url = blobs[0]?.url;
  if (!url) return null;

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export function snapshotStats(snapshot) {
  const groups = snapshot?.groups || {};
  const tagCount = Object.keys(groups).length;
  const productCount = Object.values(groups).reduce((n, g) => n + Object.keys(g || {}).length, 0);
  return { tagCount, productCount, ruleCount: snapshot?._ruleCount ?? 0 };
}
