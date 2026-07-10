import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from 'vite';
import {
  parseBase64Payload,
  saveImageToPublicUploads,
} from '../api/_lib/uploadHomeImage.mjs';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataPath = path.join(rootDir, 'api/_data/home-content.json');

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function getAdminCredentials(mode = 'development') {
  const env = loadEnv(mode, rootDir, '');
  return {
    user: env.EDICION_ADMIN_USER || process.env.EDICION_ADMIN_USER || 'admin',
    pass: env.EDICION_ADMIN_PASSWORD || process.env.EDICION_ADMIN_PASSWORD || '',
  };
}

function isAuthorized(body, mode) {
  const { user, pass } = getAdminCredentials(mode);
  if (!pass) return false;
  return body.username === user && body.password === pass;
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

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(payload));
}

export function homeContentDevApi() {
  return {
    name: 'home-content-dev-api',
    apply: 'serve',
    configureServer(server) {
      const mode = server.config.mode || 'development';

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        try {
          if (url === '/api/home-content') {
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
              if (!isAuthorized(body, mode)) {
                sendJson(res, 401, { error: 'No autorizado' });
                return;
              }
              if (body.authOnly === true) {
                sendJson(res, 200, { ok: true });
                return;
              }
              if (!body.content || typeof body.content !== 'object') {
                sendJson(res, 400, { error: 'Falta el campo content' });
                return;
              }
              const defaults = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
              const merged = deepMerge(defaults, body.content);
              fs.writeFileSync(dataPath, JSON.stringify(merged, null, 2));
              sendJson(res, 200, { ok: true, content: merged });
              return;
            }

            sendJson(res, 405, { error: 'Method not allowed' });
            return;
          }

          if (url === '/api/upload-home-image') {
            if (req.method !== 'POST') {
              sendJson(res, 405, { error: 'Method not allowed' });
              return;
            }

            const raw = await readBody(req);
            const body = JSON.parse(raw || '{}');
            if (!isAuthorized(body, mode)) {
              sendJson(res, 401, { error: 'No autorizado' });
              return;
            }

            const validated = parseBase64Payload(body);
            const imageUrl = saveImageToPublicUploads(rootDir, validated);
            sendJson(res, 200, { ok: true, url: imageUrl });
            return;
          }

          next();
        } catch (err) {
          sendJson(res, 500, { error: err.message || 'Error interno' });
        }
      });
    },
  };
}
