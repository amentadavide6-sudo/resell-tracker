# 📋 ResellTracker - Roadmap Funzionalità v1.1.0 (Pre-Lancio Pubblico)

Documento operativo delle nuove funzionalità e ottimizzazioni UX pianificate durante i 14 giorni di Closed Testing, da includere nella versione finale di produzione.

---

## 🎯 1. Le Tue Richieste (Priorità Assoluta)

### A. Cross-Listing Multi-Piattaforma (Stesso Capo su Più Mercatini)
* **Problema reale:** I venditori mettono in vendita lo stesso articolo contemporaneamente su più canali (es. Vinted + Wallapop + eBay) per massimizzare la visibilità e vendere più in fretta.
* **Soluzione tecnica:**
  - Nel modale di inserimento capo, trasformare la selezione della piattaforma in una scelta multipla (es. checkbox o chip selezionabili insieme).
  - Possibilità di definire prezzi di listino specifici per piattaforma (es. 25€ su Vinted dove non ci sono commissioni venditore, 28€ su eBay per compensare le fee).
* **Killer Feature "Delist Assistant":** Quando l'articolo viene segnato come **Venduto** su una piattaforma (es. Vinted), l'app mostra un promemoria visivo immediato:  
  > *"🎉 Venduto su Vinted! Ricordati di rimuovere l'annuncio da Wallapop ed eBay per evitare doppie vendite e penalità dall'algoritmo."*

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

### D. "Social Proof Card" (Condividi il Guadagno con 1 Tap) 🚀
* **Idea:** Quando un venditore segna un capo come "Venduto" con un buon margine (es. profitto +30 € o ROI +150%), un pulsante permette di generare una grafica attraente formato storia Instagram / TikTok / Reddit:
  > *"Acquistato a 10 € ➔ Venduto a 45 € | Guadagno Netto: +31,50 € (ROI +315%) 📈 Calcolato con ResellTracker"*
* **Perché è micidiale:** I reseller adorano mostrare i propri affari sui social. Ogni storia condivisa porta **download organici gratuiti** di altri venditori senza spendere un centesimo in pubblicità!

---

### E. Filtro Rapido per Piattaforma nell'Inventario
* Nella schermata *I Miei Capi*, aggiungere oltre ai filtri di stato (*In Vendita / Venduti / Bozze*) anche un filtro per piattaforma (es. *"Mostrami solo cosa ho attivo su Vinted"* o *"Cosa ho venduto su eBay"*).
* Permette di fare l'inventario fisico dell'armadio in 2 minuti.

---

### F. Preset Rapidi Spedizioni Nazionali
* Molti venditori alle prime armi non sanno quanto costa una spedizione con Poste/InPost/BRT.
* Inserire dei preset rapidi con 1 tap (es. *"InPost Punto Ritiro: 3,50 €"*, *"Pacco Piccolo Poste: 5,90 €"*).
