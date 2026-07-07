export const EDICION_AUTH_KEY = 'edicion-auth';
export const EDICION_USER = 'admin';
export const EDICION_PASS = 'admin';

export function isEdicionAuthenticated(): boolean {
  return sessionStorage.getItem(EDICION_AUTH_KEY) === 'true';
}

export function setEdicionAuthenticated(value: boolean): void {
  if (value) {
    sessionStorage.setItem(EDICION_AUTH_KEY, 'true');
  } else {
    sessionStorage.removeItem(EDICION_AUTH_KEY);
  }
}

export function checkEdicionCredentials(username: string, password: string): boolean {
  return username === EDICION_USER && password === EDICION_PASS;
}
