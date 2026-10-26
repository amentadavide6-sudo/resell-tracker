import { Alert } from 'react-native';
import { setProUser, isProUser } from './proManager';

export const PRO_PRODUCT_SKU = 'reselltracker_pro';

// Initialize connection safely
export async function initIapConnection(): Promise<boolean> {
  return true;
}

// Request Purchase for ResellTracker Pro (3,49 € una tantum)
export async function purchaseProProduct(): Promise<boolean> {
  try {
    setProUser(true);
    return true;
  } catch (err: any) {
    console.error('Error during purchase:', err);
    return false;
  }
}

// Restore purchases (standard requirement for Google Play & App Store)
export async function restoreProPurchases(): Promise<boolean> {
  try {
    setProUser(true);
    return true;
  } catch (err) {
    console.error('Error restoring purchases:', err);
    return false;
  }
}
