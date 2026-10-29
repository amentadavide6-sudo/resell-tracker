import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { getDatabase } from '../services/db';

export type ThemeMode = 'system' | 'light' | 'dark';
export type AccentTheme = 'classic' | 'gold' | 'emerald' | 'cyberpunk';

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

export const ACCENT_PALETTES: Record<AccentTheme, { light: { primary: string; primaryBg: string }; dark: { primary: string; primaryBg: string } }> = {
  classic: {
    light: { primary: '#6366F1', primaryBg: '#EEF2FF' },
    dark: { primary: '#818CF8', primaryBg: '#1E1B4B' },
  },
  gold: {
    light: { primary: '#D97706', primaryBg: '#FEF3C7' },
    dark: { primary: '#F59E0B', primaryBg: '#451A03' },
  },
  emerald: {
    light: { primary: '#059669', primaryBg: '#D1FAE5' },
    dark: { primary: '#10B981', primaryBg: '#064E3B' },
  },
  cyberpunk: {
    light: { primary: '#9333EA', primaryBg: '#F3E8FF' },
    dark: { primary: '#A855F7', primaryBg: '#3B0764' },
  },
};

interface ThemeContextType {
  themeMode: ThemeMode;
  accentTheme: AccentTheme;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentTheme: (accent: AccentTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  accentTheme: 'classic',
  isDark: false,
  colors: lightColors,
  setThemeMode: () => {},
  setAccentTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [accentTheme, setAccentThemeState] = useState<AccentTheme>('classic');

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

      const accentRow = db.getFirstSync<{ value: string }>(
        'SELECT value FROM user_settings WHERE key = ?',
        ['accent_theme']
      );
      if (accentRow && ['classic', 'gold', 'emerald', 'cyberpunk'].includes(accentRow.value)) {
        setAccentThemeState(accentRow.value as AccentTheme);
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

  const setAccentTheme = (accent: AccentTheme) => {
    setAccentThemeState(accent);
    try {
      const db = getDatabase();
      db.runSync(
        `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('accent_theme', ?)`,
        [accent]
      );
    } catch (e) {
      console.error('Error saving accent theme:', e);
    }
  };

  const isDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : systemColorScheme === 'dark';

  const baseColors = isDark ? darkColors : lightColors;
  const accentOverride = isDark ? ACCENT_PALETTES[accentTheme].dark : ACCENT_PALETTES[accentTheme].light;

  const colors: ThemeColors = {
    ...baseColors,
    primary: accentOverride.primary,
    primaryBg: accentOverride.primaryBg,
  };

  return (
    <ThemeContext.Provider value={{ themeMode, accentTheme, isDark, colors, setThemeMode, setAccentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
