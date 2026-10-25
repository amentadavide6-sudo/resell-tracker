import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { getAllInventoryItems, insertInventoryItem, getDatabase } from './db';
import { InventoryItem } from '../types';

export interface BackupPayload {
  app: string;
  version: string;
  createdAt: string;
  itemCount: number;
  items: InventoryItem[];
}

export async function exportBackup(): Promise<{ success: boolean; message: string }> {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      return { success: false, message: 'La condivisione file non è supportata su questo dispositivo.' };
    }

    const items = getAllInventoryItems('all');
    const payload: BackupPayload = {
      app: 'ResellTracker',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      itemCount: items.length,
      items,
    };

    const fileName = `reselltracker_backup_${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File(Paths.document, fileName);
    
    if (file.exists) {
      file.delete();
    }
    file.create();
    await file.write(JSON.stringify(payload, null, 2));

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salva o Invia il Backup ResellTracker',
      UTI: 'public.json',
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
      type: ['application/json', 'text/json', '*/*'],
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false, count: 0, message: 'Nessun file selezionato.' };
    }

    const fileUri = result.assets[0].uri;
    const file = new File(fileUri);
    const content = await file.text();
    const parsed: BackupPayload = JSON.parse(content);

    if (!parsed || !Array.isArray(parsed.items)) {
      return { success: false, count: 0, message: 'Formato file non valido. Seleziona un backup valido di ResellTracker.' };
    }

    let importedCount = 0;
    const db = getDatabase();

    // Use transaction for safe batch restore
    db.withTransactionSync(() => {
      for (const item of parsed.items) {
        insertInventoryItem({
          title: item.title,
          platformId: item.platformId,
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
