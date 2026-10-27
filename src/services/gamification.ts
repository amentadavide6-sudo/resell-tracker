import { getDatabase } from './db';
import { isProUser } from './proManager';

export interface LevelInfo {
  levelNumber: number;
  title: string;
  badge: string;
  badgeColor: string;
  minXP: number;
  maxXP: number;
  currentXP: number;
  progress: number; // 0.0 - 1.0
  nextLevelTitle: string | null;
  xpToNextLevel: number;
}

const LEVELS = [
  { levelNumber: 1, title: 'Reseller Principiante', badge: '🥉', badgeColor: '#94A3B8', minXP: 0, maxXP: 100 },
  { levelNumber: 2, title: 'Venditore Attivo', badge: '🥈', badgeColor: '#38BDF8', minXP: 100, maxXP: 300 },
  { levelNumber: 3, title: 'Reseller Esperto', badge: '🥇', badgeColor: '#F59E0B', minXP: 300, maxXP: 800 },
  { levelNumber: 4, title: 'Top Seller', badge: '💎', badgeColor: '#10B981', minXP: 800, maxXP: 2000 },
  { levelNumber: 5, title: 'Mogul del Reselling', badge: '👑', badgeColor: '#8B5CF6', minXP: 2000, maxXP: 999999 },
];

export const XP_REWARDS = {
  ITEM_ADDED: 25,
  ITEM_SOLD: 100,
  EXPORT_CSV: 50,
  BACKUP_SAVED: 50,
};

export function getUserXP(): number {
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
      ['user_xp']
    );
    return row ? parseInt(row.value, 10) || 0 : 0;
  } catch (err) {
    console.error('Error getting user XP:', err);
    return 0;
  }
}

export function getLevelInfo(xp: number): LevelInfo {
  const currentLvl =
    LEVELS.slice().reverse().find((lvl) => xp >= lvl.minXP) || LEVELS[0];

  const nextLvl = LEVELS.find((lvl) => lvl.levelNumber === currentLvl.levelNumber + 1);

  const range = currentLvl.maxXP - currentLvl.minXP;
  const progressInLevel = xp - currentLvl.minXP;
  const progress = nextLvl ? Math.min(1, Math.max(0, progressInLevel / range)) : 1.0;
  const xpToNextLevel = nextLvl ? Math.max(0, nextLvl.minXP - xp) : 0;

  return {
    levelNumber: currentLvl.levelNumber,
    title: currentLvl.title,
    badge: currentLvl.badge,
    badgeColor: currentLvl.badgeColor,
    minXP: currentLvl.minXP,
    maxXP: currentLvl.maxXP,
    currentXP: xp,
    progress,
    nextLevelTitle: nextLvl ? nextLvl.title : null,
    xpToNextLevel,
  };
}

export function addXP(
  baseAmount: number,
  reason?: string
): { newXP: number; earnedXP: number; leveledUp: boolean; newLevel: LevelInfo } {
  try {
    const isPro = isProUser();
    // Pro members get 2x XP Booster perenne!
    const earnedXP = isPro ? baseAmount * 2 : baseAmount;

    const currentXP = getUserXP();
    const oldLevel = getLevelInfo(currentXP);

    const newXP = currentXP + earnedXP;

    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('user_xp', ?)`,
      [newXP.toString()]
    );

    const newLevel = getLevelInfo(newXP);
    const leveledUp = newLevel.levelNumber > oldLevel.levelNumber;

    return {
      newXP,
      earnedXP,
      leveledUp,
      newLevel,
    };
  } catch (err) {
    console.error('Error adding XP:', err);
    return {
      newXP: 0,
      earnedXP: baseAmount,
      leveledUp: false,
      newLevel: getLevelInfo(0),
    };
  }
}

export function deductXP(amount: number): number {
  try {
    const currentXP = getUserXP();
    const newXP = Math.max(0, currentXP - amount);

    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('user_xp', ?)`,
      [newXP.toString()]
    );
    return newXP;
  } catch (err) {
    console.error('Error deducting XP:', err);
    return 0;
  }
}
