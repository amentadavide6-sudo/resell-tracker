# 📋 ResellTracker - Roadmap Funzionalità v1.1.0 (Pre-Lancio Pubblico)

Documento operativo delle nuove funzionalità e ottimizzazioni UX pianificate durante i 14 giorni di Closed Testing, da includere nella versione finale di produzione.

---

## 🎯 1. Le Tue Richieste (Priorità Assoluta)

### A. Cross-Listing Multi-Piattaforma (Selezione Multipla con 1 Tap)
* **Problema reale:** Attualmente per caricare un capo presente su Vinted ed eBay bisogna creare due articoli separati, duplicando foto, titolo, prezzo di acquisto e falsando il capitale investito (sembra che tu abbia speso il doppio per due capi diversi).
* **Soluzione UX:**
  - Nel modale di inserimento capo (*Aggiungi Articolo*), la barra delle piattaforme diventa a **selezione multipla (Multi-Select)**: puoi toccare contemporaneamente Vinted, Wallapop ed eBay con un tocco.
  - **1 solo capo fisico salvato:** L'articolo rappresenta il capo reale nel tuo armadio (il costo di acquisto viene contato una volta sola, mantenendo le metriche e il capitale fermo precisi al 100%).
  - **Badge multipli sulla scheda:** Nella lista dell'inventario il capo mostrerà i loghi di tutte le piattaforme su cui è attivo.
* **Killer Feature "Delist Assistant":** Quando l'articolo viene segnato come **Venduto**, l'utente sceglie semplicemente dove è stato venduto (es. Vinted), e l'app mostra un promemoria visivo immediato:  
  > *"🎉 Venduto su Vinted! Ricordati di rimuovere subito l'annuncio da Wallapop ed eBay per evitare doppie vendite e penalità dall'algoritmo."*

---

### B. Piattaforme Personalizzate Salvabili (Custom Platforms Manager)
* **Problema reale:** Oltre ai 4 giganti (Vinted, eBay, Wallapop, Subito), i reseller vendono su mercatini di nicchia (es. *Vestiaire Collective*, *Depop*, *Facebook Marketplace*, *Mercatino dell'Usato fisico*, *Etsy*).
* **Soluzione tecnica:**
  - Nella schermata del calcolatore/impostazioni, cliccando su "Personalizza" l'utente può inserire:
    - **Nome piattaforma** (es. "Vestiaire", "Mercatino Locale")
    - **Percentuale commissione** (es. 10%)
    - **Costo fisso per vendita** (es. 0,50 €)
    - **Icona / Colore personalizzato**
  - La piattaforma creata viene salvata nel database SQLite e appare stabilmente come chip selezionabile nella barra principale insieme alle altre.

---

### C. Risoluzione Tastiera Sovrapposta (Android Keyboard Avoiding View Dinamico)
* **Problema UX:** Quando si aprono i campi numerici in fondo allo schermo (es. spese di spedizione o imballaggio), la tastiera virtuale di Android copre il campo e impedisce di vedere cosa si sta digitando.
* **Soluzione tecnica:**
  - Implementazione di `KeyboardAvoidingView` con `behavior="padding"` o `behavior="height"` calibrato per Android.
  - Aggiunta di `keyboardShouldPersistTaps="handled"` e `contentContainerStyle={{ paddingBottom: ... }}` con scroll automatico sul campo attivo (`react-native-keyboard-aware-scroll-view` o logica nativa Expo).
  - Assicura che ogni volta che l'utente tocca un campo, la schermata scorra automaticamente verso l'alto lasciando il campo visibile sopra i tasti.

---

## 💡 2. Nuove Idee a Valore Aggiunto (Crescita & Virilità)

### D. Internazionalizzazione Completa i18n (Inglese, Francese, Tedesco, Spagnolo) 🌍
* **Perché è una miniera d'oro:**
  - **Francia:** È il mercato #1 al mondo per Vinted (oltre 23 milioni di utenti francesi registrati!).
  - **Germania:** Mercato immenso per Vinted.de ed eBay Kleinanzeigen con potere d'acquisto elevatissimo.
  - **Regno Unito / USA:** Mercato anglofono globale per eBay e Depop.
  - **Spagna:** Patria di Wallapop.
* **Soluzione tecnica:**
  - Architettura `src/i18n/` con dizionari tipizzati in TypeScript (`it.ts`, `en.ts`, `fr.ts`, `de.ts`, `es.ts`).
  - Rilevamento automatico della lingua dello smartphone tramite `expo-localization`. Se il telefono è impostato in francese, l'app si apre magicamente in francese; se in tedesco, in tedesco; fallback in inglese per il resto del mondo.
  - Traduzione delle schede di Google Play Store (titoli e descrizioni localizzate per moltiplicare i download organici europei).

### E. "Social Proof Card" (Condividi il Guadagno con 1 Tap) 🚀
* **Idea:** Quando un venditore segna un capo come "Venduto" con un buon margine (es. profitto +30 € o ROI +150%), un pulsante permette di generare una grafica attraente formato storia Instagram / TikTok / Reddit:
  > *"Acquistato a 10 € ➔ Venduto a 45 € | Guadagno Netto: +31,50 € (ROI +315%) 📈 Calcolato con ResellTracker"*
* **Perché è micidiale:** I reseller adorano mostrare i propri affari sui social. Ogni storia condivisa porta **download organici gratuiti** di altri venditori senza spendere un centesimo in pubblicità!

---

### F. Gamification "Taste of Pro" (Pro Pass Temporaneo a ogni Level Up) ⚡🎁
* **Idea:** Quando un utente Free sale di livello nel *Reseller Club* (es. da Legno a Bronzo, da Bronzo ad Argento), riceve un **Pro Pass Temporaneo** (24-48 ore di accesso Pro completo).
* **Perché è una mossa da manuale (Product-Led Growth):**
  - **Dopamina e Gratificazione:** Il cambio di livello non è solo un numeretto estetico, ma un premio tangibile e immediato.
  - **Educazione alla funzione Pro:** Molti utenti non comprano il Pro perché non ne comprendono il valore reale finché non lo provano. Durante il pass possono esportare CSV illimitati, gestire capi oltre la soglia free e provare tutte le comodità avanzate.
  - **Psicologia della "Loss Aversion" (Paura di perdere il beneficio):** Duolingo e Spotify usano esattamente questo trucco. Una volta che l'utente si è abituato al comfort del Pro, allo scadere del timer (con countdown visibile: *"⚡ Pro Pass attivo: 18h rimaste"*), la notifica di scadenza converte ad altissimo tasso verso l'abbonamento o il lifetime a 5,99 €.
* **Taratura delle durate:**
  - *Livello 2 (Bronzo):* **24 ore** di Pro Pass (raggiungibile nei primi 2 giorni, crea il primo shock positivo).
  - *Livello 3 (Argento):* **24 ore** di Pro Pass.
  - *Livello 4 (Oro I):* **48 ore** di Pro Pass.
  - *Livello 5+ (Oro II, Platino...):* **48-72 ore** di Pro Pass.

---

### G. Filtro Rapido per Piattaforma nell'Inventario
* Nella schermata *I Miei Capi*, aggiungere oltre ai filtri di stato (*In Vendita / Venduti / Bozze*) anche un filtro per piattaforma (es. *"Mostrami solo cosa ho attivo su Vinted"* o *"Cosa ho venduto su eBay"*).
* Permette di fare l'inventario fisico dell'armadio in 2 minuti.

---

### H. Preset Rapidi Spedizioni Nazionali
* Molti venditori alle prime armi non sanno quanto costa una spedizione con Poste/InPost/BRT.
* Inserire dei preset rapidi con 1 tap (es. *"InPost Punto Ritiro: 3,50 €"*, *"Pacco Piccolo Poste: 5,90 €"*).
