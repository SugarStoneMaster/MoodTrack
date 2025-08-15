import React, { createContext, useContext, useEffect, useState } from 'react';
import { login as apiLogin } from '../api/client';
import { saveAccessToken, saveRefreshToken, getAccessToken, clearAllTokens } from '../lib/keychain';
import { setMemoryAccessToken } from '../api/client';

type AuthCtx = { isAuthed: boolean; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void>; };
const Ctx = createContext<AuthCtx>({ isAuthed: false, login: async()=>{}, logout: async()=>{} });
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthed, setAuthed] = useState(false);

  useEffect(() => { (async () => {
    const t = await getAccessToken();
    setAuthed(!!t);
    setMemoryAccessToken(t);
  })(); }, []);

  const login = async (email: string, password: string) => {
    const r = await apiLogin(email, password);
    await saveAccessToken(r.access_token);
    if (r.refresh_token) await saveRefreshToken(r.refresh_token);
    setMemoryAccessToken(r.access_token);
    setAuthed(true);
  };

  const logout = async () => {
    await clearAllTokens();
    setMemoryAccessToken(null);
    setAuthed(false);
  };

  return <Ctx.Provider value={{ isAuthed, login, logout }}>{children}</Ctx.Provider>;
}