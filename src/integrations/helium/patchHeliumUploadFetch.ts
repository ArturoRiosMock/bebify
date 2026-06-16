const UPLOAD_PATH = '/embed_api/v4/customers/upload';
const PATCH_FLAG = '__bebifyHeliumUploadPatched';

type UploadJson = {
  url?: string;
  key?: string;
  error?: string;
  errors?: string[];
};

async function readUploadJson(response: Response): Promise<UploadJson | null> {
  try {
    return (await response.clone().json()) as UploadJson;
  } catch {
    return null;
  }
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

function cloneFormData(formData: FormData): FormData {
  const clone = new FormData();
  for (const [key, value] of formData.entries()) {
    clone.append(key, value);
  }
  return clone;
}

function trimFormDataDomain(formData: FormData, shopDomain: string) {
  formData.set('customer[domain]', shopDomain);
}

async function requestUpload(
  originalFetch: typeof fetch,
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  formData: FormData,
): Promise<Response> {
  const headers = new Headers(init?.headers ?? undefined);
  return originalFetch(input, {
    ...init,
    body: formData,
    headers,
  });
}

function uploadHasFile(response: Response, json: UploadJson | null): boolean {
  return response.ok && Boolean(json?.url);
}

/**
 * Helium sube archivos vía fetch. Si file_reference falla o la respuesta no es JSON,
 * reintenta con columnType=file y normaliza el dominio de la tienda.
 */
export function patchHeliumUploadFetch(shopDomain: string): void {
  const globalWindow = window as Window & { [PATCH_FLAG]?: boolean };
  if (globalWindow[PATCH_FLAG]) return;

  const normalizedDomain = shopDomain.trim();
  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const url = getRequestUrl(input);

    if (!url.includes(UPLOAD_PATH) || !(init?.body instanceof FormData)) {
      return originalFetch(input, init);
    }

    const initialFormData = cloneFormData(init.body);
    trimFormDataDomain(initialFormData, normalizedDomain);

    let response = await requestUpload(originalFetch, input, init, initialFormData);
    let json = await readUploadJson(response);

    if (uploadHasFile(response, json)) {
      return response;
    }

    const columnType = initialFormData.get('customer[columnType]');
    if (columnType !== 'file') {
      const retryFormData = cloneFormData(initialFormData);
      retryFormData.set('customer[columnType]', 'file');
      response = await requestUpload(originalFetch, input, init, retryFormData);
      json = await readUploadJson(response);
    }

    if (!uploadHasFile(response, json)) {
      throw new Error('No se pudo subir el archivo PDF. Verifica que sea un PDF válido e intenta de nuevo.');
    }

    return response;
  };

  globalWindow[PATCH_FLAG] = true;
}
