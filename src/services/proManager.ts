import * as SQLite from 'expo-sqlite';
import { getDatabase, getTotalInventoryCount } from './db';

export interface ProPassInfo {
  isActive: boolean;
  expiresAt: number | null;
  remainingHours: number;
  remainingMinutes: number;
  remainingFormatted: string;
  isPermanentPro: boolean;
}

export const FREE_TIER_ITEM_LIMIT = 15;

export function isPermanentProUser(): boolean {
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
    console.error('Error checking Permanent Pro status:', err);
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

export function getProPassExpiry(): number | null {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['pro_pass_expires_at']
    );
    if (!row) return null;
    const ts = parseInt(row.value, 10);
    return isNaN(ts) ? null : ts;
  } catch (err) {
    console.error('Error getting Pro Pass expiry:', err);
    return null;
  }
}

export function activateProPass(durationHours: number): number {
  try {
    const db = getDatabase();
    const currentExpiry = getProPassExpiry();
    const now = Date.now();
    const baseTime = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const newExpiry = baseTime + durationHours * 60 * 60 * 1000;

    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('pro_pass_expires_at', ?)`,
      [newExpiry.toString()]
    );
    return newExpiry;
  } catch (err) {
    console.error('Error activating Pro Pass:', err);
    return Date.now() + durationHours * 3600 * 1000;
  }
}

export function isProUser(): boolean {
  if (isPermanentProUser()) return true;
  const expiry = getProPassExpiry();
  if (expiry && expiry > Date.now()) return true;
  return false;
}

export function getProPassInfo(): ProPassInfo {
  const isPermanent = isPermanentProUser();
  if (isPermanent) {
    return {
      isActive: true,
      expiresAt: null,
      remainingHours: 99999,
      remainingMinutes: 0,
      remainingFormatted: 'A Vita ✨',
      isPermanentPro: true,
    };
  }

  const expiry = getProPassExpiry();
  const now = Date.now();

  if (!expiry || expiry <= now) {
    return {
      isActive: false,
      expiresAt: null,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingFormatted: 'Scaduto',
      isPermanentPro: false,
    };
  }

  const diffMs = expiry - now;
  const totalSeconds = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const formatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return {
    isActive: true,
    expiresAt: expiry,
    remainingHours: hours,
    remainingMinutes: minutes,
    remainingFormatted: formatted,
    isPermanentPro: false,
  };
}

export function canAddMoreItems(currentCount?: number): boolean {
  if (isProUser()) return true;
  const count = typeof currentCount === 'number' ? Math.max(currentCount, getTotalInventoryCount()) : getTotalInventoryCount();
  return count < FREE_TIER_ITEM_LIMIT;
}

// Proposta B: "Stock Congelato"
// When user is not Pro and item is past the 15-item free threshold
export function isItemFrozen(indexFromOldest: number): boolean {
  if (isProUser()) return false;
  return indexFromOldest >= FREE_TIER_ITEM_LIMIT;
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
