// frontend/src/api/client.ts
import { API_BASE } from '../config';
import {
  getAccessToken,
  saveAccessToken,
  getRefreshToken,
  saveRefreshToken,
  clearAllTokens,
} from '../lib/keychain';
import type { ChatbotResponse, UserProfile } from './types';

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

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (auth) {
    const t = memoryAccess ?? (await getAccessToken());
    if (t) headers.Authorization = `Bearer ${t}`;
  }

  const init: RequestInit = { method, headers };
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body);

  let res = await withTimeout(url, init, TIMEOUT_MS);

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
        if (data.refresh_token) await saveRefreshToken(data.refresh_token);
        (init.headers as Record<string, string>).Authorization = `Bearer ${data.access_token}`;
        res = await withTimeout(url, init, TIMEOUT_MS);
      } else {
        throw new Error('no access token in refresh response');
      }
    } catch {
      await clearAllTokens();
    }
  }

  if (!res.ok) {
    const errBody = await parseJsonSafe<any>(res);
    const msg =
      (typeof errBody?.detail === 'string' && errBody.detail) ||
      (typeof errBody?.error?.message === 'string' && errBody.error.message) ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return parseJsonSafe<T>(res);
}

// ------------ AUTH ------------
export async function login(username: string, password: string) {
  return request<{ access_token: string; refresh_token?: string }>(
    'POST',
    '/auth/login',
    { username, password },
    { auth: false }
  );
}

// ------------ ENTRIES ------------
export async function getEntries(params?: { skip?: number; limit?: number }) {
  const skip = params?.skip ?? 0;
  const limit = params?.limit ?? 20;
  const q = `/entries?skip=${encodeURIComponent(skip)}&limit=${encodeURIComponent(limit)}`;
  return request<any>('GET', q);
}

export async function createEntry(dto: { title?: string; content: string }) {
  return request<any>('POST', '/entries', dto);
}

export async function getEntryById(id: number) {
  return request<any>('GET', `/entries/${id}`);
}

// ------------ PROFILE ------------
export async function getProfile() {
  return request<UserProfile>('GET', '/users/me');
}

export async function updateProfileSettings(patch: {
  reminder_hour?: number;
  tz_iana?: string;
  email_opt_in?: boolean;
}) {
  return request<UserProfile>('PATCH', '/me/settings', patch);
}

// ------------ CHATBOT ------------
export async function chat(message: string, threadId: string) {
  return request<ChatbotResponse>('POST', '/chatbot/send_message', {
    message,
    thread_id: threadId,
  });
}

export async function promptOfDay() {
  return request<{text: string}>('GET', '/chatbot/prompt_of_day');
}

// Ottiene il thread_id se esiste
export async function getThreadId() {
  return request<{ thread_id?: string | null }>('GET', '/chatbot/thread_id');
}

// Crea (o assicura) un thread_id lato server e lo restituisce
export async function createThreadId() {
  // endpoint POST che crea/salva il thread sul profilo e ritorna { thread_id }
  return request<{ thread_id: string }>('POST', '/chatbot/thread_id');
}

// Utility: garantisce un thread_id valido iniziando con "thread_"
export async function ensureThreadId(): Promise<string> {
  try {
    const r = await getThreadId();
    if (r?.thread_id && r.thread_id.startsWith('thread_')) return r.thread_id;
  } catch {
    // se il GET fallisce, tentiamo comunque la creazione
  }
  const c = await createThreadId();
  if (!c?.thread_id || !c.thread_id.startsWith('thread_')) {
    throw new Error('Thread non valido dal server');
  }
  return c.thread_id;
}