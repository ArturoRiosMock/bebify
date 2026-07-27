// POST /api/set-wholesale-group
// Entrada manual: publica { tag, price, productIds[] } al Blob con merge.
// Uso: cuando Samita no persiste el precio y necesitamos bypassear.
// Auth: mismas credenciales que /edicion.
import { isAdminCredentials } from './_lib/homeContent.mjs';
import { parseJsonBody } from './_lib/http.mjs';
import {
  fetchWholesaleSnapshotFromBlob,
  publishWholesaleSnapshotToBlob,
  snapshotStats,
} from './_lib/samitaWholesale.mjs';
import { invalidateWholesaleCache } from './_lib/wholesale.mjs';

export const config = {
  maxDuration: 30,
};

function parseProductIds(input) {
  if (Array.isArray(input)) return input.map((s) => String(s).trim()).filter(Boolean);
  if (typeof input !== 'string') return [];
  return input
    .split(/[\s,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function setWholesaleGroup(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const body = parseJsonBody(req);
  if (!body) {
    res.status(400).json({ error: 'JSON inválido' });
    return;
  }
  if (!isAdminCredentials(body.username, body.password)) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }

  const tag = typeof body.tag === 'string' ? body.tag.trim() : '';
  const price = Number(body.price);
  const productIds = parseProductIds(body.productIds).filter((id) => /^\d+$/.test(id));

  if (!tag) {
    res.status(400).json({ error: 'Falta el tag (nombre exacto, respeta mayúsculas).' });
    return;
  }
  if (!Number.isFinite(price) || price <= 0) {
    res.status(400).json({ error: 'Precio inválido: debe ser un número > 0.' });
    return;
  }
  if (productIds.length === 0) {
    res.status(400).json({
      error: 'Se requiere al menos un Product ID numérico (el legacy id de Shopify, sin gid://).',
    });
    return;
  }

  try {
    const previous = await fetchWholesaleSnapshotFromBlob().catch((err) => {
      console.warn('[set-wholesale-group] Blob previo no disponible:', err?.message || err);
      return null;
    });
    const groups = { ...(previous?.groups || {}) };
    const existing = { ...(groups[tag] || {}) };
    for (const id of productIds) existing[id] = price;
    groups[tag] = existing;

    const snapshot = {
      ...previous,
      _generatedFrom: `manual entry (tag=${tag})`,
      _generatedAt: new Date().toISOString(),
      _sourceFile: `manual-${tag}-${price}`,
      groups,
    };

    const url = await publishWholesaleSnapshotToBlob(snapshot, { allowShrink: false });
    invalidateWholesaleCache();

    const stats = snapshotStats(snapshot);
    res.status(200).json({
      ok: true,
      url,
      tag,
      price,
      productCount: productIds.length,
      productIds,
      ...stats,
      note: 'Precio publicado al Blob. Cache API ~45s. El cliente con este tag exacto lo verá enseguida.',
    });
  } catch (err) {
    console.error('[set-wholesale-group]', err);
    res.status(500).json({
      error: err?.message || 'No se pudo publicar la entrada manual.',
      code: err?.code || 'MANUAL_ENTRY_FAILED',
    });
  }
}
