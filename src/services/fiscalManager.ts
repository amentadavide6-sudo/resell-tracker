import { getLocales } from 'expo-localization';
import { getDatabase } from './db';
import { PlatformId } from '../types';

export type FiscalRegime = 'eu_dac7' | 'us_1099k' | 'uk_hmrc' | 'none';
export type FiscalSettingMode = 'auto' | FiscalRegime;
export type CurrencyPreference = 'auto' | 'EUR' | 'USD' | 'GBP';

const EU_REGION_CODES = new Set([
  'IT', 'FR', 'DE', 'ES', 'PT', 'NL', 'BE', 'AT', 'PL', 'SE',
  'FI', 'IE', 'GR', 'CZ', 'RO', 'HU', 'DK', 'SK', 'BG', 'HR',
  'LT', 'SI', 'LV', 'EE', 'CY', 'LU', 'MT'
]);

function initSettingsTable(): void {
  try {
    const db = getDatabase();
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  } catch (err) {
    console.error('Error initializing user_settings for fiscalManager:', err);
  }
}

/**
 * Returns uppercase 2-letter country/region code of device (e.g. "US", "IT", "GB", "FR").
 */
export function getDeviceRegion(): string {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0 && locales[0].regionCode) {
      return locales[0].regionCode.toUpperCase();
    }
  } catch (e) {
    // fallback
  }
  return 'IT';
}

/**
 * Get user saved fiscal setting mode ('auto', 'eu_dac7', 'us_1099k', 'uk_hmrc', 'none').
 */
export function getSavedFiscalMode(): FiscalSettingMode {
  initSettingsTable();
  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['fiscal_regime_mode']
    );
    if (
      row &&
      (row.value === 'auto' ||
        row.value === 'eu_dac7' ||
        row.value === 'us_1099k' ||
        row.value === 'uk_hmrc' ||
        row.value === 'none')
    ) {
      return row.value as FiscalSettingMode;
    }
  } catch (err) {
    // fallback
  }
  return 'auto';
}

/**
 * Save user fiscal setting mode.
 */
export function setFiscalMode(mode: FiscalSettingMode): void {
  initSettingsTable();
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('fiscal_regime_mode', ?)`,
      [mode]
    );
  } catch (err) {
    console.error('Error saving fiscal mode:', err);
  }
}

/**
 * Resolves the currently active fiscal regime for calculations and UI.
 */
export function getActiveFiscalRegime(): FiscalRegime {
  const mode = getSavedFiscalMode();
  if (mode !== 'auto') {
    return mode;
  }

  const region = getDeviceRegion();
  if (region === 'US') {
    return 'us_1099k';
  }
  if (region === 'GB' || region === 'UK') {
    return 'uk_hmrc';
  }
  if (EU_REGION_CODES.has(region)) {
    return 'eu_dac7';
  }

  // Check language fallback: if Italian, French, Spanish, German -> default to EU DAC7
  try {
    const locales = getLocales();
    const lang = locales[0]?.languageCode?.toLowerCase();
    if (lang === 'it' || lang === 'fr' || lang === 'es' || lang === 'de') {
      return 'eu_dac7';
    }
  } catch (e) {
    // fallback
  }

  // Outside EU, US, UK with general english/other locale -> disable fiscal monitor by default
  return 'none';
}

/**
 * Get user saved currency preference ('auto', 'EUR', 'USD', 'GBP').
 */
export function getSavedCurrencyPreference(): CurrencyPreference {
  initSettingsTable();
  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['currency_preference']
    );
    if (
      row &&
      (row.value === 'auto' ||
        row.value === 'EUR' ||
        row.value === 'USD' ||
        row.value === 'GBP')
    ) {
      return row.value as CurrencyPreference;
    }
  } catch (err) {
    // fallback
  }
  return 'auto';
}

/**
 * Save user currency preference.
 */
export function setCurrencyPreference(pref: CurrencyPreference): void {
  initSettingsTable();
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('currency_preference', ?)`,
      [pref]
    );
  } catch (err) {
    console.error('Error saving currency preference:', err);
  }
}

/**
 * Resolves active currency code ('EUR', 'USD', 'GBP').
 */
export function getActiveCurrencyCode(): string {
  const pref = getSavedCurrencyPreference();
  if (pref !== 'auto') {
    return pref;
  }
  const region = getDeviceRegion();
  if (region === 'US') return 'USD';
  if (region === 'GB' || region === 'UK') return 'GBP';
  return 'EUR';
}

/**
 * Resolves active currency symbol ('€', '$', '£').
 */
export function getActiveCurrencySymbol(): string {
  const code = getActiveCurrencyCode();
  if (code === 'USD') return '$';
  if (code === 'GBP') return '£';
  return '€';
}

/**
 * Returns platform order prioritised by region for a native local feel.
 */
export function getRegionalPlatformOrder(customRegion?: string): PlatformId[] {
  const region = (customRegion || getDeviceRegion()).toUpperCase();

  switch (region) {
    case 'US':
      return ['poshmark', 'ebay', 'mercari', 'depop', 'vinted', 'custom'];
    case 'ES':
      return ['wallapop', 'vinted', 'ebay', 'depop', 'poshmark', 'mercari', 'custom'];
    case 'FR':
      return ['vinted', 'ebay', 'depop', 'wallapop', 'poshmark', 'mercari', 'custom'];
    case 'GB':
    case 'UK':
      return ['vinted', 'ebay', 'depop', 'poshmark', 'mercari', 'custom'];
    case 'IT':
      return ['vinted', 'subito', 'ebay', 'wallapop', 'depop', 'poshmark', 'mercari', 'custom'];
    default:
      // Global default: leading global platforms
      return ['ebay', 'poshmark', 'vinted', 'mercari', 'depop', 'wallapop', 'subito', 'custom'];
  }
}
