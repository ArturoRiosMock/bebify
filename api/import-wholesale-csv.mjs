// POST /api/import-wholesale-csv
// Sube un export CSV de Samita → snapshot Blob (merge con el vigente).
// Auth: mismas credenciales que /edicion.
import { isAdminCredentials } from './_lib/homeContent.mjs';
import { parseJsonBody } from './_lib/http.mjs';
import { mergeGroups, parseWholesaleCsv } from './_lib/wholesaleCsv.mjs';
import {
  fetchWholesaleSnapshotFromBlob,
  publishWholesaleSnapshotToBlob,
  snapshotStats,
} from './_lib/samitaWholesale.mjs';
import { invalidateWholesaleCache } from './_lib/wholesale.mjs';

export const config = {
  maxDuration: 30,
};

export default async function importWholesaleCsv(req, res) {
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

  const csvText = typeof body.csv === 'string' ? body.csv : '';
  if (!csvText.trim()) {
    res.status(400).json({ error: 'Falta el contenido del CSV (campo "csv").' });
    return;
  }
  // Guarda de tamaño: 5 MB texto plano es suficiente para el export de Samita.
  if (csvText.length > 5 * 1024 * 1024) {
    res.status(413).json({ error: 'CSV demasiado grande (>5 MB).' });
    return;
  }
  const fileName = typeof body.fileName === 'string' ? body.fileName : 'upload.csv';
  const mode = body.mode === 'replace' ? 'replace' : 'merge';

  try {
    const { groups: parsedGroups } = parseWholesaleCsv(csvText);
    const parsedTagCount = Object.keys(parsedGroups).length;
    if (parsedTagCount === 0) {
      res.status(422).json({
        error:
          'El CSV no contiene ningún grupo con precios fixed-amount. Verifica que el export sea de Samita y que las reglas estén activas.',
      });
      return;
    }

    let finalGroups = parsedGroups;
    let previous = null;
    let preservedTags = [];
    if (mode === 'merge') {
      previous = await fetchWholesaleSnapshotFromBlob().catch((err) => {
        console.warn('[import-wholesale-csv] no se pudo leer Blob previo:', err?.message || err);
        return null;
      });
      const previousGroups = previous?.groups || {};
      finalGroups = mergeGroups(previousGroups, parsedGroups);
      preservedTags = Object.keys(previousGroups).filter(
        (tag) => !Object.prototype.hasOwnProperty.call(parsedGroups, tag),
      );
    }

    const snapshot = {
      _generatedFrom: `Samita CSV upload (${mode})`,
      _generatedAt: new Date().toISOString(),
      _sourceFile: fileName,
      _importedGroups: Object.keys(parsedGroups).sort(),
      _preservedFromBlob: preservedTags.sort(),
      groups: finalGroups,
    };

    // Un CSV siempre reemplaza el snapshot Samita → conteo puede bajar si el
    // cliente desactivó reglas. `allowShrink: true` es intencional.
    const url = await publishWholesaleSnapshotToBlob(snapshot, { allowShrink: true });
    invalidateWholesaleCache();

    const stats = snapshotStats(snapshot);
    res.status(200).json({
      ok: true,
      url,
      generatedAt: snapshot._generatedAt,
      mode,
      importedGroups: snapshot._importedGroups,
      preservedFromBlob: snapshot._preservedFromBlob,
      ...stats,
      note: 'Precios live en Blob. Cache API ~45s. Merge conserva los grupos que ya estaban.',
    });
  } catch (err) {
    console.error('[import-wholesale-csv]', err);
    res.status(400).json({
      error: err?.message || 'No se pudo importar el CSV.',
      code: err?.code || 'CSV_IMPORT_FAILED',
    });
  }
}
