import * as SQLite from 'expo-sqlite';
import { getDatabase } from './db';

// Simple persistent store for Pro status and limits
export function isProUser(): boolean {
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
      ['is_pro']
    );
    return row ? row.value === 'true' : false;
  } catch (err) {
    console.error('Error checking Pro status:', err);
    return false;
  }
}

export function setProUser(isPro: boolean): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('is_pro', ?)`,
      [isPro ? 'true' : 'false']
    );
  } catch (err) {
    console.error('Error setting Pro status:', err);
  }
}

// Limits for Free Tier
export const FREE_TIER_ITEM_LIMIT = 15;

export function canAddMoreItems(currentCount: number): boolean {
  if (isProUser()) return true;
  return currentCount < FREE_TIER_ITEM_LIMIT;
}
