import { getDatabase } from './db';

export interface CustomPlatformSettings {
  name: string;
  sellerFeePercent: number;
  sellerFixedFee: number;
}

export function getCustomPlatformSettings(): CustomPlatformSettings {
  try {
    const db = getDatabase();
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const nameRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['custom_platform_name']
    );
    const percentRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['custom_platform_percent']
    );
    const fixedRow = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['custom_platform_fixed']
    );

    return {
      name: nameRow ? nameRow.value : 'Personalizzato',
      sellerFeePercent: percentRow ? parseFloat(percentRow.value) || 5 : 5,
      sellerFixedFee: fixedRow ? parseFloat(fixedRow.value) || 0 : 0,
    };
  } catch (err) {
    console.error('Error loading custom platform settings:', err);
    return { name: 'Personalizzato', sellerFeePercent: 5, sellerFixedFee: 0 };
  }
}

export function saveCustomPlatformSettings(settings: CustomPlatformSettings): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('custom_platform_name', ?)`,
      [settings.name]
    );
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('custom_platform_percent', ?)`,
      [settings.sellerFeePercent.toString()]
    );
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('custom_platform_fixed', ?)`,
      [settings.sellerFixedFee.toString()]
    );
  } catch (err) {
    console.error('Error saving custom platform settings:', err);
  }
}
