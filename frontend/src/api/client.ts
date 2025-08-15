// frontend/src/api/client.ts
import { API_BASE } from '../config';
import {
  getAccessToken,
  saveAccessToken,
  getRefreshToken,
  saveRefreshToken,
  clearAllTokens,
} from '../lib/keychain';

const TIMEOUT_MS = 15000;

let memoryAccess: string | null = null;
export function setMemoryAccessToken(t: string | null) {
  memoryAccess = t;
}

function joinUrl(base: string, path: string) {
  if (!base.endsWith('/') && !path.startsWith('/')) return `${base}/${path}`;
  if (base.endsWith('/') && path.startsWith('/')) return `${base}${path.slice(1)}`;
  return `${base}${path}`;
}

async function withTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function parseJsonSafe<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as unknown as T;
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // se non è JSON, torna testo “grezzo” in un campo
    return { raw: text } as unknown as T;
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T>(
  method: Method,
  path: string,
  body?: unknown,
  opts?: { auth?: boolean; retry?: boolean }
): Promise<T> {
  const { auth = true, retry = true } = opts ?? {};
  const url = joinUrl(API_BASE, path);

  // headers base
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // auth header
  if (auth) {
    const t = memoryAccess ?? (await getAccessToken());
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  // body
  const init: RequestInit = {
    method,
    headers,
  };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);

  // 1° tentativo
  let res = await withTimeout(url, init, TIMEOUT_MS);

  // refresh se 401 e possiamo ritentare
  if (auth && res.status === 401 && retry) {
    try {
      const rt = await getRefreshToken();
      if (!rt) throw new Error('no refresh token');

      const rr = await withTimeout(
        joinUrl(API_BASE, '/auth/refresh'),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: rt }),
        },
        TIMEOUT_MS
      );

      if (!rr.ok) throw new Error(`refresh failed: ${rr.status}`);
      const data = (await rr.json()) as { access_token: string; refresh_token?: string };

      if (data.access_token) {
        await saveAccessToken(data.access_token);
        setMemoryAccessToken(data.access_token);
        // opzionale: salva anche il nuovo refresh, se fornito
        if (data.refresh_token) await saveRefreshToken(data.refresh_token);

        // ritenta la chiamata originale con nuovo bearer
        (init.headers as Record<string, string>).Authorization = `Bearer ${data.access_token}`;
        res = await withTimeout(url, init, TIMEOUT_MS);
      } else {
        throw new Error('no access token in refresh response');
      }
    } catch {
      await clearAllTokens();
      // ricadi nell’errore del response originale/ritentato
    }
  }

  if (!res.ok) {
    const errBody = await parseJsonSafe<any>(res);
    const msg = typeof errBody?.detail === 'string'
      ? errBody.detail
      : `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return parseJsonSafe<T>(res);
}

// ---- Helper “comodi” (come prima) ----
export async function login(email: string, password: string) {
  // se vuoi salvare subito i token, fallo qui dopo la risposta
  const data = await request<{ access_token: string; refresh_token?: string }>(
    'POST',
    '/auth/login',
    { email, password },
    { auth: false } // di solito login non richiede Bearer
  );
  return data;
}

export async function getEntries() {
  return request<any>('GET', '/entries');
}

export async function createEntry(content: string, mood: number | null) {
  return request<any>('POST', '/entries', { content, mood });
}

export async function chat(message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) {
  return request<any>('POST', '/chat', { message, history });
}