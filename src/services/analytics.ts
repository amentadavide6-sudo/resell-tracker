import { getAllInventoryItems } from './db';
import { calculateResellProfit } from './feeCalculator';
import { PLATFORMS } from '../constants/platforms';
import { getAllAvailablePlatforms } from './customPlatformManager';
import { InventoryItem, PlatformId } from '../types';

export interface PlatformStat {
  platformId: PlatformId;
  name: string;
  color: string;
  soldCount: number;
  totalProfit: number;
  totalRevenue: number;
  percentageOfProfit: number;
}

export interface MonthlyPlatformBreakdown {
  soldCount: number;
  totalProfit: number;
  totalRevenue: number;
}

export interface MonthlyStat {
  monthKey: string; // e.g. "2026-10"
  monthLabel: string; // e.g. "Ottobre 2026"
  soldCount: number;
  totalRevenue: number;
  totalProfit: number;
  platformBreakdown: Record<string, MonthlyPlatformBreakdown>;
}

export interface Dac7Stat {
  year: number;
  soldCount: number;
  maxSales: number; // 30
  grossRevenue: number;
  maxRevenue: number; // 2000 €
  salesProgress: number; // 0 to 1
  revenueProgress: number; // 0 to 1
  remainingSales: number;
  remainingRevenue: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface AnalyticsSummary {
  totalSoldItems: number;
  totalActiveItems: number;
  totalGrossRevenue: number;
  totalNetProfit: number;
  totalCostOfGoodsSold: number;
  averageMarginPercent: number;
  averageRoiPercent: number;
  unsoldCapital: number;
  potentialProfitUnsold: number;
  bestPlatform: PlatformStat | null;
  platformStats: PlatformStat[];
  monthlyStats: MonthlyStat[];
  dac7: Dac7Stat;
}

export function computeAnalytics(): AnalyticsSummary {
  const allItems = getAllInventoryItems('all');
  const soldItems = allItems.filter((i) => i.status === 'sold');
  const activeItems = allItems.filter((i) => i.status === 'listed');

  let totalGrossRevenue = 0;
  let totalNetProfit = 0;
  let totalCostOfGoodsSold = 0;

  // Platform grouping
  const allAvailable = getAllAvailablePlatforms();
  const platformProfitMap: Record<string, { count: number; profit: number; revenue: number }> = {};
  allAvailable.forEach((p) => {
    platformProfitMap[p.id] = { count: 0, profit: 0, revenue: 0 };
  });

  // Monthly grouping with per-platform breakdowns
  const monthlyMap: Record<
    string,
    {
      count: number;
      profit: number;
      revenue: number;
      platforms: Record<string, { soldCount: number; totalProfit: number; totalRevenue: number }>;
    }
  > = {};

  const currentYear = new Date().getFullYear();
  let dac7SoldCount = 0;
  let dac7GrossRevenue = 0;

  let totalSoldPieces = 0;
  soldItems.forEach((item) => {
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
    totalSoldPieces += qty;

    const salePrice = item.actualSellingPrice ?? item.targetSellingPrice;
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

    totalGrossRevenue += salePrice * qty;
    totalNetProfit += calc.netProfit * qty;
    totalCostOfGoodsSold += item.purchaseCost * qty;

    // Aggregate by platform
    const pId = item.platformId || 'vinted';
    if (!platformProfitMap[pId]) {
      platformProfitMap[pId] = { count: 0, profit: 0, revenue: 0 };
    }
    platformProfitMap[pId].count += qty;
    platformProfitMap[pId].profit += calc.netProfit * qty;
    platformProfitMap[pId].revenue += salePrice * qty;

    // Aggregate by month (using soldAt or createdAt)
    const dateStr = item.soldAt || item.createdAt;
    const dateObj = new Date(dateStr);
    const itemYear = dateObj.getFullYear();
    const monthKey = `${itemYear}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { count: 0, profit: 0, revenue: 0, platforms: {} };
    }
    monthlyMap[monthKey].count += qty;
    monthlyMap[monthKey].profit += calc.netProfit * qty;
    monthlyMap[monthKey].revenue += salePrice * qty;

    if (!monthlyMap[monthKey].platforms[pId]) {
      monthlyMap[monthKey].platforms[pId] = { soldCount: 0, totalProfit: 0, totalRevenue: 0 };
    }
    monthlyMap[monthKey].platforms[pId].soldCount += qty;
    monthlyMap[monthKey].platforms[pId].totalProfit += calc.netProfit * qty;
    monthlyMap[monthKey].platforms[pId].totalRevenue += salePrice * qty;

    // DAC7 annual accumulation
    if (itemYear === currentYear) {
      dac7SoldCount += qty;
      dac7GrossRevenue += salePrice * qty;
    }
  });

  // DAC7 calculation
  const dac7SalesProgress = Math.min(1, dac7SoldCount / 30);
  const dac7RevenueProgress = Math.min(1, dac7GrossRevenue / 2000);
  const isDac7Exceeded = dac7SoldCount >= 30 || dac7GrossRevenue >= 2000;
  const isDac7Warning = !isDac7Exceeded && (dac7SoldCount >= 24 || dac7GrossRevenue >= 1600);

  const dac7: Dac7Stat = {
    year: currentYear,
    soldCount: dac7SoldCount,
    maxSales: 30,
    grossRevenue: Math.round(dac7GrossRevenue * 100) / 100,
    maxRevenue: 2000,
    salesProgress: dac7SalesProgress,
    revenueProgress: dac7RevenueProgress,
    remainingSales: Math.max(0, 30 - dac7SoldCount),
    remainingRevenue: Math.max(0, Math.round((2000 - dac7GrossRevenue) * 100) / 100),
    status: isDac7Exceeded ? 'exceeded' : isDac7Warning ? 'warning' : 'safe',
  };

  // Calculate platform statistics
  const platformStats: PlatformStat[] = allAvailable.map((p) => {
    const stat = platformProfitMap[p.id] || { count: 0, profit: 0, revenue: 0 };
    const pct = totalNetProfit > 0 ? (stat.profit / totalNetProfit) * 100 : 0;
    return {
      platformId: p.id as PlatformId,
      name: p.name,
      color: p.color,
      soldCount: stat.count,
      totalProfit: Math.round(stat.profit * 100) / 100,
      totalRevenue: Math.round(stat.revenue * 100) / 100,
      percentageOfProfit: Math.round(pct * 10) / 10,
    };
  });

  // Best platform (by net profit)
  const bestPlatform = platformStats.reduce<PlatformStat | null>((best, curr) => {
    if (!best || curr.totalProfit > best.totalProfit) {
      return curr.totalProfit > 0 ? curr : null;
    }
    return best;
  }, null);

  // Month labels
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];

  // Build month sequence starting from the FIRST recorded sale up to the current month
  const sortedSoldKeys = Object.keys(monthlyMap).sort();
  let monthlyStats: MonthlyStat[] = [];

  if (sortedSoldKeys.length > 0) {
    const earliestKey = sortedSoldKeys[0]; // e.g. "2026-10"
    const [startYear, startMonth] = earliestKey.split('-').map(Number);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const continuousKeys: string[] = [];
    let y = startYear;
    let m = startMonth;

    while (y < currentYear || (y === currentYear && m <= currentMonth)) {
      continuousKeys.push(`${y}-${String(m).padStart(2, '0')}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }

    monthlyStats = continuousKeys.map((key) => {
      const [year, month] = key.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      const mData = monthlyMap[key] || { count: 0, revenue: 0, profit: 0, platforms: {} };
      return {
        monthKey: key,
        monthLabel: `${monthNames[monthIdx]} ${year}`,
        soldCount: mData.count,
        totalRevenue: Math.round(mData.revenue * 100) / 100,
        totalProfit: Math.round(mData.profit * 100) / 100,
        platformBreakdown: mData.platforms,
      };
    });
  }

  // Active / unsold stats
  const totalActivePieces = activeItems.reduce(
    (acc, i) => acc + (i.quantity && i.quantity > 0 ? i.quantity : 1),
    0
  );
  const unsoldCapital = activeItems.reduce(
    (acc, i) => acc + i.purchaseCost * (i.quantity && i.quantity > 0 ? i.quantity : 1),
    0
  );

  let potentialProfitUnsold = 0;
  activeItems.forEach((i) => {
    const qty = i.quantity && i.quantity > 0 ? i.quantity : 1;
    const customFee = i.customFees?.[i.platformId];
    const calc = calculateResellProfit({
      sellingPrice: i.targetSellingPrice,
      purchaseCost: i.purchaseCost,
      sellerShippingCost: i.sellerShippingCost,
      packagingCost: i.packagingCost,
      platformId: i.platformId,
      customSellerFeePercent: customFee?.percent,
      customSellerFixedFee: customFee?.fixed,
    });
    potentialProfitUnsold += calc.netProfit * qty;
  });

  const averageMarginPercent =
    totalGrossRevenue > 0
      ? Math.round((totalNetProfit / totalGrossRevenue) * 1000) / 10
      : 0;

  const averageRoiPercent =
    totalCostOfGoodsSold > 0
      ? Math.round((totalNetProfit / totalCostOfGoodsSold) * 1000) / 10
      : 0;

  return {
    totalSoldItems: totalSoldPieces,
    totalActiveItems: totalActivePieces,
    totalGrossRevenue: Math.round(totalGrossRevenue * 100) / 100,
    totalNetProfit: Math.round(totalNetProfit * 100) / 100,
    totalCostOfGoodsSold: Math.round(totalCostOfGoodsSold * 100) / 100,
    averageMarginPercent,
    averageRoiPercent,
    unsoldCapital: Math.round(unsoldCapital * 100) / 100,
    potentialProfitUnsold: Math.round(potentialProfitUnsold * 100) / 100,
    bestPlatform,
    platformStats,
    monthlyStats,
    dac7,
  };
}

export const getAnalyticsData = computeAnalytics;
