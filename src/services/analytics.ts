import { getAllInventoryItems } from './db';
import { calculateResellProfit } from './feeCalculator';
import { PLATFORMS } from '../constants/platforms';
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

export interface MonthlyStat {
  monthKey: string; // e.g. "2026-10"
  monthLabel: string; // e.g. "Ottobre 2026"
  soldCount: number;
  totalRevenue: number;
  totalProfit: number;
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
}

export function computeAnalytics(): AnalyticsSummary {
  const allItems = getAllInventoryItems('all');
  const soldItems = allItems.filter((i) => i.status === 'sold');
  const activeItems = allItems.filter((i) => i.status === 'listed');

  let totalGrossRevenue = 0;
  let totalNetProfit = 0;
  let totalCostOfGoodsSold = 0;

  // Platform grouping
  const platformProfitMap: Record<PlatformId, { count: number; profit: number; revenue: number }> = {
    vinted: { count: 0, profit: 0, revenue: 0 },
    ebay: { count: 0, profit: 0, revenue: 0 },
    wallapop: { count: 0, profit: 0, revenue: 0 },
    subito: { count: 0, profit: 0, revenue: 0 },
    depop: { count: 0, profit: 0, revenue: 0 },
    custom: { count: 0, profit: 0, revenue: 0 },
  };

  // Monthly grouping
  const monthlyMap: Record<string, { count: number; profit: number; revenue: number }> = {};

  soldItems.forEach((item) => {
    const salePrice = item.actualSellingPrice ?? item.targetSellingPrice;
    const calc = calculateResellProfit({
      sellingPrice: salePrice,
      purchaseCost: item.purchaseCost,
      sellerShippingCost: item.sellerShippingCost,
      packagingCost: item.packagingCost,
      platformId: item.platformId,
    });

    totalGrossRevenue += salePrice;
    totalNetProfit += calc.netProfit;
    totalCostOfGoodsSold += item.purchaseCost;

    // Aggregate by platform
    if (platformProfitMap[item.platformId]) {
      platformProfitMap[item.platformId].count += 1;
      platformProfitMap[item.platformId].profit += calc.netProfit;
      platformProfitMap[item.platformId].revenue += salePrice;
    }

    // Aggregate by month (using soldAt or createdAt)
    const dateStr = item.soldAt || item.createdAt;
    const dateObj = new Date(dateStr);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = { count: 0, profit: 0, revenue: 0 };
    }
    monthlyMap[monthKey].count += 1;
    monthlyMap[monthKey].profit += calc.netProfit;
    monthlyMap[monthKey].revenue += salePrice;
  });

  // Calculate platform statistics
  const platformStats: PlatformStat[] = PLATFORMS.map((p) => {
    const stat = platformProfitMap[p.id] || { count: 0, profit: 0, revenue: 0 };
    const pct = totalNetProfit > 0 ? (stat.profit / totalNetProfit) * 100 : 0;
    return {
      platformId: p.id,
      name: p.name,
      color: p.color,
      soldCount: stat.count,
      totalProfit: Math.round(stat.profit * 100) / 100,
      totalRevenue: Math.round(stat.revenue * 100) / 100,
      percentageOfProfit: Math.max(0, Math.round(pct * 10) / 10),
    };
  }).filter((p) => p.soldCount > 0 || p.totalProfit > 0);

  // Sort platforms by profit descending
  platformStats.sort((a, b) => b.totalProfit - a.totalProfit);
  const bestPlatform = platformStats.length > 0 ? platformStats[0] : null;

  // Monthly stats formatted
  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
  ];

  const monthlyStats: MonthlyStat[] = Object.keys(monthlyMap)
    .sort()
    .reverse()
    .map((key) => {
      const [year, month] = key.split('-');
      const monthIdx = parseInt(month, 10) - 1;
      return {
        monthKey: key,
        monthLabel: `${monthNames[monthIdx]} ${year}`,
        soldCount: monthlyMap[key].count,
        totalRevenue: Math.round(monthlyMap[key].revenue * 100) / 100,
        totalProfit: Math.round(monthlyMap[key].profit * 100) / 100,
      };
    });

  // Active / unsold stats
  const unsoldCapital = activeItems.reduce((acc, i) => acc + i.purchaseCost, 0);
  let potentialProfitUnsold = 0;
  activeItems.forEach((i) => {
    const calc = calculateResellProfit({
      sellingPrice: i.targetSellingPrice,
      purchaseCost: i.purchaseCost,
      sellerShippingCost: i.sellerShippingCost,
      packagingCost: i.packagingCost,
      platformId: i.platformId,
    });
    potentialProfitUnsold += calc.netProfit;
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
    totalSoldItems: soldItems.length,
    totalActiveItems: activeItems.length,
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
  };
}
