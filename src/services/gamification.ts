import { getDatabase } from './db';
import { isProUser, activateProPass } from './proManager';

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

export const LEVELS: LevelDefinition[] = [
  {
    levelNumber: 1,
    title: 'Principiante (Legno)',
    badge: '🪵',
    badgeColor: '#A16207',
    minXP: 0,
    maxXP: 75,
    description: 'Primi passi per fare ordine nell\'armadio e catalogare i primi capi.',
  },
  {
    levelNumber: 2,
    title: 'Venditore Novizio (Bronzo)',
    badge: '🥉',
    badgeColor: '#CD7F32',
    minXP: 75,
    maxXP: 200,
    description: 'Prime vendite concluse con successo e prime spedizioni andate a buon fine.',
  },
  {
    levelNumber: 3,
    title: 'Cacciatore d\'Affari (Argento)',
    badge: '🥈',
    badgeColor: '#94A3B8',
    minXP: 200,
    maxXP: 450,
    description: 'Inizi a dominare le negoziazioni e a riconoscere al volo i veri margini.',
  },
  {
    levelNumber: 4,
    title: 'Reseller Attivo (Oro I)',
    badge: '🥇',
    badgeColor: '#F59E0B',
    minXP: 450,
    maxXP: 800,
    description: 'Inventario costante e vendite settimanali regolari su Vinted ed eBay.',
  },
  {
    levelNumber: 5,
    title: 'Commerciante Esperto (Oro II)',
    badge: '🏆',
    badgeColor: '#D97706',
    minXP: 800,
    maxXP: 1300,
    description: 'Rotazione rapida dei capi e profitti netti costantemente in crescita.',
  },
  {
    levelNumber: 6,
    title: 'Top Seller (Platino)',
    badge: '⚔️',
    badgeColor: '#38BDF8',
    minXP: 1300,
    maxXP: 2000,
    description: 'Punto di riferimento per gli acquirenti, con feedback eccellenti.',
  },
  {
    levelNumber: 7,
    title: 'Maestro del Vintage (Cristallo I)',
    badge: '💎',
    badgeColor: '#06B6D4',
    minXP: 2000,
    maxXP: 3200,
    description: 'Fiuto infallibile per i pezzi rari, streetwear introvabile e brand ricercati.',
  },
  {
    levelNumber: 8,
    title: 'Elite Reseller (Cristallo II)',
    badge: '🔮',
    badgeColor: '#8B5CF6',
    minXP: 3200,
    maxXP: 5000,
    description: 'Volumi da vero professionista dell\'usato, con vendite quotidiane.',
  },
  {
    levelNumber: 9,
    title: 'Mogul del Mercato (Diamante)',
    badge: '💠',
    badgeColor: '#EC4899',
    minXP: 5000,
    maxXP: 8000,
    description: 'Gestione impeccabile di inventory massicci con ROI medio straordinario.',
  },
  {
    levelNumber: 10,
    title: 'Imperatore del Reselling (Leggenda)',
    badge: '👑',
    badgeColor: '#EAB308',
    minXP: 8000,
    maxXP: 999999,
    description: 'Il vertice supremo della community. Un vero impero del second-hand!',
  },
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
