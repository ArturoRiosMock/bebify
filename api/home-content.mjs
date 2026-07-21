import { getHomeContent, saveHomeContent } from './_lib/homeContent.mjs';
import { checkAuth, parseBody } from './_lib/edicionHttp.mjs';

export default async function homeContentHandler(req, res) {
  if (req.method === 'GET') {
    try {
      const content = await getHomeContent();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(content);
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error al leer contenido' });
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = parseBody(req);
      if (!checkAuth(req, body)) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      if (body.authOnly === true) {
        res.status(200).json({ ok: true });
        return;
      }

      if (!body.content || typeof body.content !== 'object') {
        res.status(400).json({ error: 'Falta el campo content' });
        return;
      }

      const saved = await saveHomeContent(body.content);
      res.status(200).json({ ok: true, content: saved });
    } catch (err) {
      res.status(500).json({ error: err.message || 'Error al guardar contenido' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
