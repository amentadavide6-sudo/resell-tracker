import { getDatabase } from './db';
import { isProUser, activateProPass } from './proManager';
import { SupportedLanguage } from '../i18n/types';
import { getSavedLanguage } from '../i18n/LanguageContext';
import { it } from '../i18n/it';
import { en } from '../i18n/en';
import { fr } from '../i18n/fr';
import { es } from '../i18n/es';
import { de } from '../i18n/de';

const DICTIONARIES = { it, en, fr, es, de };

export interface LevelDefinition {
  levelNumber: number;
  title: string;
  badge: string;
  badgeColor: string;
  minXP: number;
  maxXP: number;
  description: string;
}

export interface LevelInfo extends LevelDefinition {
  currentXP: number;
  progress: number; // 0.0 - 1.0
  nextLevelTitle: string | null;
  xpToNextLevel: number;
}

const BASE_LEVEL_METADATA = [
  { levelNumber: 1, badge: '🪵', badgeColor: '#A16207', minXP: 0, maxXP: 75 },
  { levelNumber: 2, badge: '🥉', badgeColor: '#CD7F32', minXP: 75, maxXP: 200 },
  { levelNumber: 3, badge: '🥈', badgeColor: '#94A3B8', minXP: 200, maxXP: 450 },
  { levelNumber: 4, badge: '🥇', badgeColor: '#F59E0B', minXP: 450, maxXP: 800 },
  { levelNumber: 5, badge: '🏆', badgeColor: '#D97706', minXP: 800, maxXP: 1300 },
  { levelNumber: 6, badge: '⚔️', badgeColor: '#38BDF8', minXP: 1300, maxXP: 2000 },
  { levelNumber: 7, badge: '💎', badgeColor: '#06B6D4', minXP: 2000, maxXP: 3200 },
  { levelNumber: 8, badge: '🔮', badgeColor: '#8B5CF6', minXP: 3200, maxXP: 5000 },
  { levelNumber: 9, badge: '💠', badgeColor: '#EC4899', minXP: 5000, maxXP: 8000 },
  { levelNumber: 10, badge: '👑', badgeColor: '#EAB308', minXP: 8000, maxXP: 999999 },
];

export function getLevels(lang: SupportedLanguage = getSavedLanguage()): LevelDefinition[] {
  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  const transLevels = dict.gamification?.levels || DICTIONARIES.en.gamification.levels;
  return BASE_LEVEL_METADATA.map((base, idx) => ({
    ...base,
    title: transLevels[idx]?.title || `Level ${base.levelNumber}`,
    description: transLevels[idx]?.desc || '',
  }));
}

export const LEVELS: LevelDefinition[] = getLevels('it');

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

export function getLevelInfo(xp: number, lang: SupportedLanguage = getSavedLanguage()): LevelInfo {
  const levels = getLevels(lang);
  const currentLvl =
    levels.slice().reverse().find((lvl) => xp >= lvl.minXP) || levels[0];

  const nextLvl = levels.find((lvl) => lvl.levelNumber === currentLvl.levelNumber + 1);

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
    description: currentLvl.description,
    currentXP: xp,
    progress,
    nextLevelTitle: nextLvl ? nextLvl.title : null,
    xpToNextLevel,
  };
}

export function addXP(
  baseAmount: number,
  reason?: string
): {
  newXP: number;
  earnedXP: number;
  leveledUp: boolean;
  newLevel: LevelInfo;
  proPassAwardedHours: number;
} {
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
    let proPassAwardedHours = 0;

    if (leveledUp) {
      // Award Taste of Pro temporary pass
      proPassAwardedHours = newLevel.levelNumber <= 3 ? 24 : 48;
      activateProPass(proPassAwardedHours);
    }

    return {
      newXP,
      earnedXP,
      leveledUp,
      newLevel,
      proPassAwardedHours,
    };
  } catch (err) {
    console.error('Error adding XP:', err);
    return {
      newXP: 0,
      earnedXP: baseAmount,
      leveledUp: false,
      newLevel: getLevelInfo(0),
      proPassAwardedHours: 0,
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
