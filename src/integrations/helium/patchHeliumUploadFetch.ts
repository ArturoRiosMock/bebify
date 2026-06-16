const UPLOAD_PATH = '/embed_api/v4/customers/upload';
const PATCH_FLAG = '__bebifyHeliumUploadPatched';

type UploadJson = {
  url?: string;
  key?: string;
};

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

async function readUploadJson(response: Response): Promise<UploadJson | null> {
  try {
    return (await response.clone().json()) as UploadJson;
  } catch {
    return null;
  }
}

function uploadSucceeded(response: Response, json: UploadJson | null): boolean {
  return response.ok && Boolean(json?.url);
}

async function tryUpload(
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

/**
 * Normaliza dominio de tienda en subidas. Reintenta tipos de columna sin lanzar errores
 * para no interrumpir el flujo nativo de Helium (como en el preview del admin).
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
    initialFormData.set('customer[domain]', normalizedDomain);

    const columnTypes = new Set<string>();
    const initialType = String(initialFormData.get('customer[columnType]') ?? 'file');
    columnTypes.add(initialType);
    columnTypes.add(initialType === 'file' ? 'file_reference' : 'file');

    let lastResponse: Response | null = null;

    for (const columnType of columnTypes) {
      const formData = cloneFormData(initialFormData);
      formData.set('customer[columnType]', columnType);
      const response = await tryUpload(originalFetch, input, init, formData);
      const json = await readUploadJson(response);
      lastResponse = response;

      if (uploadSucceeded(response, json)) {
        return response;
      }
    }

    return lastResponse ?? originalFetch(input, init);
  };

  globalWindow[PATCH_FLAG] = true;
}
