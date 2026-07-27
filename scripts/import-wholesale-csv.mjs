// Importa un export CSV de Samita → api/_data/wholesale-pricing.json
//
// Uso:
//   node scripts/import-wholesale-csv.mjs WholesalePricingExport1781631508.csv
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const csvPath = process.argv[2];
const OUTPUT = fileURLToPath(new URL('../api/_data/wholesale-pricing.json', import.meta.url));

if (!csvPath) {
  console.error('Uso: node scripts/import-wholesale-csv.mjs <archivo.csv>');
  process.exit(1);
}

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

const raw = readFileSync(csvPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter(Boolean);
const header = parseCsvLine(lines[0]);

const TAG_START = header.indexOf('Discount Groups') + 1;
if (TAG_START <= 0) {
  console.error('CSV inválido: falta columna "Discount Groups"');
  process.exit(1);
}

const COL = {
  id: header.indexOf('Id'),
  status: header.indexOf('Status'),
  customerTags: header.indexOf('Customer Tags'),
  productId: header.indexOf('Product Ids'),
  discountType: header.indexOf('Discount Groups'),
};

const groups = {};
let currentTag = null;
let ruleActive = false;

function addPrice(tag, productId, price) {
  if (!tag || !productId || price == null || price <= 0) return;
  const pid = String(productId).trim();
  if (!/^\d+$/.test(pid)) return;
  if (!groups[tag]) groups[tag] = {};
  const prev = groups[tag][pid];
  if (prev == null || price < prev) {
    groups[tag][pid] = price;
  }
}

for (let i = 1; i < lines.length; i += 1) {
  const row = parseCsvLine(lines[i]);

  const status = row[COL.status]?.trim().toLowerCase();
  if (status) {
    ruleActive = status === 'active';
  }

  const tag = row[COL.customerTags]?.trim();
  if (tag) {
    currentTag = tag;
  }

  if (!ruleActive || !currentTag) continue;

  const productIdsRaw = row[COL.productId]?.trim();
  if (!productIdsRaw) continue;

  const discountType = row[COL.discountType]?.trim().toLowerCase();
  if (discountType !== 'fixed-amount') continue;

  const parsePrice = (value) => {
    const n = parseFloat(String(value ?? '').replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // Preferir la columna cuyo header coincide con el Customer Tag de la regla.
  let price = parsePrice(row[header.indexOf(currentTag)]);
  // Fallback: primera columna con precio (formato legacy de Samita).
  if (price == null) {
    for (let c = TAG_START; c < row.length; c += 1) {
      price = parsePrice(row[c]);
      if (price != null) break;
    }
  }
  if (price == null) continue;

  // Samita a veces pone varios Product Ids en una sola celda ("id1,id2,...").
  for (const productId of productIdsRaw.split(',')) {
    addPrice(currentTag, productId, price);
  }
}

const sortedGroups = {};
for (const tag of Object.keys(groups).sort()) {
  sortedGroups[tag] = {};
  for (const pid of Object.keys(groups[tag]).sort()) {
    sortedGroups[tag][pid] = groups[tag][pid];
  }
}

const snapshot = {
  _generatedFrom: 'Samita CSV export',
  _generatedAt: new Date().toISOString(),
  _sourceFile: csvPath.split('/').pop(),
  groups: sortedGroups,
};

writeFileSync(OUTPUT, `${JSON.stringify(snapshot, null, 0)}\n`);

const tagCount = Object.keys(sortedGroups).length;
const productCount = Object.values(sortedGroups).reduce((n, g) => n + Object.keys(g).length, 0);

console.log(`✅ ${OUTPUT}`);
console.log(`   Grupos (tags): ${tagCount}`);
console.log(`   Entradas producto/precio: ${productCount}`);

if (sortedGroups.ADEP) {
  console.log(`   ADEP: ${Object.keys(sortedGroups.ADEP).length} productos`);
  if (sortedGroups.ADEP['8838188499220']) {
    console.log(`   ADEP agua 8838188499220 → $${sortedGroups.ADEP['8838188499220']}`);
  }
} else {
  console.warn('⚠️  Sin grupo ADEP en el CSV');
}
