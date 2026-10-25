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
  
- [ ] **Sprint 2: Gestione Inventario & Database Locale (SQLite)**
  - Salvataggio offline con `expo-sqlite`.
  - Scatto/selezione foto compresse (`expo-image-picker`).
  - Gestione stato articoli: *Bozza ➔ In Vendita ➔ Spedito ➔ Venduto*.

- [ ] **Sprint 3: Statistiche & Esportazione Dati**
  - Grafici di profitto mensile.
  - Calcolo capitale fermo in merce invenduta.
  - Esportazione report in formato CSV / Excel.

- [ ] **Sprint 4: Monetizzazione & Google Play Store**
  - Integrazione acquisti in-app (Sblocco Pro Lifetime).
  - Banner pubblicitari AdMob non invasivi.
  - Generazione bundle `.aab` per la pubblicazione su Google Play.

---

## 🛠️ Stack Tecnologico
- **Framework**: React Native (Expo SDK 58) + TypeScript
- **Stile & UI**: Componenti modulari reattivi con supporto Safe-Area
- **Architettura**: 100% Local-First (Costo server: 0,00 €)
