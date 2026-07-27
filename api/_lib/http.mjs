// Helpers HTTP compartidos por los endpoints serverless.

/** Parsea `req.body` como JSON (string o objeto). Devuelve null si es inválido. */
export function parseJsonBody(req) {
  try {
    return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch {
    return null;
  }
}
