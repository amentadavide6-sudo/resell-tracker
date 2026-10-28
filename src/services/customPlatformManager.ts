import { getDatabase } from './db';
import { PlatformConfig, PlatformId } from '../types';
import { PLATFORMS as BUILTIN_PLATFORMS } from '../constants/platforms';

const CUSTOM_COLOR_PALETTES = [
  { color: '#8B5CF6', badgeBg: '#F3E8FF' }, // Purple
  { color: '#EC4899', badgeBg: '#FCE7F3' }, // Pink
  { color: '#F59E0B', badgeBg: '#FEF3C7' }, // Amber
  { color: '#06B6D4', badgeBg: '#CFFAFE' }, // Cyan
  { color: '#10B981', badgeBg: '#D1FAE5' }, // Emerald
  { color: '#6366F1', badgeBg: '#EEF2FF' }, // Indigo
];

function initCustomPlatformsTable(): void {
  try {
    const db = getDatabase();
    db.execSync(`
      CREATE TABLE IF NOT EXISTS custom_platforms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        fee_percent REAL NOT NULL,
        fixed_fee REAL NOT NULL,
        color TEXT NOT NULL,
        badge_bg TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  } catch (err) {
    console.error('Error initializing custom_platforms table:', err);
  }
}

export function getAllCustomPlatforms(): PlatformConfig[] {
  initCustomPlatformsTable();
  try {
    const db = getDatabase();
    const rows = db.getAllSync<{
      id: string;
      name: string;
      fee_percent: number;
      fixed_fee: number;
      color: string;
      badge_bg: string;
    }>('SELECT * FROM custom_platforms ORDER BY created_at ASC');

    return rows.map((r) => ({
      id: r.id as PlatformId,
      name: r.name,
      tagline: `${r.fee_percent}% + ${r.fixed_fee.toFixed(2)}€`,
      color: r.color,
      badgeBg: r.badge_bg,
      sellerFeePercent: r.fee_percent,
      sellerFixedFee: r.fixed_fee,
      buyerProtectionPercent: 0,
      buyerProtectionFixed: 0,
      paymentProcessingPercent: 0,
      paymentProcessingFixed: 0,
      description: `Piattaforma personalizzata: ${r.name} (${r.fee_percent}% + ${r.fixed_fee}€)`,
      isCustom: true,
    }));
  } catch (err) {
    console.error('Error reading custom platforms:', err);
    return [];
  }
}

export function getAllAvailablePlatforms(): PlatformConfig[] {
  const custom = getAllCustomPlatforms();
  // Filter out the legacy single placeholder 'custom' if actual custom platforms exist, or keep it
  const base = BUILTIN_PLATFORMS.filter((p) => p.id !== 'custom');
  return [...base, ...custom, BUILTIN_PLATFORMS.find((p) => p.id === 'custom')!];
}

export function getPlatformById(id: PlatformId): PlatformConfig {
  const all = getAllAvailablePlatforms();
  return all.find((p) => p.id === id) || all[0];
}

export function addCustomPlatform(
  name: string,
  feePercent: number,
  fixedFee: number
): PlatformConfig {
  initCustomPlatformsTable();
  const db = getDatabase();
  const trimmedName = name.trim() || 'Mercatino';
  const customList = getAllCustomPlatforms();
  const palette = CUSTOM_COLOR_PALETTES[customList.length % CUSTOM_COLOR_PALETTES.length];
  const newId = `custom_${Date.now()}`;

  db.runSync(
    `INSERT INTO custom_platforms (id, name, fee_percent, fixed_fee, color, badge_bg, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [newId, trimmedName, feePercent, fixedFee, palette.color, palette.badgeBg, new Date().toISOString()]
  );

  return {
    id: newId as PlatformId,
    name: trimmedName,
    tagline: `${feePercent}% + ${fixedFee.toFixed(2)}€`,
    color: palette.color,
    badgeBg: palette.badgeBg,
    sellerFeePercent: feePercent,
    sellerFixedFee: fixedFee,
    buyerProtectionPercent: 0,
    buyerProtectionFixed: 0,
    paymentProcessingPercent: 0,
    paymentProcessingFixed: 0,
    description: `Piattaforma personalizzata: ${trimmedName}`,
    isCustom: true,
  };
}

export function deleteCustomPlatform(id: string): void {
  initCustomPlatformsTable();
  try {
    const db = getDatabase();
    db.runSync('DELETE FROM custom_platforms WHERE id = ?', [id]);
  } catch (err) {
    console.error('Error deleting custom platform:', err);
  }
}

// Backwards compatibility for single custom platform settings
export function getCustomPlatformSettings() {
  const platforms = getAllCustomPlatforms();
  if (platforms.length > 0) {
    const p = platforms[0];
    return {
      name: p.name,
      sellerFeePercent: p.sellerFeePercent,
      sellerFixedFee: p.sellerFixedFee,
    };
  }
  return { name: 'Personalizzato', sellerFeePercent: 5, sellerFixedFee: 0 };
}

export function saveCustomPlatformSettings(settings: {
  name: string;
  sellerFeePercent: number;
  sellerFixedFee: number;
}) {
  addCustomPlatform(settings.name, settings.sellerFeePercent, settings.sellerFixedFee);
}
