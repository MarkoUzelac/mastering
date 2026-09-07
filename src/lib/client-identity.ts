const STORAGE_KEY = 'masteringlocal.session.token';

let sessionToken: string | null = null;
let sessionPromise: Promise<string | null> | null = null;

function readStoredToken() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string) {
  try {
    window.localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // Storage can be unavailable in privacy-restricted browsers.
  }
}

async function createSession(): Promise<string | null> {
  const existing = sessionToken || readStoredToken();
  if (existing) {
    sessionToken = existing;
    return existing;
  }

  if (sessionPromise) return sessionPromise;

  sessionPromise = (async () => {
    try {
      const clientId = crypto.randomUUID();
      const response = await fetch('/api/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });
      const data = (await response.json().catch(() => null)) as { token?: string } | null;
      if (!response.ok || !data?.token) return null;
      sessionToken = data.token;
      writeStoredToken(data.token);
      return data.token;
    } catch {
      return null;
    } finally {
      sessionPromise = null;
    }
  })();

  return sessionPromise;
}

export async function getApiAuthHeaders(): Promise<Record<string, string>> {
  const token = await createSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function clearClientSession() {
  sessionToken = null;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
