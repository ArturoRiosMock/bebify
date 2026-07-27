// POST /api/sync-wholesale-pricing
// Dispara sync Samita → Vercel Blob (precios live sin redeploy).
// Auth: credenciales de /edicion, o header Authorization: Bearer <CRON_SECRET|WHOLESALE_SYNC_SECRET>
import { isAdminCredentials } from './_lib/homeContent.mjs';
import {
  buildWholesaleSnapshot,
  publishWholesaleSnapshotToBlob,
  snapshotStats,
} from './_lib/samitaWholesale.mjs';
import { invalidateWholesaleCache } from './_lib/wholesale.mjs';

export const config = {
  maxDuration: 60,
};

function parseBody(req) {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return null;
  }
}

function bearerAuthorized(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7).trim();
  const cron = process.env.CRON_SECRET?.trim();
  const sync = process.env.WHOLESALE_SYNC_SECRET?.trim();
  return Boolean((cron && token === cron) || (sync && token === sync));
}

export default async function syncWholesalePricing(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // GET = Vercel Cron (solo CRON_SECRET). POST = /edicion o Bearer.
    if (req.method === 'GET') {
      const cron = process.env.CRON_SECRET?.trim();
      const auth = req.headers.authorization || '';
      if (!cron || auth !== `Bearer ${cron}`) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }
    } else {
      const body = parseBody(req);
      if (!body) {
        res.status(400).json({ error: 'JSON inválido' });
        return;
      }
      if (!isAdminCredentials(body.username, body.password) && !bearerAuthorized(req)) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }
    }

    const snapshot = await buildWholesaleSnapshot({
      limit: 20,
      maxPages: 6,
      rateLimitMs: null,
      maxRetries: 1,
    });

    const url = await publishWholesaleSnapshotToBlob(snapshot);
    invalidateWholesaleCache();

    const stats = snapshotStats(snapshot);
    res.status(200).json({
      ok: true,
      url,
      generatedAt: snapshot._generatedAt,
      ...stats,
      skippedEmpty: snapshot._skippedEmpty || [],
      mergedFromBlob: snapshot._mergedFromBlob || [],
      note: 'Precios live en Blob. Cache API ~45s. Reglas sin precio en Samita no se importan (salvo merge del Blob previo).',
    });
  } catch (err) {
    console.error('[sync-wholesale-pricing]', err);
    const status = err?.code === 'RATE_LIMITED' ? 429 : 500;
    res.status(status).json({
      error: err.message || 'Error al sincronizar precios',
      code: err?.code || 'SYNC_FAILED',
    });
  }
}
