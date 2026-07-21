/**
 * Mapa oldHandle → newHandle generado por scripts/rename-product-handles.mjs
 * (y copiado a public/product-handle-redirects.json).
 */

type RedirectMap = Record<string, string>;

let cached: RedirectMap | null = null;
let inflight: Promise<RedirectMap> | null = null;

async function loadRedirectMap(): Promise<RedirectMap> {
  if (cached) return cached;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch('/product-handle-redirects.json', { cache: 'no-cache' });
      if (!res.ok) return {};
      const data = (await res.json()) as RedirectMap;
      cached = data && typeof data === 'object' ? data : {};
      return cached;
    } catch {
      return {};
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/** Si el handle viejo tiene redirect, devuelve el nuevo; si no, null. */
export async function resolveProductHandleRedirect(
  oldHandle: string
): Promise<string | null> {
  if (!oldHandle) return null;
  const map = await loadRedirectMap();
  const next = map[oldHandle];
  if (!next || next === oldHandle) return null;
  return next;
}
