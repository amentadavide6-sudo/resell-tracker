import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllInventoryItems, insertInventoryItem, getDatabase } from './db';
import { getAllCustomPlatforms } from './customPlatformManager';
import { InventoryItem, PlatformConfig } from '../types';

export interface BackupPayload {
  app: string;
  version: string;
  createdAt: string;
  itemCount: number;
  items: InventoryItem[];
  customPlatforms?: PlatformConfig[];
}

export async function exportBackup(): Promise<{ success: boolean; message: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, message: 'La condivisione file non è supportata su questo dispositivo.' };
    }

    const items = getAllInventoryItems('all');
    if (items.length === 0) {
      return {
        success: false,
        message: 'Il tuo inventario è vuoto: inserisci almeno un articolo prima di creare il backup.',
      };
    }

    const customPlatforms = getAllCustomPlatforms();

    const payload: BackupPayload = {
      app: 'ResellTracker',
      version: '1.2.6',
      createdAt: new Date().toISOString(),
      itemCount: items.length,
      items,
      customPlatforms,
    };

    const fileName = `reselltracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File(Paths.document, fileName);
    
    if (file.exists) {
      file.delete();
    }
    file.create();
    await file.write(JSON.stringify(payload, null, 2));

    // Launch share sheet asynchronously without awaiting forever (Android share chooser dismissal does not resolve onActivityResult)
    Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salva o Invia il Backup ResellTracker',
      UTI: 'public.json',
    }).catch((shareErr) => {
      console.log('Share sheet dismissed or error:', shareErr);
    });

    return { success: true, message: `Backup di ${items.length} articoli generato con successo!` };
  } catch (err: any) {
    console.error('Export error:', err);
    return { success: false, message: err?.message || 'Errore durante la creazione del backup.' };
  }
}

export async function importBackup(): Promise<{ success: boolean; count: number; message: string }> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/*', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, count: 0, message: 'Nessun file selezionato.' };
    }

    const fileUri = result.assets[0].uri;
    let content = '';

    try {
      const file = new File(fileUri);
      content = await file.text();
    } catch (readErr) {
      // Robust fallback for special Android content providers
      try {
        const response = await fetch(fileUri);
        content = await response.text();
      } catch (fallbackErr) {
        throw new Error('Impossibile leggere il file selezionato.');
      }
    }

    const parsed: BackupPayload = JSON.parse(content);

    if (!parsed || !Array.isArray(parsed.items)) {
      return { success: false, count: 0, message: 'Formato file non valido. Seleziona un backup valido di ResellTracker (.json).' };
    }

    if (parsed.items.length === 0) {
      return { success: true, count: 0, message: 'Il file di backup selezionato è vuoto (0 articoli).' };
    }

    let importedCount = 0;
    const db = getDatabase();

    // 1. Restore custom platforms if present
    if (parsed.customPlatforms && Array.isArray(parsed.customPlatforms)) {
      try {
        for (const cp of parsed.customPlatforms) {
          if (cp.id && cp.name) {
            db.runSync(
              `INSERT OR IGNORE INTO custom_platforms (id, name, fee_percent, fixed_fee, color, badge_bg, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [
                cp.id,
                cp.name,
                cp.sellerFeePercent ?? 0,
                cp.sellerFixedFee ?? 0,
                cp.color || '#6366F1',
                cp.badgeBg || '#EEF2FF',
                new Date().toISOString(),
              ]
            );
          }
        }
      } catch (cpErr) {
        console.warn('Could not restore custom platforms:', cpErr);
      }
    }

    // 2. Restore items in transaction
    db.withTransactionSync(() => {
      for (const item of parsed.items) {
        insertInventoryItem({
          title: item.title,
          platformId: item.platformId,
          platforms: item.platforms,
          quantity: item.quantity,
          purchaseCost: item.purchaseCost,
          targetSellingPrice: item.targetSellingPrice,
          actualSellingPrice: item.actualSellingPrice,
          sellerShippingCost: item.sellerShippingCost,
          packagingCost: item.packagingCost,
          status: item.status,
          photoUri: item.photoUri,
          notes: item.notes,
          createdAt: item.createdAt || new Date().toISOString(),
          soldAt: item.soldAt,
        });
        importedCount++;
      }
    });

    return {
      success: true,
      count: importedCount,
      message: `Ripristinati con successo ${importedCount} articoli nel tuo inventario!`,
    };
  } catch (err: any) {
    console.error('Import error:', err);
    return { success: false, count: 0, message: err?.message || 'Errore durante la lettura del file di backup.' };
  }
}
