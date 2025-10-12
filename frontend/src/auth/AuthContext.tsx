// frontend/src/auth/AuthContext.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import * as Keychain from '../lib/keychain';
import {
  login as apiLogin,
  getEntries,
  getProfile,
  setMemoryAccessToken,
  ensureThreadId,
} from '../api/client';
import type { Entry, UserProfile } from '../api/types';
import { primeEntries, primeProfile, clearAllCache } from '../lib/dataCache';

type AuthCtx = {
  isAuthed: boolean;
  username: string | null;
  threadId: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setAuthed] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);

  // Bootstrap: se c'è già un access token, considera authed e prefetcha in background + thread
  useEffect(() => {
    (async () => {
      const t = await Keychain.getAccessToken();
      if (!t) return;
      setMemoryAccessToken(t);
      setAuthed(true);
      try {
        const [eRes, pRes] = await Promise.all([getEntries(), getProfile()]);
        const items: Entry[] = Array.isArray(eRes) ? eRes : (eRes?.items ?? []);
        primeEntries(items);
        primeProfile(pRes as UserProfile);
        setUsername((pRes as UserProfile)?.username ?? null);
      } catch {/* best-effort */}

      try {
        const tid = await ensureThreadId();
        setThreadId(tid);
      } catch (e) {
        console.warn('ensureThreadId (bootstrap) fallito:', e);
        setThreadId(null);
      }
    })();
  }, []);

  const login = async (user: string, password: string) => {
    // 1) login
    const { access_token, refresh_token } = await apiLogin(user, password);

    // 2) salva token
    await Keychain.saveAccessToken(access_token);
    if (refresh_token) await Keychain.saveRefreshToken(refresh_token);
    setMemoryAccessToken(access_token);

    // 3) prefetch bloccante
    try {
      const [eRes, pRes] = await Promise.all([getEntries(), getProfile()]);
      const items: Entry[] = Array.isArray(eRes) ? eRes : (eRes?.items ?? []);
      primeEntries(items);
      primeProfile(pRes as UserProfile);
      setUsername((pRes as UserProfile)?.username ?? user);
    } catch {
      setUsername(user);
    }

    // 4) garantisci un thread_id valido
    try {
      const tid = await ensureThreadId();
      setThreadId(tid);
    } catch (e) {
      console.warn('ensureThreadId (login) fallito:', e);
      setThreadId(null);
    }

    // 5) sblocca UI
    setAuthed(true);
  };

  const logout = async () => {
    await Keychain.clearAllTokens();
    setMemoryAccessToken(null);
    clearAllCache();
    setUsername(null);
    setThreadId(null);
    setAuthed(false);
  };

  const value = useMemo<AuthCtx>(
    () => ({ isAuthed, username, threadId, login, logout }),
    [isAuthed, username, threadId]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}