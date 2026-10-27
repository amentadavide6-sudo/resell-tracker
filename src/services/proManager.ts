import * as SQLite from 'expo-sqlite';
import { getDatabase, getTotalInventoryCount } from './db';

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

export function canAddMoreItems(currentCount?: number): boolean {
  if (isProUser()) return true;
  const count = typeof currentCount === 'number' ? Math.max(currentCount, getTotalInventoryCount()) : getTotalInventoryCount();
  return count < FREE_TIER_ITEM_LIMIT;
}

// Track CSV / Excel exports for free demo vs Pro requirement
export function getCSVExportCount(): number {
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
      ['csv_export_count']
    );
    return row ? parseInt(row.value, 10) || 0 : 0;
  } catch (err) {
    console.error('Error getting CSV export count:', err);
    return 0;
  }
}

export function incrementCSVExportCount(): number {
  try {
    const current = getCSVExportCount();
    const next = current + 1;
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('csv_export_count', ?)`,
      [next.toString()]
    );
    return next;
  } catch (err) {
    console.error('Error incrementing CSV export count:', err);
    return 1;
  }
}
