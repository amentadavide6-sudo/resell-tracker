import { Alert } from 'react-native';
import { setProUser, isProUser } from './proManager';

/**
 * GOOGLE PLAY BILLING & REVENUECAT ARCHITECTURE BLUEPRINT
 * 
 * Target Product IDs on Google Play Console:
 * 1. 'reselltracker_pro' -> In-app Managed Product: 5,99 € Una Tantum (Early Adopter Lifetime)
 * 2. 'reselltracker_pro_monthly' -> Subscription Product: 1,99 € / month (with 7-day trial or immediate renewal)
 * 
 * Post-Launch RevenueCat Integration Guide:
 * 1. Install official SDK: npx expo install react-native-purchases
 * 2. Initialize in App.tsx: Purchases.configure({ apiKey: 'goog_api_key_here' });
 * 3. Fetch offerings: const offerings = await Purchases.getOfferings();
 * 4. Purchase package: await Purchases.purchasePackage(selectedPackage);
 * 5. On success: setProUser(true);
 */

export const SKU_PRO_LIFETIME = 'reselltracker_pro';
export const SKU_PRO_MONTHLY = 'reselltracker_pro_monthly';

export type PurchasePlanId = 'lifetime' | 'monthly';

export interface PlanConfig {
  id: PurchasePlanId;
  sku: string;
  badge?: string;
  badgeColor?: string;
  title: string;
  price: string;
  originalPrice?: string;
  billingPeriod: string;
  description: string;
  savingsPercent?: string;
}

export const PLAN_CONFIGS: Record<PurchasePlanId, PlanConfig> = {
  lifetime: {
    id: 'lifetime',
    sku: SKU_PRO_LIFETIME,
    badge: 'PIÙ SCELTO • SCONTO LANCIO',
    badgeColor: '#F59E0B',
    title: 'Accesso a Vita (Fondatori)',
    price: '5,99 €',
    originalPrice: '12,99 €',
    billingPeriod: 'una tantum',
    description: 'Nessun rinnovo o abbonamento. Paghi 1 volta sola, tuo per sempre.',
    savingsPercent: '-55%',
  },
  monthly: {
    id: 'monthly',
    sku: SKU_PRO_MONTHLY,
    badge: 'FLESSIBILE',
    badgeColor: '#6366F1',
    title: 'Abbonamento Mensile',
    price: '1,99 €',
    billingPeriod: '/ mese',
    description: 'Massima libertà. Disdici in qualsiasi momento su Google Play.',
  },
};

// Initialize connection safely
export async function initIapConnection(): Promise<boolean> {
  return true;
}

// Request Purchase for ResellTracker Pro (Lifetime 5,99 € or Monthly 1,99 €)
export async function purchaseProProduct(planId: PurchasePlanId = 'lifetime'): Promise<boolean> {
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
