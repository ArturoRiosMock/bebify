// Parser del export CSV de Samita → snapshot { groups } compatible con el Blob.
// Mismo formato que scripts/import-wholesale-csv.mjs, reutilizable desde el
// endpoint POST /api/import-wholesale-csv.

function parseCsvLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields;
}

function parsePrice(value) {
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function addPrice(groups, tag, productId, price) {
  if (!tag || !productId || price == null || price <= 0) return;
  const pid = String(productId).trim();
  if (!/^\d+$/.test(pid)) return;
  if (!groups[tag]) groups[tag] = {};
  const prev = groups[tag][pid];
  if (prev == null || price < prev) groups[tag][pid] = price;
}

/**
 * @param {string} csvText
 * @returns {{ groups: Record<string, Record<string, number>>, warnings: string[] }}
 */
export function parseWholesaleCsv(csvText) {
  const warnings = [];
  const raw = String(csvText || '').replace(/^\uFEFF/, '');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV vacío o sin filas de datos.');
  }
  const header = parseCsvLine(lines[0]);

  const tagStart = header.indexOf('Discount Groups') + 1;
  if (tagStart <= 0) {
    throw new Error('CSV inválido: falta columna "Discount Groups".');
  }

  const COL = {
    status: header.indexOf('Status'),
    customerTags: header.indexOf('Customer Tags'),
    productId: header.indexOf('Product Ids'),
    discountType: header.indexOf('Discount Groups'),
  };

  const groups = {};
  let currentTag = null;
  let ruleActive = false;

  for (let i = 1; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i]);

    const status = row[COL.status]?.trim().toLowerCase();
    if (status) ruleActive = status === 'active';

    const tag = row[COL.customerTags]?.trim();
    if (tag) currentTag = tag;

    if (!ruleActive || !currentTag) continue;

    const productIdsRaw = row[COL.productId]?.trim();
    if (!productIdsRaw) continue;

    const discountType = row[COL.discountType]?.trim().toLowerCase();
    if (discountType !== 'fixed-amount') continue;

    let price = parsePrice(row[header.indexOf(currentTag)]);
    if (price == null) {
      for (let c = tagStart; c < row.length; c += 1) {
        price = parsePrice(row[c]);
        if (price != null) break;
      }
    }
    if (price == null) continue;

    for (const productId of productIdsRaw.split(',')) {
      addPrice(groups, tag, productId, price);
    }
  }

  const sorted = {};
  for (const tag of Object.keys(groups).sort()) {
    sorted[tag] = {};
    for (const pid of Object.keys(groups[tag]).sort()) {
      sorted[tag][pid] = groups[tag][pid];
    }
  }

  return { groups: sorted, warnings };
}

/** Merge de dos snapshots: `override` gana sobre `base` a nivel grupo. */
export function mergeGroups(base = {}, override = {}) {
  const out = {};
  for (const tag of Object.keys(base)) out[tag] = { ...base[tag] };
  for (const tag of Object.keys(override)) out[tag] = { ...override[tag] };
  return out;
}
