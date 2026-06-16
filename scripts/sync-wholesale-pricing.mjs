// Regenera api/_data/wholesale-pricing.json desde la API pública de Samita (SAMI).
//
// Requisitos:
//   - App Samita Wholesale B2B instalada (plan Gold para API)
//   - API key con permiso "View" en Samita → Settings → Public API
//
// Uso:
//   SAMITA_API_KEY=xxx node scripts/sync-wholesale-pricing.mjs
//
// Variables de entorno (o .env local):
//   SAMITA_API_KEY          — obligatoria
//   SAMITA_SHOP_URL         — default: mr-brown-mayoreo.myshopify.com
//
// Límite Samita: máx. 1 request / 5 min y 50 / día. No ejecutar en loop.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://wholesale.samita.io/api/v1/wholesale-pricings';
const SHOP_URL = (process.env.SAMITA_SHOP_URL || process.env.SHOPIFY_STORE_DOMAIN || 'mr-brown-mayoreo.myshopify.com').trim();
const API_KEY = process.env.SAMITA_API_KEY?.trim();
const OUTPUT = fileURLToPath(new URL('../api/_data/wholesale-pricing.json', import.meta.url));

if (!API_KEY) {
  console.error('Falta SAMITA_API_KEY. Créala en Samita Wholesale → Public API.');
  process.exit(1);
}

const RATE_LIMIT_MS = Number(process.env.SAMITA_RATE_LIMIT_MS || 310_000);
const MAX_RETRIES = Number(process.env.SAMITA_MAX_RETRIES || 8);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchPage(page) {
  const url = new URL(API_BASE);
  url.searchParams.set('page', String(page));
  url.searchParams.set('limit', '20');
  url.searchParams.set('status', 'active');
  url.searchParams.set('sort', 'descrease');

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const res = await fetch(url, {
      headers: {
        'X-SAMITA-API-KEY': API_KEY,
        'X-SAMITA-SHOP-URL': SHOP_URL,
        'Content-Type': 'application/json',
      },
    });

    if (res.status === 429) {
      const waitMin = Math.ceil(RATE_LIMIT_MS / 60_000);
      console.warn(`Samita 429 (página ${page}, intento ${attempt}/${MAX_RETRIES}). Esperando ${waitMin} min…`);
      await sleep(RATE_LIMIT_MS);
      continue;
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Samita API ${res.status}: ${body}`);
    }

    const data = await res.json();
    return Array.isArray(data) ? data : data?.data ?? data?.wholesale_pricings ?? [];
  }

  throw new Error(`Samita API 429: agotados ${MAX_RETRIES} reintentos en página ${page}`);
}

async function fetchAllRules() {
  const rules = [];
  for (let page = 1; page <= 50; page += 1) {
    const batch = await fetchPage(page);
    if (!batch.length) break;
    rules.push(...batch);
    if (batch.length < 20) break;
    console.log(`Página ${page} ok (${batch.length} reglas). Esperando antes de la siguiente…`);
    await sleep(RATE_LIMIT_MS);
  }
  return rules;
}

function customerTags(rule) {
  const apply = rule.apply_customer ?? {};
  const type = String(apply.type ?? '').toLowerCase();
  if (type === 'all') return ['*'];
  if (type === 'tags' || type === 'customer_tags' || type === 'tag') {
    return (apply.tags ?? []).map(String).filter(Boolean);
  }
  return [];
}

function parsePrice(value) {
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function fixedPriceFromGroup(group) {
  if (!group) return null;
  const type = String(group.type ?? '').toLowerCase();
  if (type === 'fixed' || type === 'fixed_price' || type === 'set_price') {
    return parsePrice(group.value);
  }
  return null;
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

  const ruleFixed = fixedPriceFromGroup(rule.discount_group);
  const entries = rule.discount_for_variants ?? rule.products ?? [];

  for (const entry of entries) {
    const productId = entry.id ?? entry.product_id;
    if (productId == null) continue;

    const variants = entry.variants ?? [];
    if (variants.length === 0) {
      for (const tag of tags) {
        if (tag === '*') continue;
        if (ruleFixed != null) addPrice(groups, tag, productId, ruleFixed);
      }
      continue;
    }

    for (const variant of variants) {
      const discountGroups = variant.discount_groups ?? [];
      for (const dg of discountGroups) {
        const price = fixedPriceFromGroup(dg);
        if (price == null) continue;

        const dgName = String(dg.name ?? '').trim();
        if (dgName && dgName !== 'all' && tags.includes(dgName)) {
          addPrice(groups, dgName, productId, price);
        } else if (tags.length === 1 && tags[0] !== '*') {
          addPrice(groups, tags[0], productId, price);
        } else if (ruleFixed == null && price != null) {
          for (const tag of tags) {
            if (tag !== '*') addPrice(groups, tag, productId, price);
          }
        }
      }

      if (ruleFixed != null) {
        for (const tag of tags) {
          if (tag !== '*') addPrice(groups, tag, productId, ruleFixed);
        }
      }
    }
  }
}

const rules = await fetchAllRules();
const groups = {};

for (const rule of rules) {
  extractPricesFromRule(rule, groups);
}

const snapshot = {
  _generatedFrom: 'SAMI wholesale-pricings API',
  _generatedAt: new Date().toISOString(),
  _shop: SHOP_URL,
  _ruleCount: rules.length,
  groups,
};

writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 0)}\n`);

const tagCount = Object.keys(groups).length;
const productCount = Object.values(groups).reduce((n, g) => n + Object.keys(g).length, 0);

console.log(`✅ ${OUTPUT}`);
console.log(`   Reglas activas leídas: ${rules.length}`);
console.log(`   Grupos (tags): ${tagCount} → ${Object.keys(groups).join(', ') || '(ninguno)'}`);
console.log(`   Entradas producto/precio: ${productCount}`);

if (!groups.ADEP) {
  console.warn('\n⚠️  El grupo "ADEP" no apareció. Revisa en Samita que la regla esté activa y use tag ADEP.');
}
