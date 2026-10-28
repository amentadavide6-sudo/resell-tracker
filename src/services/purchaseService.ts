import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesPackage,
} from 'react-native-purchases';
import { setProUser, isProUser } from './proManager';

/**
 * GOOGLE PLAY BILLING & REVENUECAT ARCHITECTURE
 * 
 * Target Product IDs on Google Play Console:
 * 1. 'reselltracker_pro' -> In-app Managed Product: 5,99 € Una Tantum (Lifetime)
 * 2. 'reselltracker_pro_monthly' -> Subscription Product: 1,99 € / month
 * 
 * Entitlement identifier configured on RevenueCat dashboard:
 * 'pro'
 */

// Replace with your RevenueCat Google Public API Key from:
// https://app.revenuecat.com/ -> Project Settings -> API Keys -> Public app-specific API keys
export const REVENUECAT_GOOGLE_API_KEY = 'goog_reselltracker_prod_placeholder';

export const ENTITLEMENT_ID = 'pro';
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

let isIapInitialized = false;

function isLiveKeyConfigured(): boolean {
  return (
    typeof REVENUECAT_GOOGLE_API_KEY === 'string' &&
    REVENUECAT_GOOGLE_API_KEY.startsWith('goog_') &&
    !REVENUECAT_GOOGLE_API_KEY.includes('placeholder')
  );
}

/**
 * Initialize Google Play Billing via RevenueCat.
 * Call this once when the application boots in App.tsx.
 */
export async function initIapConnection(): Promise<boolean> {
  if (isIapInitialized) return true;

  try {
    if (Platform.OS === 'android' && isLiveKeyConfigured()) {
      Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);
      await Purchases.configure({ apiKey: REVENUECAT_GOOGLE_API_KEY });

      // Automatically sync active subscription status
      Purchases.addCustomerInfoUpdateListener((customerInfo: CustomerInfo) => {
        const hasPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        setProUser(hasPro);
      });

      // Check current customer info on boot
      const info = await Purchases.getCustomerInfo();
      const hasPro = typeof info.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      if (hasPro) {
        setProUser(true);
      }
      isIapInitialized = true;
      return true;
    } else {
      console.log(
        '[In-App Billing] Running in developer test mode. Set your live REVENUECAT_GOOGLE_API_KEY in purchaseService.ts when ready for Google Play production.'
      );
      isIapInitialized = true;
      return true;
    }
  } catch (err) {
    console.warn('[In-App Billing] Initialization warning (offline or sandbox):', err);
    return false;
  }
}

/**
 * Request real Google Play purchase for Lifetime (5,99 €) or Monthly (1,99 €).
 */
export async function purchaseProProduct(planId: PurchasePlanId = 'lifetime'): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && isLiveKeyConfigured()) {
      const offerings = await Purchases.getOfferings();
      let packageToBuy: PurchasesPackage | null = null;

      if (offerings.current) {
        if (planId === 'lifetime') {
          packageToBuy =
            offerings.current.lifetime ||
            offerings.current.availablePackages.find(
              (p) =>
                p.identifier.toLowerCase().includes('lifetime') ||
                p.product.identifier === SKU_PRO_LIFETIME
            ) ||
            null;
        } else {
          packageToBuy =
            offerings.current.monthly ||
            offerings.current.availablePackages.find(
              (p) =>
                p.identifier.toLowerCase().includes('monthly') ||
                p.product.identifier === SKU_PRO_MONTHLY
            ) ||
            null;
        }
      }

      if (packageToBuy) {
        const { customerInfo } = await Purchases.purchasePackage(packageToBuy);
        const isEntitled =
          typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
        if (isEntitled) {
          setProUser(true);
          return true;
        }
        return false;
      } else {
        // Fallback: try direct product purchase
        const products = await Purchases.getProducts(
          [planId === 'lifetime' ? SKU_PRO_LIFETIME : SKU_PRO_MONTHLY]
        );
        if (products.length > 0) {
          const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
          const isEntitled =
            typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
          if (isEntitled) {
            setProUser(true);
            return true;
          }
        }
        return false;
      }
    } else {
      // Developer / Sandbox test mode
      console.log(`[In-App Billing] Simulated purchase completed for plan: ${planId}`);
      setProUser(true);
      return true;
    }
  } catch (err: any) {
    if (err.userCancelled) {
      console.log('[In-App Billing] User cancelled Google Play purchase sheet.');
      return false;
    }
    console.error('[In-App Billing] Purchase error:', err);
    throw err;
  }
}

/**
 * Restore previous purchases from Google Play.
 * Standard requirement for Google Play Store approval.
 */
export async function restoreProPurchases(): Promise<boolean> {
  try {
    if (Platform.OS === 'android' && isLiveKeyConfigured()) {
      const customerInfo = await Purchases.restorePurchases();
      const isEntitled =
        typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
      if (isEntitled) {
        setProUser(true);
        return true;
      }
      return false;
    } else {
      // Developer / Sandbox test mode
      return isProUser();
    }
  } catch (err) {
    console.error('[In-App Billing] Error restoring purchases:', err);
    return false;
  }
}
