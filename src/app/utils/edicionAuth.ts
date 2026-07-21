export const EDICION_AUTH_KEY = 'edicion-auth';
export const EDICION_CREDS_KEY = 'edicion-creds';

export type EdicionCredentials = {
  username: string;
  password: string;
};

export function isEdicionAuthenticated(): boolean {
  return sessionStorage.getItem(EDICION_AUTH_KEY) === 'true' && Boolean(getEdicionCredentials());
}

export function getEdicionCredentials(): EdicionCredentials | null {
  const raw = sessionStorage.getItem(EDICION_CREDS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as EdicionCredentials;
    if (!parsed?.username || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setEdicionSession(credentials: EdicionCredentials | null): void {
  if (credentials) {
    sessionStorage.setItem(EDICION_AUTH_KEY, 'true');
    sessionStorage.setItem(EDICION_CREDS_KEY, JSON.stringify(credentials));
    return;
  }
  sessionStorage.removeItem(EDICION_AUTH_KEY);
  sessionStorage.removeItem(EDICION_CREDS_KEY);
}

export async function verifyEdicionCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const res = await fetch('/api/home-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, authOnly: true }),
  });
  return res.ok;
}
