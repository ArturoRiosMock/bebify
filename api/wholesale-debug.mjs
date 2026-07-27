// POST /api/wholesale-debug
// Diagnóstico admin: dado un email de cliente, devuelve sus tags, los grupos
// del Blob y ejemplos de precios. Sirve para chequear rápido por qué un
// cliente no ve mayoreo.
import { isAdminCredentials } from './_lib/homeContent.mjs';
import { parseJsonBody } from './_lib/http.mjs';
import { adminGraphql } from './_lib/shopify.mjs';
import { fetchWholesaleSnapshotFromBlob } from './_lib/samitaWholesale.mjs';

async function customerByEmail(email) {
  const data = await adminGraphql(
    `query($q: String!) {
       customers(first: 1, query: $q) {
         edges { node { id email firstName lastName tags } }
       }
     }`,
    { q: `email:${email}` },
  );
  return data?.customers?.edges?.[0]?.node || null;
}

export default async function wholesaleDebug(req, res) {
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

  const email = String(body.email || '').trim().toLowerCase();
  if (!email) {
    res.status(400).json({ error: 'Falta email.' });
    return;
  }

  try {
    const snapshotResult = await fetchWholesaleSnapshotFromBlob().catch((err) => {
      console.warn('[wholesale-debug] no se pudo leer Blob:', err?.message || err);
      return { error: err?.message || String(err) };
    });
    const snapshot = snapshotResult?.error ? null : snapshotResult;
    const blobError = snapshotResult?.error;
    const customer = await customerByEmail(email);

    const groups = snapshot?.groups || {};
    const availableTags = Object.keys(groups);
    const customerTags = customer?.tags || [];
    const matchedTags = customerTags.filter((t) => Boolean(groups[t]));
    const productsInMatched = matchedTags.reduce(
      (n, t) => n + Object.keys(groups[t] || {}).length,
      0,
    );
    const samples = {};
    for (const t of matchedTags) {
      const entries = Object.entries(groups[t] || {}).slice(0, 5);
      samples[t] = Object.fromEntries(entries);
    }

    res.status(200).json({
      ok: true,
      email,
      customer: customer
        ? {
            id: customer.id,
            firstName: customer.firstName,
            lastName: customer.lastName,
            tags: customerTags,
          }
        : null,
      wholesale: matchedTags.length > 0,
      matchedTags,
      productsInMatched,
      samples,
      snapshot: {
        generatedAt: snapshot?._generatedAt,
        generatedFrom: snapshot?._generatedFrom,
        tagCount: availableTags.length,
        tags: availableTags,
        blobError,
      },
    });
  } catch (err) {
    console.error('[wholesale-debug]', err);
    res.status(500).json({ error: err?.message || 'Error de diagnóstico.' });
  }
}
