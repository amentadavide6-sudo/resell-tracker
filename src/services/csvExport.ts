import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllInventoryItems } from './db';
import { calculateResellProfit } from './feeCalculator';
import { getAllAvailablePlatforms } from './customPlatformManager';

export async function exportInventoryToCSV(): Promise<{ success: boolean; message: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return {
        success: false,
        message: 'La condivisione file non è supportata su questo dispositivo.',
      };
    }

    const items = getAllInventoryItems('all');
    if (items.length === 0) {
      return { success: false, message: 'Non ci sono articoli nell\'inventario da esportare.' };
    }

    // Start with UTF-8 BOM so Microsoft Excel opens characters (€, à, è) flawlessly
    let csvContent = '\uFEFF';

    const now = new Date();
    const formattedExportDate = `${now.toLocaleDateString('it-IT')} ${now.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

    // Official Report Metadata Header
    csvContent += `# =====================================================================\r\n`;
    csvContent += `# RESELLTRACKER - REGISTRO CONTABILE & VENDITE RESELLER\r\n`;
    csvContent += `# Data di Generazione: ${formattedExportDate}\r\n`;
    csvContent += `# Totale Record: ${items.length} articoli | Valuta: EUR (€)\r\n`;
    csvContent += `# Separatore Standard Europeo: Punto e virgola (;)\r\n`;
    csvContent += `# =====================================================================\r\n\r\n`;

    // Detailed Column Headers
    const headers = [
      'ID Articolo',
      'Data Inserimento',
      'Data Vendita',
      'Tempo Giacenza (Giorni)',
      'Titolo Articolo',
      'Piattaforma Vendita',
      'Canali Pubblicati',
      'Quantità',
      'Stato Articolo',
      'Costo Acquisto Unitario (€)',
      'Totale Costo Acquisto (€)',
      'Prezzo Vendita Unitario (€)',
      'Totale Ricavo Lordo (€)',
      'Commissioni Piattaforma (€)',
      'Spese Spedizione & Imballo (€)',
      'Guadagno Netto Totale (€)',
      'Margine Netto (%)',
      'ROI Netto (%)',
      'Foto Articolo',
      'Note Aggiuntive',
    ];

    csvContent += headers.join(';') + '\r\n';

    // Summary accumulator variables
    let totalQtySum = 0;
    let totalPurchaseCostSum = 0;
    let totalRevenueSum = 0;
    let totalFeesSum = 0;
    let totalShippingPkgSum = 0;
    let totalNetProfitSum = 0;
    let soldItemsCount = 0;
    let totalDaysToSellSum = 0;

    const sanitize = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const formatDecimal = (num: number) => num.toFixed(2).replace('.', ',');

    // Populate Rows
    const allPlatforms = getAllAvailablePlatforms();
    items.forEach((item) => {
      const activePlatforms =
        item.platforms && item.platforms.length > 0 ? item.platforms : [item.platformId];
      const platformNames = activePlatforms
        .map((pid) => allPlatforms.find((p) => p.id === pid)?.name || pid)
        .join(', ');

      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const isSold = item.status === 'sold';
      const sellingPrice =
        isSold && item.actualSellingPrice
          ? item.actualSellingPrice
          : item.targetSellingPrice;

      const soldPlatformObj = allPlatforms.find((p) => p.id === item.platformId);
      const soldPlatformName = isSold ? (soldPlatformObj?.name || item.platformId) : '-';

      const customFee = item.customFees?.[item.platformId];
      const calc = calculateResellProfit({
        sellingPrice,
        purchaseCost: item.purchaseCost,
        sellerShippingCost: item.sellerShippingCost,
        packagingCost: item.packagingCost,
        platformId: item.platformId,
        customSellerFeePercent: customFee?.percent,
        customSellerFixedFee: customFee?.fixed,
      });

      // Compute shelf velocity in days
      let daysShelfLifeText = '-';
      if (item.createdAt) {
        const createdTime = new Date(item.createdAt).getTime();
        const endTime = isSold && item.soldAt ? new Date(item.soldAt).getTime() : Date.now();
        const days = Math.max(0, Math.round((endTime - createdTime) / (1000 * 60 * 60 * 24)));
        daysShelfLifeText = isSold ? `${days}` : `${days} (in vendita)`;
        if (isSold) {
          totalDaysToSellSum += days;
          soldItemsCount += qty;
        }
      }

      const totalItemPurchaseCost = item.purchaseCost * qty;
      const totalItemRevenue = sellingPrice * qty;
      const totalItemFees = calc.totalSellerFees * qty;
      const totalItemShippingPkg = (item.sellerShippingCost + item.packagingCost) * qty;
      const totalItemNetProfit = calc.netProfit * qty;

      // Accumulate totals
      totalQtySum += qty;
      totalPurchaseCostSum += totalItemPurchaseCost;
      totalRevenueSum += totalItemRevenue;
      totalFeesSum += totalItemFees;
      totalShippingPkgSum += totalItemShippingPkg;
      totalNetProfitSum += totalItemNetProfit;

      const photoLabel = item.photoUri ? `Presente (${item.photoUri})` : 'Nessuna foto';

      const row = [
        sanitize(item.id),
        sanitize(item.createdAt ? item.createdAt.slice(0, 10) : ''),
        sanitize(item.soldAt ? item.soldAt.slice(0, 10) : '-'),
        sanitize(daysShelfLifeText),
        sanitize(item.title),
        sanitize(soldPlatformName),
        sanitize(platformNames),
        sanitize(qty),
        sanitize(
          item.status === 'sold'
            ? 'Venduto'
            : item.status === 'draft'
            ? 'Bozza'
            : 'In Vendita'
        ),
        sanitize(formatDecimal(item.purchaseCost)),
        sanitize(formatDecimal(totalItemPurchaseCost)),
        sanitize(formatDecimal(sellingPrice)),
        sanitize(formatDecimal(totalItemRevenue)),
        sanitize(formatDecimal(totalItemFees)),
        sanitize(formatDecimal(totalItemShippingPkg)),
        sanitize(formatDecimal(totalItemNetProfit)),
        sanitize(formatDecimal(calc.marginPercent)),
        sanitize(formatDecimal(calc.roiPercent)),
        sanitize(photoLabel),
        sanitize(item.notes || ''),
      ];

      csvContent += row.join(';') + '\r\n';
    });

    // Compute overall weighted performance
    const overallMargin = totalRevenueSum > 0 ? (totalNetProfitSum / totalRevenueSum) * 100 : 0;
    const overallROI = totalPurchaseCostSum > 0 ? (totalNetProfitSum / totalPurchaseCostSum) * 100 : 0;
    const avgDaysToSell = soldItemsCount > 0 ? (totalDaysToSellSum / soldItemsCount).toFixed(1) : '-';

    // Blank row separator before Grand Totals
    csvContent += '\r\n';
    csvContent += `# =====================================================================\r\n`;
    csvContent += `# RIEPILOGO TOTALE DI CHIUSURA CONTABILE\r\n`;
    csvContent += `# =====================================================================\r\n`;

    const summaryRow = [
      sanitize('TOTALI GENERALI'),
      sanitize(''),
      sanitize(''),
      sanitize(avgDaysToSell !== '-' ? `${avgDaysToSell} gg medi` : '-'),
      sanitize(`Totale Capi: ${items.length}`),
      sanitize(''),
      sanitize(''),
      sanitize(totalQtySum),
      sanitize(''),
      sanitize(''),
      sanitize(formatDecimal(totalPurchaseCostSum)),
      sanitize(''),
      sanitize(formatDecimal(totalRevenueSum)),
      sanitize(formatDecimal(totalFeesSum)),
      sanitize(formatDecimal(totalShippingPkgSum)),
      sanitize(formatDecimal(totalNetProfitSum)),
      sanitize(formatDecimal(overallMargin)),
      sanitize(formatDecimal(overallROI)),
      sanitize(''),
      sanitize(''),
    ];

    csvContent += summaryRow.join(';') + '\r\n';

    const fileName = `registro_vendite_reselltracker_${now.toISOString().slice(0, 10)}.csv`;
    const file = new File(Paths.document, fileName);

    if (file.exists) {
      file.delete();
    }
    file.create();
    await file.write(csvContent);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Esporta Registro Vendite CSV (Excel)',
      UTI: 'public.comma-separated-values-text',
    });

    return {
      success: true,
      message: `Registro contabile di ${items.length} articoli esportato con successo!`,
    };
  } catch (err: any) {
    console.error('CSV Export error:', err);
    return {
      success: false,
      message: err?.message || 'Errore durante l\'esportazione del file CSV.',
    };
  }
}
