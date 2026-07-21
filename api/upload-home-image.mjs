import { parseBase64Payload, uploadHomeBannerImage } from './_lib/uploadHomeImage.mjs';
import { checkAuth, parseBody } from './_lib/edicionHttp.mjs';

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
    const url = await uploadHomeBannerImage(validated, body.alt || 'Banner Mr. Brown');

    res.status(200).json({ ok: true, url });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Error al subir imagen' });
  }
}
