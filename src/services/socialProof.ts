import { Share } from 'react-native';
import { InventoryItem } from '../types';
import { formatEuro } from './feeCalculator';
import { getPlatformById } from './customPlatformManager';

export async function shareSoldProfit(
  item: InventoryItem,
  netProfit: number,
  roiPercent: number
): Promise<boolean> {
  try {
    const salePrice = item.actualSellingPrice || item.targetSellingPrice;
    const platform = getPlatformById(item.platformId)?.name || 'Vinted/eBay';
    const profitSign = netProfit >= 0 ? '+' : '';

    const message = `🔥 VENDITA CONCLUSA SU ${platform.toUpperCase()}! 📈

👕 ${item.title}
🛒 Costo acquisto: ${formatEuro(item.purchaseCost)}
💰 Prezzo vendita: ${formatEuro(salePrice)}
🚀 Guadagno Netto: ${profitSign}${formatEuro(netProfit)} (ROI +${Math.round(roiPercent)}%)

Calcolato con precisione su ResellTracker 📱`;

    const result = await Share.share({
      title: `Affare Resell: ${profitSign}${formatEuro(netProfit)}`,
      message,
    });

    return result.action === Share.sharedAction;
  } catch (err) {
    console.error('Error sharing profit deal:', err);
    return false;
  }
}
