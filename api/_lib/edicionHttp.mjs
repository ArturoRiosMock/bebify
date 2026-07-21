import { isAdminCredentials } from './homeContent.mjs';

export function parseBody(req) {
  return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
}

export function checkAuth(req, body) {
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
