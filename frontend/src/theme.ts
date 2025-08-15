import { Appearance } from 'react-native';
const scheme = Appearance.getColorScheme();

export const palette = {
  light: {
    bg: '#FFFFFF',
    card: '#F7F8FA',
    text: '#111111',
    subtext: '#6B7280',
    line: '#E5E7EB',
    accent: '#0A84FF', // iOS system blue
  },
  dark: {
    bg: '#000000',
    card: '#111111',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    line: '#262626',
    accent: '#0A84FF',
  },
};

export const theme = (scheme === 'dark' ? palette.dark : palette.light);

export const spacing = (n: number) => n * 8;

export const fonts = {
  // San Francisco è default su iOS (system font)
  title: { fontSize: 28, fontWeight: '700', letterSpacing: 0.2 },
  h2:    { fontSize: 20, fontWeight: '600' },
  body:  { fontSize: 16, fontWeight: '400' },
  small: { fontSize: 13, fontWeight: '400' },
};