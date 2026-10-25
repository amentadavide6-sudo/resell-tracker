import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getDatabase } from '../services/db';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  cardBorder: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryBg: string;
  tabBarBg: string;
  tabBarBorder: string;
  inputBg: string;
  inputBorder: string;
  statusBarStyle: 'light' | 'dark';
}

export const lightColors: ThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  cardBorder: '#E2E8F0',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  primary: '#6366F1',
  primaryBg: '#EEF2FF',
  tabBarBg: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
  inputBg: '#FFFFFF',
  inputBorder: '#E2E8F0',
  statusBarStyle: 'dark',
};

export const darkColors: ThemeColors = {
  background: '#0B0F19',
  card: '#161F30',
  cardBorder: '#283548',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  primary: '#818CF8',
  primaryBg: '#1E1B4B',
  tabBarBg: '#111827',
  tabBarBorder: '#1F2937',
  inputBg: '#111827',
  inputBorder: '#374151',
  statusBarStyle: 'light',
};

interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  isDark: false,
  colors: lightColors,
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');

  // Load saved theme preference from SQLite
  useEffect(() => {
    try {
      const db = getDatabase();
      db.execSync(`
        CREATE TABLE IF NOT EXISTS user_settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
      const row = db.getFirstSync<{ value: string }>(
        'SELECT value FROM user_settings WHERE key = ?',
        ['theme_mode']
      );
      if (row && (row.value === 'light' || row.value === 'dark' || row.value === 'system')) {
        setThemeModeState(row.value as ThemeMode);
      }
    } catch (e) {
      console.error('Error loading theme:', e);
    }
  }, []);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      const db = getDatabase();
      db.runSync(
        `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('theme_mode', ?)`,
        [mode]
      );
    } catch (e) {
      console.error('Error saving theme:', e);
    }
  };

  const isDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : systemColorScheme === 'dark';

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
