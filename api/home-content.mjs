import { getHomeContent, saveHomeContent, isAdminCredentials } from './_lib/homeContent.mjs';

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
    const user = decoded.slice(0, colon);
    const pass = decoded.slice(colon + 1);
    return isAdminCredentials(user, pass);
  }

  return false;
}

export default async function homeContentHandler(req, res) {
  if (req.method === 'GET') {
    try {
      const content = await getHomeContent();
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
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
