import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAllInventoryItems, getDatabase } from './db';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export function areNotificationsEnabled(): boolean {
  try {
    const db = getDatabase();
    db.execSync(`
      CREATE TABLE IF NOT EXISTS user_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
    const row = db.getFirstSync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      ['notifications_enabled']
    );
    // Defaults to true
    return row ? row.value !== 'false' : true;
  } catch (err) {
    console.error('Error reading notification setting:', err);
    return true;
  }
}

export function setNotificationsEnabled(enabled: boolean): void {
  try {
    const db = getDatabase();
    db.runSync(
      `INSERT OR REPLACE INTO user_settings (key, value) VALUES ('notifications_enabled', ?)`,
      [enabled ? 'true' : 'false']
    );
  } catch (err) {
    console.error('Error saving notification setting:', err);
  }
}

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      return requested.granted;
    }
    return true;
  } catch (err) {
    console.error('Error requesting notification permissions:', err);
    return false;
  }
}

export async function scheduleSmartNotifications(): Promise<void> {
  try {
    if (!areNotificationsEnabled()) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    // Clear previously scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 1. Sunday Evening Weekly Recap (Every Sunday at 20:30)
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '📈 ResellTracker • Weekend di Vendite',
        body: 'Fine settimana terminato! Apri l\'app per registrare i tuoi profitti, aggiornare lo stock e scalare i livelli del Reseller Club ⚡',
        sound: true,
        data: { screen: 'inventory' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 20,
        minute: 30,
      },
    });

    // 2. Stale Items Check (> 30 days active in stock without selling)
    const activeItems = getAllInventoryItems('listed');
    const now = Date.now();
    const staleThresholdMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    const staleItems = activeItems.filter((item) => {
      if (!item.createdAt) return false;
      const createdTime = new Date(item.createdAt).getTime();
      return now - createdTime >= staleThresholdMs;
    });

    if (staleItems.length > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '📦 Consiglio Reseller: Giacenza Armadio',
          body: `Hai ${staleItems.length} capi in vendita da oltre un mese. Un ribasso del 10% su Vinted o eBay riattiva subito l'algoritmo di visibilità!`,
          sound: true,
          data: { screen: 'inventory' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 24 * 60 * 60, // 24 hours from now
        },
      });
    }
  } catch (err) {
    console.error('Error scheduling smart notifications:', err);
  }
}

export async function sendTestNotification(): Promise<boolean> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return false;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⚡ Notifica Intelligente ResellTracker',
        body: 'Le notifiche locali per promemoria vendite e allarmi giacenza sono attive al 100% (Zero costi server)!',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    return true;
  } catch (err) {
    console.error('Error sending test notification:', err);
    return false;
  }
}
