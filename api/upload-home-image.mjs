import { isAdminCredentials } from './_lib/homeContent.mjs';
import { parseBase64Payload, uploadImageToShopify } from './_lib/uploadHomeImage.mjs';

function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
}

function checkAuth(req, body) {
  if (isAdminCredentials(body.username, body.password)) {
    return true;
  }

  const auth = req.headers.authorization;
  if (auth?.startsWith('Basic ')) {
    const decoded = Buffer.from(auth.slice(6), 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon === -1) return false;
    return isAdminCredentials(decoded.slice(0, colon), decoded.slice(colon + 1));
  }

  return false;
}

export default async function uploadHomeImageHandler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = parseBody(req);
    if (!checkAuth(req, body)) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const validated = parseBase64Payload(body);
    const url = await uploadImageToShopify({
      ...validated,
      alt: body.alt || 'Banner Bebify',
    });

    res.status(200).json({ ok: true, url });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error al subir imagen' });
  }
}
