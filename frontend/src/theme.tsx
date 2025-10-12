import React, { createContext, useContext, useMemo, useState } from 'react';

/* -------------------- design tokens -------------------- */
export const spacing = (n: number) => n * 8;

export const fonts = {
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.2 },
  h2:    { fontSize: 20, fontWeight: '600' },
  body:  { fontSize: 16, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
};

/* -------------------- base dark + accenti -------------------- */
const baseDark = {
  bg: '#000000',
  card: '#111111',
  elevated: '#141414',
  text: '#FFFFFF',
  subtext: '#9CA3AF',
  line: '#262626',
};

export type AccentKey = 'purple' | 'orange' | 'amber';
const ACCENTS: Record<AccentKey, string> = {
  purple: '#4B19AE',
  orange: '#F97316',
  amber:  '#F59E0B',
};

// #RRGGBB + alpha → #RRGGBBAA
function addAlpha(hex: string, alpha: number) {
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${hex}${a.toString(16).padStart(2, '0').toUpperCase()}`;
}

function buildColors(accentHex: string) {
  const primary = accentHex;
  return {
    ...baseDark,
    primary,
    accent: primary, // alias retro-compatibilità
    primaryOn: '#FFFFFF',
    primarySoft: addAlpha(primary, 0.12),
    primarySoftBorder: addAlpha(primary, 0.28),
  };
}

/* -------------------- Theme object -------------------- */
function makeTheme(accentHex: string) {
  const colors = buildColors(accentHex);
  return {
    mode: 'dark' as const,
    colors,
    // accesso “flat” per codice legacy: theme.bg, theme.card, ecc.
    ...colors,
  };
}
export type Theme = ReturnType<typeof makeTheme>;

/* -------------------- Context & Provider -------------------- */
type ThemeCtx = {
  theme: Theme;
  accent: AccentKey;
  setAccent: (k: AccentKey) => void;
};

const ThemeContext = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccent] = useState<AccentKey>('purple');
  const theme = useMemo(() => makeTheme(ACCENTS[accent]), [accent]);

  return (
    <ThemeContext.Provider value={{ theme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/* -------------------- Export compatibile per i vecchi import -------------------- */
// Molti file fanno: `import { theme } from '../theme'` e si aspettano theme.bg ecc.
// Manteniamo questo export per non rompere nulla.
export const theme = makeTheme(ACCENTS.purple);