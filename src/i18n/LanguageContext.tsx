import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getLocales } from 'expo-localization';
import { getDatabase } from '../services/db';
import { SupportedLanguage, LanguageMode, TranslationDictionary } from './types';
import { it } from './it';
import { en } from './en';
import { fr } from './fr';
import { es } from './es';
import { de } from './de';

const DICTIONARIES: Record<SupportedLanguage, TranslationDictionary> = {
  it,
  en,
  fr,
  es,
  de,
};

export function getDeviceLanguage(): SupportedLanguage {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0 && locales[0].languageCode) {
      const code = locales[0].languageCode.toLowerCase();
      if (code === 'it' || code === 'en' || code === 'fr' || code === 'es' || code === 'de') {
        return code;
      }
    }
  } catch (e) {
    console.warn('Error reading device locale:', e);
  }
  return 'it';
}

interface LanguageContextType {
  language: SupportedLanguage;
  languageMode: LanguageMode;
  setLanguageMode: (mode: LanguageMode) => void;
  strings: TranslationDictionary;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'it',
  languageMode: 'system',
  setLanguageMode: () => {},
  strings: it,
  t: (path) => path,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageMode, setLanguageModeState] = useState<LanguageMode>('system');

  // Load saved preference from SQLite
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
        ['language_mode']
      );
      if (
        row &&
        (row.value === 'system' ||
          row.value === 'it' ||
          row.value === 'en' ||
          row.value === 'fr' ||
          row.value === 'es' ||
          row.value === 'de')
      ) {
        setLanguageModeState(row.value as LanguageMode);
      }
    } catch (e) {
      console.error('Error loading language mode:', e);
    }
  }, []);

  const setLanguageMode = (mode: LanguageMode) => {
    setLanguageModeState(mode);
    try {
      const db = getDatabase();
      db.runSync(
        `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('language_mode', ?)`,
        [mode]
      );
    } catch (e) {
      console.error('Error persisting language mode:', e);
    }
  };

  const activeLanguage: SupportedLanguage = useMemo(() => {
    if (languageMode === 'system') {
      return getDeviceLanguage();
    }
    return languageMode;
  }, [languageMode]);

  const strings = useMemo(() => {
    return DICTIONARIES[activeLanguage] || it;
  }, [activeLanguage]);

  const t = (path: string, params?: Record<string, string | number>): string => {
    try {
      const parts = path.split('.');
      let current: any = strings;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return path;
        }
      }

      if (typeof current === 'string') {
        if (params) {
          let result = current;
          for (const [key, val] of Object.entries(params)) {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
          }
          return result;
        }
        return current;
      }
      return path;
    } catch {
      return path;
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language: activeLanguage,
        languageMode,
        setLanguageMode,
        strings,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
export const useTranslation = () => {
  const { strings, t, language, languageMode, setLanguageMode } = useContext(LanguageContext);
  return { strings, t, language, languageMode, setLanguageMode };
};
