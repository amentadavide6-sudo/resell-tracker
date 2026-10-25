import { getDatabase } from './db';

export function hasSeenOnboarding(): boolean {
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
      ['has_seen_onboarding']
    );
    return row ? row.value === 'true' : false;
  } catch (err) {
    console.error('Error checking onboarding status:', err);
    return true; // fail safe
  }
}

export function setSeenOnboarding(seen = true): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('has_seen_onboarding', ?)`,
      [seen ? 'true' : 'false']
    );
  } catch (err) {
    console.error('Error setting onboarding status:', err);
  }
}
