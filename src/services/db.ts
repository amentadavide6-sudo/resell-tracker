import * as SQLite from 'expo-sqlite';
import { InventoryItem, ItemStatus, PlatformId } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!dbInstance) {
    dbInstance = SQLite.openDatabaseSync('resell_tracker.db');
    initDatabase(dbInstance);
  }
  return dbInstance;
}

function initDatabase(db: SQLite.SQLiteDatabase) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      platformId TEXT NOT NULL,
      platforms TEXT,
      quantity INTEGER NOT NULL DEFAULT 1,
      purchaseCost REAL NOT NULL DEFAULT 0,
      targetSellingPrice REAL NOT NULL DEFAULT 0,
      actualSellingPrice REAL,
      sellerShippingCost REAL NOT NULL DEFAULT 0,
      packagingCost REAL NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'listed',
      photoUri TEXT,
      notes TEXT,
      createdAt TEXT NOT NULL,
      soldAt TEXT
    );
  `);

  // Safe non-destructive column migrations for existing databases
  try {
    db.execSync('ALTER TABLE inventory ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;');
  } catch (_) {
    // Column already exists
  }

  try {
    db.execSync('ALTER TABLE inventory ADD COLUMN platforms TEXT;');
  } catch (_) {
    // Column already exists
  }

  try {
    db.execSync('ALTER TABLE inventory ADD COLUMN customFees TEXT;');
  } catch (_) {
    // Column already exists
  }

  // Achievements / Trophies table
  db.execSync(`
    CREATE TABLE IF NOT EXISTS user_trophies (
      id TEXT PRIMARY KEY,
      unlockedAt TEXT NOT NULL
    );
  `);
}

export function getAllInventoryItems(statusFilter?: ItemStatus | 'all'): InventoryItem[] {
  const db = getDatabase();
  let query = 'SELECT * FROM inventory ORDER BY id DESC';
  let params: any[] = [];

  if (statusFilter && statusFilter !== 'all') {
    query = 'SELECT * FROM inventory WHERE status = ? ORDER BY id DESC';
    params = [statusFilter];
  }

  const rows = db.getAllSync<any>(query, params);
  if (!rows) return [];

  return rows.map((row) => {
    let parsedPlatforms: PlatformId[] = [row.platformId as PlatformId];
    if (row.platforms) {
      try {
        parsedPlatforms = JSON.parse(row.platforms);
      } catch {
        parsedPlatforms = row.platforms.split(',').filter(Boolean) as PlatformId[];
      }
    }
    let parsedCustomFees = undefined;
    if (row.customFees) {
      try {
        parsedCustomFees = JSON.parse(row.customFees);
      } catch {
        parsedCustomFees = undefined;
      }
    }
    return {
      ...row,
      quantity: typeof row.quantity === 'number' && row.quantity > 0 ? row.quantity : 1,
      platforms: parsedPlatforms && parsedPlatforms.length > 0 ? parsedPlatforms : [row.platformId as PlatformId],
      customFees: parsedCustomFees,
    };
  });
}

export function insertInventoryItem(item: Omit<InventoryItem, 'id'>): number {
  const db = getDatabase();
  const platformsStr = JSON.stringify(
    item.platforms && item.platforms.length > 0 ? item.platforms : [item.platformId]
  );
  const customFeesStr = item.customFees ? JSON.stringify(item.customFees) : null;
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

  const result = db.runSync(
    `INSERT INTO inventory (
      title, platformId, platforms, customFees, quantity, purchaseCost, targetSellingPrice, actualSellingPrice,
      sellerShippingCost, packagingCost, status, photoUri, notes, createdAt, soldAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.title,
      item.platformId,
      platformsStr,
      customFeesStr,
      quantity,
      item.purchaseCost,
      item.targetSellingPrice,
      item.actualSellingPrice ?? null,
      item.sellerShippingCost,
      item.packagingCost,
      item.status,
      item.photoUri ?? null,
      item.notes ?? null,
      item.createdAt || new Date().toISOString(),
      item.soldAt ?? null,
    ]
  );
  return result.lastInsertRowId;
}

export function updateInventoryItem(item: InventoryItem): void {
  if (!item.id) return;
  const db = getDatabase();
  const platformsStr = JSON.stringify(
    item.platforms && item.platforms.length > 0 ? item.platforms : [item.platformId]
  );
  const customFeesStr = item.customFees ? JSON.stringify(item.customFees) : null;
  const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;

  db.runSync(
    `UPDATE inventory SET
      title = ?,
      platformId = ?,
      platforms = ?,
      customFees = ?,
      quantity = ?,
      purchaseCost = ?,
      targetSellingPrice = ?,
      actualSellingPrice = ?,
      sellerShippingCost = ?,
      packagingCost = ?,
      status = ?,
      photoUri = ?,
      notes = ?,
      soldAt = ?
    WHERE id = ?`,
    [
      item.title,
      item.platformId,
      platformsStr,
      customFeesStr,
      quantity,
      item.purchaseCost,
      item.targetSellingPrice,
      item.actualSellingPrice ?? null,
      item.sellerShippingCost,
      item.packagingCost,
      item.status,
      item.photoUri ?? null,
      item.notes ?? null,
      item.soldAt ?? null,
      item.id,
    ]
  );
}

export function markItemAsSold(id: number, finalPrice: number, soldPlatformId?: PlatformId): void {
  const db = getDatabase();
  if (soldPlatformId) {
    db.runSync(
      `UPDATE inventory SET
        status = 'sold',
        actualSellingPrice = ?,
        platformId = ?,
        soldAt = ?
      WHERE id = ?`,
      [finalPrice, soldPlatformId, new Date().toISOString(), id]
    );
  } else {
    db.runSync(
      `UPDATE inventory SET
        status = 'sold',
        actualSellingPrice = ?,
        soldAt = ?
      WHERE id = ?`,
      [finalPrice, new Date().toISOString(), id]
    );
  }
}

export function recordPartialSale(
  originalItem: InventoryItem,
  soldQuantity: number,
  unitSellingPrice: number,
  soldPlatformId?: PlatformId
): { remainingQuantity: number; soldItemId: number } {
  if (!originalItem.id) throw new Error('Articolo non valido per la vendita parziale');
  const db = getDatabase();
  const currentQty = originalItem.quantity || 1;
  const remainingQty = Math.max(0, currentQty - soldQuantity);

  // 1. Decrement quantity on the original listed item
  db.runSync(
    `UPDATE inventory SET quantity = ? WHERE id = ?`,
    [remainingQty, originalItem.id]
  );

  // 2. Insert new record for the sold units
  const soldPlatform = soldPlatformId || originalItem.platformId;
  const platformsStr = JSON.stringify([soldPlatform]);
  const customFeesStr = originalItem.customFees ? JSON.stringify(originalItem.customFees) : null;
  const soldRow = db.runSync(
    `INSERT INTO inventory (
      title, platformId, platforms, quantity, purchaseCost, targetSellingPrice, actualSellingPrice,
      sellerShippingCost, packagingCost, status, photoUri, notes, createdAt, soldAt, customFees
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      originalItem.title,
      soldPlatform,
      platformsStr,
      soldQuantity,
      originalItem.purchaseCost,
      originalItem.targetSellingPrice,
      unitSellingPrice,
      originalItem.sellerShippingCost,
      originalItem.packagingCost,
      'sold',
      originalItem.photoUri ?? null,
      originalItem.notes ?? null,
      originalItem.createdAt || new Date().toISOString(),
      new Date().toISOString(),
      customFeesStr,
    ]
  );

  return { remainingQuantity: remainingQty, soldItemId: soldRow.lastInsertRowId };
}

export function updateItemStatus(id: number, newStatus: ItemStatus): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE inventory SET status = ? WHERE id = ?`,
    [newStatus, id]
  );
}

export function deleteInventoryItem(id: number): void {
  const db = getDatabase();
  db.runSync(`DELETE FROM inventory WHERE id = ?`, [id]);
}

export function getTotalInventoryCount(): number {
  try {
    const db = getDatabase();
    const row = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM inventory');
    return row ? row.count : 0;
  } catch (err) {
    console.error('Error getting total inventory count:', err);
    return 0;
  }
}
