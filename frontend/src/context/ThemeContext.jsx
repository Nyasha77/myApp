import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'ascend:theme'; // 'light' | 'dark' | 'system'

function resolveIsDark(theme) {
  return theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function applyTheme(theme) {
  const root = document.documentElement;
  const isDark = resolveIsDark(theme);
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);
  return isDark;
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'dark');
  const [resolvedTheme, setResolvedTheme] = useState(() => (resolveIsDark(theme) ? 'dark' : 'light'));

  useEffect(() => {
    setResolvedTheme(applyTheme(theme) ? 'dark' : 'light');
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => setResolvedTheme(applyTheme('system') ? 'dark' : 'light');
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
    return undefined;
  }, [theme]);

  const setTheme = useCallback((next) => {
    localStorage.setItem(STORAGE_KEY, next);
    setThemeState(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
