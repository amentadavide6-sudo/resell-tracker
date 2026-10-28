import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getAllInventoryItems, getDatabase } from './db';
import { getSavedLanguage } from '../i18n';

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

    const lang = getSavedLanguage();
    const texts = {
      it: {
        title: '⚡ Notifica Intelligente ResellTracker',
        body: 'Le notifiche locali per promemoria vendite e allarmi giacenza sono attive al 100% (Zero costi server)!',
      },
      en: {
        title: '⚡ ResellTracker Smart Alert',
        body: 'Local notifications for sales reminders and stock alerts are fully active!',
      },
      fr: {
        title: '⚡ Notification Intelligente ResellTracker',
        body: 'Les notifications locales pour le rappel des ventes et alertes stock sont actives !',
      },
      es: {
        title: '⚡ Notificación Inteligente ResellTracker',
        body: '¡Las notificaciones locales de ventas y alertas de stock están activas!',
      },
      de: {
        title: '⚡ Smarte ResellTracker-Benachrichtigung',
        body: 'Lokale Benachrichtigungen für Verkaufs- und Bestandserinnerungen sind aktiv!',
      },
    };

    const notif = texts[lang] || texts.it;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: notif.title,
        body: notif.body,
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

export async function sendDac7PushNotification(
  status: 'warning' | 'exceeded',
  count: number,
  revenue: number
): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const lang = getSavedLanguage();
    const isExceeded = status === 'exceeded';

    const dac7Texts = {
      it: {
        exceededTitle: '🚨 SOGLIA FISCALE DAC7 RAGGIUNTA!',
        warningTitle: '⚠️ AVVISO: Ti stai avvicinando alla soglia DAC7!',
        exceededBody: `Hai raggiunto ${count} vendite o ${revenue.toFixed(2)} € quest'anno. I dati verranno comunicati al fisco.`,
        warningBody: `Sei a quota ${count} vendite / ${revenue.toFixed(2)} € (soglia annua: 30 vendite o 2.000 €).`,
      },
      en: {
        exceededTitle: '🚨 DAC7 FISCAL THRESHOLD REACHED!',
        warningTitle: '⚠️ NOTICE: Approaching DAC7 Threshold!',
        exceededBody: `You reached ${count} sales or €${revenue.toFixed(2)} this year. Data will be reported to tax authorities.`,
        warningBody: `You are at ${count} sales / €${revenue.toFixed(2)} (annual threshold: 30 sales or €2,000).`,
      },
      fr: {
        exceededTitle: '🚨 SEUIL FISCAL DAC7 ATTEINT !',
        warningTitle: '⚠️ AVERTISSEMENT : Proche du seuil DAC7 !',
        exceededBody: `Vous avez atteint ${count} ventes ou ${revenue.toFixed(2)} € cette année. Les plateformes déclareront vos revenus.`,
        warningBody: `Vous êtes à ${count} ventes / ${revenue.toFixed(2)} € (seuil annuel : 30 ventes ou 2 000 €).`,
      },
      es: {
        exceededTitle: '🚨 ¡LÍMITE FISCAL DAC7 ALCANZADO!',
        warningTitle: '⚠️ AVISO: ¡Cerca del límite DAC7!',
        exceededBody: `Has alcanzado ${count} ventas o ${revenue.toFixed(2)} € este año. Las plataformas reportarán tus datos.`,
        warningBody: `Llevas ${count} ventas / ${revenue.toFixed(2)} € (límite anual: 30 ventas o 2.000 €).`,
      },
      de: {
        exceededTitle: '🚨 DAC7-STEUERSCHWELLE ERREICHT!',
        warningTitle: '⚠️ HINWEIS: Annäherung an DAC7-Schwelle!',
        exceededBody: `Sie haben dieses Jahr ${count} Verkäufe oder ${revenue.toFixed(2)} € erreicht. Plattformen melden die Daten.`,
        warningBody: `Sie haben ${count} Verkäufe / ${revenue.toFixed(2)} € erreicht (Schwelle: 30 Verkäufe oder 2.000 €).`,
      },
    };

    const notif = dac7Texts[lang] || dac7Texts.it;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: isExceeded ? notif.exceededTitle : notif.warningTitle,
        body: isExceeded ? notif.exceededBody : notif.warningBody,
        sound: true,
        data: { screen: 'stats' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
      },
    });
  } catch (err) {
    console.error('Error triggering DAC7 notification:', err);
  }
}
