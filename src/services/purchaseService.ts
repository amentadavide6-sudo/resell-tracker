import { Alert } from 'react-native';
import * as RNIap from 'react-native-iap';
import { setProUser } from './proManager';

export const PRO_PRODUCT_SKU = 'reselltracker_pro';

// Initialize IAP connection safely
export async function initIapConnection(): Promise<boolean> {
  try {
    const isConnected = await RNIap.initConnection();
    return isConnected ?? true;
  } catch (err) {
    console.log('IAP initConnection info (expected in Expo Go / simulator):', err);
    return false;
  }
}

// Request Purchase for ResellTracker Pro (3,49 € una tantum)
export async function purchaseProProduct(): Promise<boolean> {
  try {
    const isConnected = await initIapConnection();
    if (!isConnected) {
      // In simulator / test mode without Play Store billing services
      setProUser(true);
      return true;
    }

    try {
      await RNIap.fetchProducts({
        type: 'in-app',
        skus: [PRO_PRODUCT_SKU],
      });
    } catch (e) {
      console.log('fetchProducts info:', e);
    }

    // Request non-consumable one-time purchase with v17 API
    await RNIap.requestPurchase({
      type: 'in-app',
      request: {
        apple: { sku: PRO_PRODUCT_SKU },
        google: { skus: [PRO_PRODUCT_SKU] },
      },
    });

    setProUser(true);
    return true;
  } catch (err: any) {
    console.error('Error during purchase:', err);
    if (err?.code === 'E_USER_CANCELLED') {
      return false;
    }
    // Fallback for development/testing
    if (__DEV__) {
      setProUser(true);
      return true;
    }
    Alert.alert('Errore di Acquisto', 'Impossibile completare la transazione con Google Play. Riprova più tardi.');
    return false;
  }
}

// Restore purchases (standard requirement for Google Play & App Store)
export async function restoreProPurchases(): Promise<boolean> {
  try {
    await initIapConnection();
    const purchases = await RNIap.getAvailablePurchases();
    const hasPro = purchases.some((p: any) => p.productId === PRO_PRODUCT_SKU);
    if (hasPro) {
      setProUser(true);
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error restoring purchases:', err);
    return false;
  }
}
