import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { put } from '@vercel/blob';
import { adminGraphql } from './shopify.mjs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function validateImageUpload({ filename, contentType, buffer }) {
  if (!buffer?.length) {
    throw new Error('Archivo vacío');
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error('La imagen no puede superar 5 MB');
  }
  if (!ALLOWED_TYPES.has(contentType)) {
    throw new Error('Formato no permitido. Usa JPG, PNG, WebP o GIF');
  }
  const safeBase = String(filename || 'imagen')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
  const ext = EXT_BY_TYPE[contentType] || 'jpg';
  const hasExt = /\.(jpe?g|png|webp|gif)$/i.test(safeBase);
  const finalName = `${Date.now()}-${hasExt ? safeBase : `${safeBase}.${ext}`}`;
  return { finalName, contentType, buffer };
}

export function saveImageToPublicUploads(projectRoot, { finalName, buffer }) {
  const dir = join(projectRoot, 'public', 'uploads', 'home');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, finalName), buffer);
  return `/uploads/home/${finalName}`;
}

export async function uploadImageToBlob({ finalName, contentType, buffer }) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN no configurado');
  }

  const blob = await put(`home-banners/${finalName}`, buffer, {
    access: 'public',
    contentType,
    token,
    addRandomSuffix: false,
  });

  return blob.url;
}

async function stagedUpload(filename, contentType, buffer) {
  const data = await adminGraphql(
    `mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters { name value }
        }
        userErrors { field message }
      }
    }`,
    {
      input: [
        {
          filename,
          mimeType: contentType,
          httpMethod: 'POST',
          resource: 'FILE',
          fileSize: String(buffer.length),
        },
      ],
    },
  );

  const errors = data?.stagedUploadsCreate?.userErrors;
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }

  const target = data?.stagedUploadsCreate?.stagedTargets?.[0];
  if (!target?.url || !target?.resourceUrl) {
    throw new Error('No se pudo crear la URL de subida en Shopify');
  }

  const form = new FormData();
  for (const param of target.parameters || []) {
    form.append(param.name, param.value);
  }
  form.append('file', new Blob([buffer], { type: contentType }), filename);

  const uploadRes = await fetch(target.url, { method: 'POST', body: form });
  if (!uploadRes.ok) {
    throw new Error(`Error al subir a Shopify (${uploadRes.status})`);
  }

  return target.resourceUrl;
}

async function createShopifyFile(resourceUrl, alt) {
  const data = await adminGraphql(
    `mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          ... on MediaImage {
            image { url }
          }
        }
        userErrors { field message }
      }
    }`,
    {
      files: [
        {
          alt: alt || 'Banner Bebify',
          contentType: 'IMAGE',
          originalSource: resourceUrl,
        },
      ],
    },
  );

  const errors = data?.fileCreate?.userErrors;
  if (errors?.length) {
    throw new Error(errors.map((e) => e.message).join('; '));
  }

  const file = data?.fileCreate?.files?.[0];
  if (!file?.id) {
    throw new Error('Shopify no devolvió el archivo creado');
  }

  return file;
}

async function waitForImageUrl(fileId, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    const data = await adminGraphql(
      `query($id: ID!) {
        node(id: $id) {
          ... on MediaImage {
            fileStatus
            image { url }
          }
        }
      }`,
      { id: fileId },
    );
    const node = data?.node;
    if (node?.image?.url) {
      return node.image.url;
    }
    if (node?.fileStatus === 'FAILED') {
      throw new Error('Shopify no pudo procesar la imagen');
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('La imagen se subió pero aún no está lista. Intenta de nuevo en unos segundos.');
}

export async function uploadImageToShopify({ finalName, contentType, buffer, alt }) {
  const resourceUrl = await stagedUpload(finalName, contentType, buffer);
  const file = await createShopifyFile(resourceUrl, alt);
  if (file.image?.url) {
    return file.image.url;
  }
  return waitForImageUrl(file.id);
}

/** Prefer Vercel Blob; fall back to Shopify Files if Blob is unavailable. */
export async function uploadHomeBannerImage(validated, alt) {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return uploadImageToBlob(validated);
  }
  return uploadImageToShopify({ ...validated, alt });
}

export function parseBase64Payload(body) {
  const { filename, contentType, data } = body || {};
  if (!data || typeof data !== 'string') {
    throw new Error('Falta el archivo (data)');
  }
  const raw = data.includes(',') ? data.split(',')[1] : data;
  const buffer = Buffer.from(raw, 'base64');
  return validateImageUpload({
    filename: filename || 'imagen.jpg',
    contentType: contentType || 'image/jpeg',
    buffer,
  });
}
