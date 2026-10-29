# 🚀 Guida & Checklist Definitiva: Lancio Google Play Store & Pagamenti In-App

Questo documento è salvato in modo permanente nel repository del progetto per guidarti passo dopo passo quando deciderai di pubblicare **ResellTracker** su Google Play Console e attivare i pagamenti reali con carta di credito.

---

## 📌 Riepilogo Architettura Pagamenti
* **Prezzo Lifetime Pro**: 5,99 € una tantum (ID Prodotto: `reselltracker_pro_lifetime`)
* **Prezzo Mensile (opzionale)**: 1,99 € / mese (ID Prodotto: `reselltracker_pro_monthly`)
* **Libreria Integrata**: `react-native-purchases` (RevenueCat v10.16.0)
* **Persistenza Locale**: Database SQLite (tabella `user_settings` con chiave `is_pro`)
* **Ripristino Acquisti**: Già integrato nel codice per rispettare le linee guida di Google

---

## 📋 Fase 1: Creazione Account Google Play Console (Una Tantum)
1. Vai su [Google Play Console](https://play.google.com/console/signup).
2. Paga la quota una tantum di 25$ per aprire l'account sviluppatore Google a vita.
3. Completa la verifica dell'identità (documento d'identità e dati fiscali/bancari per ricevere i bonifici delle vendite).

---

## 📋 Fase 2: Configurazione dei Prodotti In-App su Play Console
1. Crea una nuova applicazione: **ResellTracker**.
2. Carica il file bundle `.aab` (scaricabile dalla nostra release GitHub) nella traccia **Test Chiuso** o **Test Interno**.
3. Nel menu laterale, vai su **Monetizzazione** ➔ **Prodotti in-app**:
   * Clicca su **Crea prodotto**.
   * **ID prodotto**: `reselltracker_pro_lifetime`
   * **Nome**: `ResellTracker Pro a Vita`
   * **Prezzo**: `5,99 €`
   * Clicca su **Salva** e poi su **Attiva**.
4. (Opzionale) Sotto **Abbonamenti**:
   * **ID abbonamento**: `reselltracker_pro_monthly`
   * **Prezzo**: `1,99 € / mese`

---

## 📋 Fase 3: Collegamento RevenueCat (Zero Server)
1. Registrati gratuitamente su [RevenueCat](https://app.revenuecat.com/).
2. Crea il progetto **ResellTracker**.
3. Aggiungi la tua app Android con package name: `com.reselltracker.app`.
4. Collega le credenziali Service Account di Google Cloud Console.
5. In **Entitlements**, crea un entitlement chiamato `pro` e associagli i prodotti `reselltracker_pro_lifetime` e `reselltracker_pro_monthly`.
6. Copia la tua **Public Android API Key** (inizia con `goog_...`).
7. Incolla la chiave in `src/services/purchaseService.ts` alla riga:
   ```typescript
   export const REVENUECAT_GOOGLE_API_KEY = 'goog_TUA_CHIAVE_REALE';
   ```

---

## 🧪 Fase 4: Collaudo a Rischio Zero (Test con Account Licenza)
*Prima di rendere pubblica l'app, testerai l'acquisto con una carta finta fornita da Google:*
1. Nella Play Console, vai su **Impostazioni account** ➔ **Test delle licenze**.
2. Inserisci il tuo indirizzo Gmail personale nella lista dei tester con licenza.
3. Installa l'app sul tuo telefono.
4. Premi *"Sblocca a 5,99 €"*: si aprirà il pop-up ufficiale di Google Play con la dicitura:  
   *💳 "Strumento di test licenza — Metodo di pagamento di test (addebito 0,00 €)"*.
5. Conferma con l'impronta: vedrai l'app sbloccarsi istantaneamente in versione Pro!

---

## 📱 Risorse Grafiche e Privacy Policy Già Pronti
* **Privacy Policy Online**: `https://amentadavide6-sudo.github.io/resell-tracker/` (già live e conforme GDPR).
* **Icona Ufficiale Alta Risoluzione**: 512x512 PNG salvata nella cartella `assets/icon.png`.
* **Feature Graphic Google Play**: 1024x500 PNG pronta per la scheda dello store.
