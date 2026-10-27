import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllInventoryItems } from './db';
import { calculateResellProfit } from './feeCalculator';
import { PLATFORMS } from '../constants/platforms';

export async function exportInventoryToCSV(): Promise<{ success: boolean; message: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, message: 'La condivisione file non è supportata su questo dispositivo.' };
    }

    const items = getAllInventoryItems('all');
    if (items.length === 0) {
      return { success: false, message: 'Non ci sono articoli nell\'inventario da esportare.' };
    }

    // CSV content initialization without BOM to prevent ï»¿ artifact
    let csvContent = '';

    // Headers with semicolon delimiter (European Excel standard)
    const headers = [
      'ID',
      'Data Inserimento',
      'Data Vendita',
      'Titolo Articolo',
      'Piattaforma',
      'Stato',
      'Prezzo Acquisto (€)',
      'Prezzo Vendita (€)',
      'Commissione Piattaforma (€)',
      'Spedizione & Imballo (€)',
      'Guadagno Netto (€)',
      'Margine (%)',
      'ROI (%)',
      'Note',
    ];

    csvContent += headers.join(';') + '\r\n';

    // Rows
    items.forEach((item) => {
      const platform = PLATFORMS.find((p) => p.id === item.platformId) || PLATFORMS[0];
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

      const row = [
        sanitize(item.id),
        sanitize(item.createdAt ? item.createdAt.slice(0, 10) : ''),
        sanitize(item.soldAt ? item.soldAt.slice(0, 10) : ''),
        sanitize(item.title),
        sanitize(platform.name),
        sanitize(
          item.status === 'sold'
            ? 'Venduto'
            : item.status === 'draft'
            ? 'Bozza'
            : 'In Vendita'
        ),
        sanitize(formatDecimal(item.purchaseCost)),
        sanitize(formatDecimal(sellingPrice)),
        sanitize(formatDecimal(calc.totalSellerFees)),
        sanitize(formatDecimal(item.sellerShippingCost + item.packagingCost)),
        sanitize(formatDecimal(calc.netProfit)),
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
      dialogTitle: 'Apri o Condividi Registro Vendite (Excel / Fogli)',
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
