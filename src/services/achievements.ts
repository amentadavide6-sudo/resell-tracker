import { getDatabase, getAllInventoryItems } from './db';
import { calculateResellProfit } from './feeCalculator';
import { addXP } from './gamification';
import { getCSVExportCount } from './proManager';
import { SupportedLanguage } from '../i18n/types';
import { getSavedLanguage } from '../i18n/LanguageContext';

export interface TrophyDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'starter' | 'profit' | 'speed' | 'management';
  xpReward: number;
  targetCount: number;
  unit?: string;
  badgeColor: string;
}

export interface TrophyStatus extends TrophyDefinition {
  isUnlocked: boolean;
  unlockedAt: string | null;
  currentProgress: number;
  progressPercent: number; // 0.0 to 1.0
}

export const TROPHIES: TrophyDefinition[] = [
  {
    id: 'first_sale',
    title: 'Battesimo del Resell',
    description: 'Registra la tua prima vendita completata nell\'app.',
    icon: 'trophy',
    category: 'starter',
    xpReward: 100,
    targetCount: 1,
    unit: 'vendita',
    badgeColor: '#F59E0B',
  },
  {
    id: 'sales_10',
    title: 'Armadio Dinamico',
    description: 'Raggiungi 10 capi venduti complessivamente.',
    icon: 'shirt',
    category: 'starter',
    xpReward: 250,
    targetCount: 10,
    unit: 'capi',
    badgeColor: '#06B6D4',
  },
  {
    id: 'sales_50',
    title: 'Power Seller',
    description: 'Concludi 50 vendite complessive registrate.',
    icon: 'ribbon',
    category: 'starter',
    xpReward: 750,
    targetCount: 50,
    unit: 'capi',
    badgeColor: '#EAB308',
  },
  {
    id: 'super_roi',
    title: 'Il Colpo Grosso',
    description: 'Vendi un capo con un ritorno (ROI) superiore al 150%.',
    icon: 'sparkles',
    category: 'profit',
    xpReward: 300,
    targetCount: 150,
    unit: '%',
    badgeColor: '#EC4899',
  },
  {
    id: 'high_ticket',
    title: 'Pezzo Pregiato',
    description: 'Vendi un singolo articolo a un prezzo superiore a 100€.',
    icon: 'pricetag',
    category: 'profit',
    xpReward: 200,
    targetCount: 100,
    unit: '€',
    badgeColor: '#8B5CF6',
  },
  {
    id: 'profit_1k',
    title: 'Club dei 1.000€',
    description: 'Raggiungi 1.000€ di profitto netto totale.',
    icon: 'cash',
    category: 'profit',
    xpReward: 500,
    targetCount: 1000,
    unit: '€',
    badgeColor: '#10B981',
  },
  {
    id: 'fast_flip',
    title: 'Vendita Lampo',
    description: 'Vendi un capo entro 48 ore da quando lo hai caricato.',
    icon: 'flash',
    category: 'speed',
    xpReward: 250,
    targetCount: 1,
    unit: 'vendita',
    badgeColor: '#F97316',
  },
  {
    id: 'cross_lister',
    title: 'Cittadino dei Marketplace',
    description: 'Concludi vendite su almeno 3 piattaforme differenti.',
    icon: 'globe',
    category: 'speed',
    xpReward: 300,
    targetCount: 3,
    unit: 'marketplaces',
    badgeColor: '#3B82F6',
  },
  {
    id: 'boutique_20',
    title: 'Boutique Piena',
    description: 'Mantieni almeno 20 capi contemporaneamente in vendita.',
    icon: 'storefront',
    category: 'management',
    xpReward: 200,
    targetCount: 20,
    unit: 'capi attivi',
    badgeColor: '#14B8A6',
  },
  {
    id: 'pro_manager',
    title: 'Reseller Professionista',
    description: 'Effettua la tua prima esportazione CSV o un backup.',
    icon: 'shield-checkmark',
    category: 'management',
    xpReward: 150,
    targetCount: 1,
    unit: 'azione',
    badgeColor: '#6366F1',
  },
];

export function getUnlockedTrophiesMap(): Record<string, string> {
  try {
    const db = getDatabase();
    const rows = db.getAllSync<{ id: string; unlockedAt: string }>('SELECT id, unlockedAt FROM user_trophies');
    const map: Record<string, string> = {};
    rows.forEach((r) => {
      map[r.id] = r.unlockedAt;
    });
    return map;
  } catch (err) {
    console.error('Error getting unlocked trophies:', err);
    return {};
  }
}

export function getAllTrophiesStatus(): {
  trophies: TrophyStatus[];
  unlockedCount: number;
  totalCount: number;
  totalXpAvailable: number;
  earnedXp: number;
} {
  const allItems = getAllInventoryItems('all');
  const soldItems = allItems.filter((i) => i.status === 'sold');
  const activeItems = allItems.filter((i) => i.status === 'listed');
  const unlockedMap = getUnlockedTrophiesMap();

  let totalSoldPieces = 0;
  let totalNetProfit = 0;
  let maxRoi = 0;
  let maxSingleSalePrice = 0;
  let fastFlipFound = false;
  const soldPlatformsSet = new Set<string>();

  soldItems.forEach((item) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    totalSoldPieces += qty;

    const salePrice = item.actualSellingPrice || item.targetSellingPrice;
    if (salePrice > maxSingleSalePrice) maxSingleSalePrice = salePrice;

    const customFee = item.customFees?.[item.platformId];
    const calc = calculateResellProfit({
      sellingPrice: salePrice,
      purchaseCost: item.purchaseCost,
      sellerShippingCost: item.sellerShippingCost,
      packagingCost: item.packagingCost,
      platformId: item.platformId,
      customSellerFeePercent: customFee?.percent,
      customSellerFixedFee: customFee?.fixed,
    });

    totalNetProfit += calc.netProfit * qty;
    if (calc.roiPercent > maxRoi) maxRoi = calc.roiPercent;

    if (item.soldAt && item.createdAt) {
      const diffMs = new Date(item.soldAt).getTime() - new Date(item.createdAt).getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      if (diffHours >= 0 && diffHours <= 48) {
        fastFlipFound = true;
      }
    }

    if (item.platformId) soldPlatformsSet.add(item.platformId);
  });

  const activePieces = activeItems.reduce(
    (sum, i) => sum + (i.quantity && i.quantity > 0 ? i.quantity : 1),
    0
  );

  const exportCount = getCSVExportCount();

  let unlockedCount = 0;
  let totalXpAvailable = 0;
  let earnedXp = 0;

  const trophies: TrophyStatus[] = TROPHIES.map((def) => {
    totalXpAvailable += def.xpReward;
    const isAlreadyUnlocked = !!unlockedMap[def.id];
    let currentProgress = 0;

    switch (def.id) {
      case 'first_sale':
        currentProgress = totalSoldPieces;
        break;
      case 'sales_10':
      case 'sales_50':
        currentProgress = totalSoldPieces;
        break;
      case 'super_roi':
        currentProgress = Math.round(maxRoi);
        break;
      case 'high_ticket':
        currentProgress = Math.round(maxSingleSalePrice);
        break;
      case 'profit_1k':
        currentProgress = Math.round(totalNetProfit);
        break;
      case 'fast_flip':
        currentProgress = fastFlipFound ? 1 : 0;
        break;
      case 'cross_lister':
        currentProgress = soldPlatformsSet.size;
        break;
      case 'boutique_20':
        currentProgress = activePieces;
        break;
      case 'pro_manager':
        currentProgress = exportCount >= 1 ? 1 : 0;
        break;
      default:
        currentProgress = 0;
    }

    const progressPercent = Math.min(1, Math.max(0, currentProgress / def.targetCount));
    const isUnlocked = isAlreadyUnlocked || progressPercent >= 1;

    if (isUnlocked) {
      unlockedCount++;
      earnedXp += def.xpReward;
    }

    return {
      ...def,
      isUnlocked,
      unlockedAt: unlockedMap[def.id] || null,
      currentProgress,
      progressPercent,
    };
  });

  return {
    trophies,
    unlockedCount,
    totalCount: TROPHIES.length,
    totalXpAvailable,
    earnedXp,
  };
}

export function checkAndUnlockAchievements(): TrophyStatus[] {
  try {
    const db = getDatabase();
    const statusData = getAllTrophiesStatus();
    const unlockedMap = getUnlockedTrophiesMap();
    const newlyUnlocked: TrophyStatus[] = [];

    statusData.trophies.forEach((t) => {
      if (t.progressPercent >= 1 && !unlockedMap[t.id]) {
        const nowIso = new Date().toISOString();
        db.runSync(
          'INSERT OR IGNORE INTO user_trophies (id, unlockedAt) VALUES (?, ?)',
          [t.id, nowIso]
        );
        addXP(t.xpReward, `Trofeo Sbloccato: ${t.title}`);
        newlyUnlocked.push({
          ...t,
          isUnlocked: true,
          unlockedAt: nowIso,
        });
      }
    });

    return newlyUnlocked;
  } catch (err) {
    console.error('Error checking achievements:', err);
    return [];
  }
}

export interface ProBusinessInsights {
  bestDayOfWeek: {
    dayName: string;
    dayIndex: number;
    salesCount: number;
    totalProfit: number;
  } | null;
  averageDaysToSell: number | null;
  stockTurnoverRate: number; // percentage
  fastFlipsCount: number;
}

const DAYS_BY_LANG: Record<SupportedLanguage, string[]> = {
  it: ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  fr: ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'],
  es: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  de: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
};

export function computeProInsights(lang: SupportedLanguage = getSavedLanguage()): ProBusinessInsights {
  const allItems = getAllInventoryItems('all');
  const soldItems = allItems.filter((i) => i.status === 'sold');
  const activeItems = allItems.filter((i) => i.status === 'listed');

  const daysNames = DAYS_BY_LANG[lang] || DAYS_BY_LANG.en;
  const dayStats: Record<number, { count: number; profit: number }> = {
    0: { count: 0, profit: 0 },
    1: { count: 0, profit: 0 },
    2: { count: 0, profit: 0 },
    3: { count: 0, profit: 0 },
    4: { count: 0, profit: 0 },
    5: { count: 0, profit: 0 },
    6: { count: 0, profit: 0 },
  };

  let totalDaysElapsed = 0;
  let itemsWithDateCount = 0;
  let fastFlipsCount = 0;
  let totalSoldPieces = 0;

  soldItems.forEach((item) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    totalSoldPieces += qty;

    const salePrice = item.actualSellingPrice || item.targetSellingPrice;
    const customFee = item.customFees?.[item.platformId];
    const calc = calculateResellProfit({
      sellingPrice: salePrice,
      purchaseCost: item.purchaseCost,
      sellerShippingCost: item.sellerShippingCost,
      packagingCost: item.packagingCost,
      platformId: item.platformId,
      customSellerFeePercent: customFee?.percent,
      customSellerFixedFee: customFee?.fixed,
    });

    if (item.soldAt) {
      const soldDate = new Date(item.soldAt);
      const dayIdx = soldDate.getDay();
      dayStats[dayIdx].count += qty;
      dayStats[dayIdx].profit += calc.netProfit * qty;

      if (item.createdAt) {
        const createDate = new Date(item.createdAt);
        const diffMs = soldDate.getTime() - createDate.getTime();
        const diffDays = Math.max(0, diffMs / (1000 * 60 * 60 * 24));
        totalDaysElapsed += diffDays * qty;
        itemsWithDateCount += qty;

        if (diffDays <= 2) {
          fastFlipsCount += qty;
        }
      }
    }
  });

  // Determine best day
  let bestDayIdx = 1; // Default to Monday
  let maxCount = -1;
  Object.entries(dayStats).forEach(([dayStr, data]) => {
    const idx = parseInt(dayStr, 10);
    if (data.count > maxCount) {
      maxCount = data.count;
      bestDayIdx = idx;
    }
  });

  const bestDayOfWeek =
    maxCount > 0
      ? {
          dayName: daysNames[bestDayIdx],
          dayIndex: bestDayIdx,
          salesCount: dayStats[bestDayIdx].count,
          totalProfit: Math.round(dayStats[bestDayIdx].profit * 100) / 100,
        }
      : null;

  const averageDaysToSell =
    itemsWithDateCount > 0 ? Math.round((totalDaysElapsed / itemsWithDateCount) * 10) / 10 : null;

  const totalActivePieces = activeItems.reduce(
    (sum, i) => sum + (i.quantity && i.quantity > 0 ? i.quantity : 1),
    0
  );

  const totalCatalog = totalSoldPieces + totalActivePieces;
  const stockTurnoverRate =
    totalCatalog > 0 ? Math.round((totalSoldPieces / totalCatalog) * 100) : 0;

  return {
    bestDayOfWeek,
    averageDaysToSell,
    stockTurnoverRate,
    fastFlipsCount,
  };
}
