import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dataPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../api/_data/home-content.json',
);

const ADMIN_USER = process.env.EDICION_ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.EDICION_ADMIN_PASSWORD || 'admin';

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function isAuthorized(body) {
  return body.username === ADMIN_USER && body.password === ADMIN_PASS;
}

function deepMerge(base, override) {
  if (!override || typeof override !== 'object') return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    const val = override[key];
    if (Array.isArray(val)) {
      result[key] = val;
    } else if (val && typeof val === 'object' && !Array.isArray(base[key])) {
      result[key] = deepMerge(base[key] || {}, val);
    } else if (val !== undefined) {
      result[key] = val;
    }
  }
  return result;
}

export function homeContentDevApi() {
  return {
    name: 'home-content-dev-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        if (url !== '/api/home-content') {
          next();
          return;
        }

        try {
          if (req.method === 'GET') {
            const data = fs.readFileSync(dataPath, 'utf8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          }

          if (req.method === 'POST') {
            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            if (!isAuthorized(body)) {
              res.statusCode = 401;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'No autorizado' }));
              return;
            }
            if (!body.content || typeof body.content !== 'object') {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Falta el campo content' }));
              return;
            }
            const defaults = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            const merged = deepMerge(defaults, body.content);
            fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2));
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: true, content: merged }));
            return;
          }

          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method not allowed' }));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message || 'Error interno' }));
        }
      });
    },
  };
}
