import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllInventoryItems } from './db';
import { calculateResellProfit } from './feeCalculator';
import { PLATFORMS } from '../constants/platforms';

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

    let csvContent = '';

    // Headers with semicolon delimiter (European Excel standard)
    const headers = [
      'ID',
      'Data Inserimento',
      'Data Vendita',
      'Titolo Articolo',
      'Piattaforme',
      'Quantità',
      'Stato',
      'Prezzo Acquisto Unitario (€)',
      'Prezzo Vendita Unitario (€)',
      'Totale Ricavo (€)',
      'Commissioni Piattaforma Totali (€)',
      'Spese Spedizione & Imballo (€)',
      'Guadagno Netto Totale (€)',
      'Margine (%)',
      'ROI (%)',
      'Note',
    ];

    csvContent += headers.join(';') + '\r\n';

    // Rows
    items.forEach((item) => {
      const activePlatforms =
        item.platforms && item.platforms.length > 0 ? item.platforms : [item.platformId];
      const platformNames = activePlatforms
        .map((pid) => PLATFORMS.find((p) => p.id === pid)?.name || pid)
        .join(', ');

      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const sellingPrice =
        item.status === 'sold' && item.actualSellingPrice
          ? item.actualSellingPrice
          : item.targetSellingPrice;

      const calc = calculateResellProfit({
        sellingPrice,
        purchaseCost: item.purchaseCost,
        sellerShippingCost: item.sellerShippingCost,
        packagingCost: item.packagingCost,
        platformId: item.platformId,
      });

      const sanitize = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const formatDecimal = (num: number) => num.toFixed(2).replace('.', ',');

      const totalRevenue = sellingPrice * qty;
      const totalFees = calc.totalSellerFees * qty;
      const totalShippingPkg = (item.sellerShippingCost + item.packagingCost) * qty;
      const totalNetProfit = calc.netProfit * qty;

      const row = [
        sanitize(item.id),
        sanitize(item.createdAt ? item.createdAt.slice(0, 10) : ''),
        sanitize(item.soldAt ? item.soldAt.slice(0, 10) : ''),
        sanitize(item.title),
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
        sanitize(formatDecimal(sellingPrice)),
        sanitize(formatDecimal(totalRevenue)),
        sanitize(formatDecimal(totalFees)),
        sanitize(formatDecimal(totalShippingPkg)),
        sanitize(formatDecimal(totalNetProfit)),
        sanitize(formatDecimal(calc.marginPercent)),
        sanitize(formatDecimal(calc.roiPercent)),
        sanitize(item.notes || ''),
      ];

      csvContent += row.join(';') + '\r\n';
    });

    const fileName = `registro_vendite_reselltracker_${new Date().toISOString().slice(0, 10)}.csv`;
    const file = new File(Paths.document, fileName);

    if (file.exists) {
      file.delete();
    }
    file.create();
    await file.write(csvContent);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'text/csv',
      dialogTitle: 'Esporta Registro Fiscale CSV',
      UTI: 'public.comma-separated-values-text',
    });

    return {
      success: true,
      message: `Registro di ${items.length} articoli esportato con successo!`,
    };
  } catch (err: any) {
    console.error('CSV Export error:', err);
    return {
      success: false,
      message: err?.message || 'Errore durante l\'esportazione del file CSV.',
    };
  }
}
