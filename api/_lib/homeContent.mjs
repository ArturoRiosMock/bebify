import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getShopMetafieldJson, setShopMetafieldJson } from './shopify.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '../_data/home-content.json');
const METAFIELD_NAMESPACE = 'bebify';
const METAFIELD_KEY = 'home_content';

let cachedDefaults = null;

function loadDefaults() {
  if (!cachedDefaults) {
    cachedDefaults = JSON.parse(readFileSync(DATA_PATH, 'utf8'));
  }
  return structuredClone(cachedDefaults);
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const val = override[key];
    if (Array.isArray(val)) {
      result[key] = val;
    } else if (val && typeof val === 'object' && !Array.isArray(base[key])) {
      result[key] = deepMerge(base[key] || {}, val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

export async function getHomeContent() {
  const defaults = loadDefaults();
  try {
    const fromShop = await getShopMetafieldJson(METAFIELD_NAMESPACE, METAFIELD_KEY);
    if (fromShop) {
      return deepMerge(defaults, fromShop);
    }
  } catch (err) {
    console.warn('home_content metafield unavailable, using defaults:', err?.message || err);
  }
  return defaults;
}

export async function saveHomeContent(content) {
  const defaults = loadDefaults();
  const merged = deepMerge(defaults, content);
  await setShopMetafieldJson(METAFIELD_NAMESPACE, METAFIELD_KEY, merged);
  return merged;
}

const ADMIN_USER = process.env.EDICION_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.EDICION_ADMIN_PASSWORD || '';

export function isAdminCredentials(username, password) {
  if (!ADMIN_PASS) {
    console.warn('EDICION_ADMIN_PASSWORD no está configurada');
    return false;
  }
  return username === ADMIN_USER && password === ADMIN_PASS;
}
