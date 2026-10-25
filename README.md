# 📦 ResellTracker

**L'assistente tascabile per chi vende online su Vinted, eBay, Wallapop, Subito e Depop.**

Un'applicazione mobile Local-First (zero costi server) per calcolare istantaneamente margini netti, gestire l'inventario ed evitare di perdere soldi con le commissioni delle piattaforme di compravendita.

---

## 🚀 Come provare l'app sul tuo telefono (in 1 minuto)

Non serve installare Android Studio o emulatori pesanti:

1. Installa l'app gratuita **Expo Go** dal **Google Play Store** sul tuo smartphone Android.
2. Apri un terminale nella cartella del progetto:
   ```bash
   cd "resell-tracker"
   npx expo start
   ```
3. Inquadra il **QR Code** che compare sul terminale con la fotocamera del tuo telefono (o dall'interno dell'app Expo Go).
4. L'app si aprirà e potrai provarla dal vivo mentre modifichiamo il codice!

---

## 🗺️ Roadmap dei 4 Sprint

- [x] **Sprint 1: Fondamenta & Calcolatore Commissioni (Completato)**
  - Motore di calcolo fee per Vinted, eBay, Wallapop, Subito.it, Depop e piattaforma personalizzata.
  - Calcolo istantaneo di: Profitto Netto Reale, Margine %, ROI %, Costo Compratore.
  - Grafico a barre proporzionale della distribuzione (Costo d'acquisto, Fee, Spedizione, Guadagno).
  - Scheletro di navigazione a 4 tab (Calcolatore, Inventario, Statistiche, Impostazioni).
  
- [x] **Sprint 2: Gestione Inventario & Database Locale (SQLite) (Completato)**
  - Database locale 100% offline con `expo-sqlite`.
  - Scatto foto o selezione dalla galleria con `expo-image-picker`.
  - Ricerca istantanea e filtri: *Tutti*, *In Vendita*, *Venduti*, *Bozze*.
  - KPI in tempo reale: Numero capi attivi, Capitale fermo in giacenza e Profitto potenziale.
  - Funzione "Segna come Venduto" con aggiornamento automatico dello storico.
  - Connessione diretta: dal Calcolatore puoi salvare l'articolo calcolato con 1 tap nell'inventario.

- [x] **Sprint 3: Statistiche & Esportazione Dati (Completato)**
  - Dashboard finanziaria avanzata: Profitto Netto Incassato, Ricavi lordi, Margine Medio % e ROI.
  - Monitoraggio capitale: Valore della merce ferma in giacenza e profitto potenziale stimato.
  - Analisi comparativa per piattaforma con barre grafiche e indicazione della piattaforma n° 1.
  - Cronologia mensile automatica delle vendite.
  - Esportatore del Registro Vendite in formato CSV/Excel (con formattazione europea e supporto UTF-8).

- [x] **Sprint 4: Monetizzazione & Google Play Store (Completato)**
  - Modello Freemium con "ResellTracker Pro" a 3,49 € una tantum (No abbonamenti).
  - Limite di 15 capi per il tier gratuito con sblocco automatico illimitato per utenti Pro.
  - Banner Google AdMob per utenti Free (disattivato al 100% per utenti Pro).
  - Configurazione ufficiale Android (`com.reselltracker.app`) in `app.json`.
  - Configurazione EAS Build per la generazione del pacchetto `.apk` e del bundle finale `.aab`.
  - Kit completo per la pubblicazione su Google Play Store (`STORE_LISTING.md` e `PRIVACY_POLICY.md`).

---

## 🛠️ Stack Tecnologico
- **Framework**: React Native (Expo SDK 58) + TypeScript
- **Stile & UI**: Componenti modulari reattivi con supporto Safe-Area
- **Architettura**: 100% Local-First (Costo server: 0,00 €)
