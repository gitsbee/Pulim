import { useEffect, useState } from 'react';
export type Theme = 'system' | 'light' | 'dark' | 'paper';
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => { try { const saved = localStorage.getItem('pulim:theme'); return saved === 'light' || saved === 'dark' || saved === 'paper' ? saved : 'system'; } catch { return 'system'; } });
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => { const media = matchMedia('(prefers-color-scheme: dark)'); const change = () => setSystemDark(media.matches); media.addEventListener('change', change); return () => media.removeEventListener('change', change); }, []);
  useEffect(() => { const dark = theme === 'dark' || theme === 'system' && systemDark; document.documentElement.dataset.theme = theme === 'paper' ? 'paper' : dark ? 'dark' : 'light'; document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; document.querySelector('meta[name=theme-color]')?.setAttribute('content', theme === 'paper' ? '#eee8d9' : dark ? '#151515' : '#f8f8f8'); try { localStorage.setItem('pulim:theme', theme); } catch { /* Theme still works for this session. */ } }, [theme, systemDark]);
  return { theme, setTheme };
}
