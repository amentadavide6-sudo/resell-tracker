import * as SQLite from 'expo-sqlite';
import { InventoryItem, ItemStatus } from '../types';

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
}

export function getAllInventoryItems(statusFilter?: ItemStatus | 'all'): InventoryItem[] {
  const db = getDatabase();
  let query = 'SELECT * FROM inventory ORDER BY id DESC';
  let params: any[] = [];

  if (statusFilter && statusFilter !== 'all') {
    query = 'SELECT * FROM inventory WHERE status = ? ORDER BY id DESC';
    params = [statusFilter];
  }

  const rows = db.getAllSync<InventoryItem>(query, params);
  return rows || [];
}

export function insertInventoryItem(item: Omit<InventoryItem, 'id'>): number {
  const db = getDatabase();
  const result = db.runSync(
    `INSERT INTO inventory (
      title, platformId, purchaseCost, targetSellingPrice, actualSellingPrice,
      sellerShippingCost, packagingCost, status, photoUri, notes, createdAt, soldAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.title,
      item.platformId,
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
  db.runSync(
    `UPDATE inventory SET
      title = ?,
      platformId = ?,
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

export function markItemAsSold(id: number, finalPrice: number): void {
  const db = getDatabase();
  db.runSync(
    `UPDATE inventory SET
      status = 'sold',
      actualSellingPrice = ?,
      soldAt = ?
    WHERE id = ?`,
    [finalPrice, new Date().toISOString(), id]
  );
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
