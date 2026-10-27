const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const storeDir = path.join(__dirname, '..', 'store-listing');
const desktopDir = 'C:\\Users\\damen\\Desktop';

if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

// Helper to create screenshot SVG
function createScreenshotSvg({
  tagline,
  title,
  screenContentSvg
}) {
  return `
<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#050811" />
      <stop offset="40%" stop-color="#0B132B" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Emerald Ambient Glow -->
    <radialGradient id="topGlow" cx="50%" cy="15%" r="45%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.25" />
      <stop offset="60%" stop-color="#059669" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#10B981" />
    </linearGradient>

    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1E293B" />
      <stop offset="100%" stop-color="#0F172A" />
    </linearGradient>

    <filter id="phoneShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.8" />
      <feDropShadow dx="0" dy="6" stdDeviation="16" flood-color="#10B981" flood-opacity="0.2" />
    </filter>

    <clipPath id="phoneScreenClip">
      <rect x="90" y="440" width="900" height="1500" rx="48" />
    </clipPath>
  </defs>

  <!-- Background Canvas -->
  <rect width="1080" height="1920" fill="url(#bg)" />
  <rect width="1080" height="1920" fill="url(#topGlow)" />

  <!-- Subtle Grid Lines -->
  <g opacity="0.03" stroke="#FFFFFF" stroke-width="1.5">
    <line x1="0" y1="200" x2="1080" y2="200" />
    <line x1="0" y1="400" x2="1080" y2="400" />
    <line x1="270" y1="0" x2="270" y2="1920" />
    <line x1="540" y1="0" x2="540" y2="1920" />
    <line x1="810" y1="0" x2="810" y2="1920" />
  </g>

  <!-- HEADER TEXT ZONE (y: 60 to 380) -->
  <g transform="translate(540, 140)" text-anchor="middle">
    <!-- Tagline Badge -->
    <rect x="-180" y="0" width="360" height="44" rx="22" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1.5" />
    <text x="0" y="28" fill="#34D399" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="20" font-weight="800" letter-spacing="3">${tagline}</text>

    <!-- Main Title -->
    <text x="0" y="115" fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="52" font-weight="900" letter-spacing="-1">${title[0]}</text>
    <text x="0" y="180" fill="#E2E8F0" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="46" font-weight="800" letter-spacing="-0.5">${title[1]}</text>
  </g>

  <!-- PHONE FRAME (Outer Chassis) -->
  <g filter="url(#phoneShadow)">
    <!-- Titanium outer ring -->
    <rect x="80" y="430" width="920" height="1520" rx="56" fill="#0A0F1D" stroke="#334155" stroke-width="6" />
    <!-- Inner bezel border -->
    <rect x="86" y="436" width="908" height="1508" rx="50" fill="#0B132B" stroke="#1E293B" stroke-width="2" />
  </g>

  <!-- PHONE SCREEN CONTENT (Clipped) -->
  <g clip-path="url(#phoneScreenClip)">
    <!-- Screen Base Dark Background -->
    <rect x="90" y="440" width="900" height="1500" fill="#0B0F19" />

    <!-- Status Bar (09:41, WiFi, 100%) -->
    <g transform="translate(130, 480)" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="22" font-weight="600">
      <text x="0" y="0">09:41</text>
      <!-- Battery icon -->
      <rect x="760" y="-18" width="46" height="24" rx="6" fill="none" stroke="#94A3B8" stroke-width="2.5" />
      <rect x="764" y="-14" width="34" height="16" rx="3" fill="#10B981" />
      <rect x="807" y="-12" width="4" height="12" rx="2" fill="#94A3B8" />
    </g>

    <!-- Dynamic Island / Speaker notch -->
    <rect x="440" y="462" width="200" height="34" rx="17" fill="#020617" />
    <circle cx="600" cy="479" r="6" fill="#1E293B" />

    <!-- Specific Screen Content -->
    ${screenContentSvg}
  </g>
</svg>
`;
}

// 1. SCREENSHOT 1: CALCOLATORE COMMISSIONI
const screen1Content = `
  <!-- Screen Header -->
  <g transform="translate(130, 560)">
    <text x="0" y="0" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="800">Calcola Guadagno</text>
    <text x="0" y="32" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="500">Seleziona piattaforma e inserisci i prezzi</text>
  </g>

  <!-- Market Selector Tabs -->
  <g transform="translate(130, 630)">
    <!-- Vinted Tab (Active) -->
    <rect x="0" y="0" width="150" height="54" rx="16" fill="#10B981" />
    <text x="75" y="34" fill="#042F2E" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="800" text-anchor="middle">Vinted</text>

    <!-- eBay Tab -->
    <rect x="165" y="0" width="135" height="54" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <text x="232" y="34" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="19" font-weight="700" text-anchor="middle">eBay</text>

    <!-- Wallapop Tab -->
    <rect x="315" y="0" width="165" height="54" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <text x="397" y="34" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="19" font-weight="700" text-anchor="middle">Wallapop</text>

    <!-- Subito Tab -->
    <rect x="495" y="0" width="145" height="54" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <text x="567" y="34" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="19" font-weight="700" text-anchor="middle">Subito</text>

    <!-- Depop Tab -->
    <rect x="655" y="0" width="155" height="54" rx="16" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <text x="732" y="34" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="19" font-weight="700" text-anchor="middle">Depop</text>
  </g>

  <!-- Big Profit Hero Card -->
  <g transform="translate(130, 720)">
    <rect x="0" y="0" width="820" height="240" rx="28" fill="url(#cardGrad)" stroke="#10B981" stroke-width="2.5" />
    <circle cx="740" cy="80" r="110" fill="#10B981" fill-opacity="0.1" />

    <text x="44" y="56" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="800" letter-spacing="2">PROFITTO NETTO STIMATO</text>
    <text x="44" y="145" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="82" font-weight="900">+55,00 €</text>

    <!-- Pills inside hero -->
    <rect x="44" y="175" width="190" height="38" rx="12" fill="#10B981" fill-opacity="0.15" />
    <text x="139" y="200" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">Margine: +64.7%</text>

    <rect x="250" y="175" width="180" height="38" rx="12" fill="#38BDF8" fill-opacity="0.15" />
    <text x="340" y="200" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">ROI: +183.3%</text>
  </g>

  <!-- Input Fields Container -->
  <g transform="translate(130, 1000)">
    <!-- Prezzo Vendita -->
    <rect x="0" y="0" width="820" height="100" rx="20" fill="#131D31" stroke="#334155" stroke-width="1.5" />
    <text x="32" y="38" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Prezzo di Vendita Richiesto</text>
    <text x="32" y="76" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="30" font-weight="800">€ 85,00</text>
    <rect x="680" y="24" width="108" height="52" rx="14" fill="#1E293B" />
    <text x="734" y="56" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="middle">EUR €</text>

    <!-- Prezzo Acquisto -->
    <g transform="translate(0, 120)">
      <rect x="0" y="0" width="820" height="100" rx="20" fill="#131D31" stroke="#334155" stroke-width="1.5" />
      <text x="32" y="38" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Costo di Acquisto (Spesa)</text>
      <text x="32" y="76" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="30" font-weight="800">€ 30,00</text>
    </g>

    <!-- Spedizione / Commissione Piattaforma Breakdown -->
    <g transform="translate(0, 240)">
      <rect x="0" y="0" width="820" height="170" rx="20" fill="#131D31" stroke="#1E293B" stroke-width="1.5" />
      
      <text x="32" y="45" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="600">Commissione Venditore (0% su Vinted)</text>
      <text x="788" y="45" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="800" text-anchor="end">€ 0,00</text>
      <line x1="32" y1="65" x2="788" y2="65" stroke="#1E293B" stroke-width="1" />

      <text x="32" y="105" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="600">Protezione Acquisti (a carico acquirente)</text>
      <text x="788" y="105" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="700" text-anchor="end">€ 5,10</text>
      <line x1="32" y1="125" x2="788" y2="125" stroke="#1E293B" stroke-width="1" />

      <text x="32" y="152" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="500">Totale pagato dall'acquirente</text>
      <text x="788" y="152" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="700" text-anchor="end">€ 90,10</text>
    </g>
  </g>

  <!-- Big Emerald CTA Button -->
  <g transform="translate(130, 1450)">
    <rect x="0" y="0" width="820" height="80" rx="24" fill="url(#emeraldGrad)" />
    <text x="410" y="49" fill="#042F2E" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="900" text-anchor="middle">+ AGGIUNGI ALL'INVENTARIO</text>
  </g>
`;

// 2. SCREENSHOT 2: GESTIONE INVENTARIO & STATO VENDUTO
const screen2Content = `
  <!-- Screen Header -->
  <g transform="translate(130, 560)">
    <text x="0" y="0" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="800">Il Tuo Inventario</text>
    <text x="0" y="32" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="500">24 articoli gestiti · Valore stock: 1.840 €</text>
  </g>

  <!-- Filter Pills -->
  <g transform="translate(130, 630)">
    <rect x="0" y="0" width="160" height="46" rx="14" fill="#10B981" />
    <text x="80" y="29" fill="#042F2E" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="800" text-anchor="middle">Tutti (24)</text>

    <rect x="175" y="0" width="180" height="46" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <text x="265" y="29" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="700" text-anchor="middle">In Vendita (18)</text>

    <rect x="370" y="0" width="160" height="46" rx="14" fill="#1E293B" stroke="#334155" stroke-width="1.5" />
    <text x="450" y="29" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="700" text-anchor="middle">Venduti (6)</text>
  </g>

  <!-- Item Card 1 (Active) -->
  <g transform="translate(130, 710)">
    <rect x="0" y="0" width="820" height="210" rx="24" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <!-- Photo thumbnail placeholder -->
    <rect x="20" y="20" width="170" height="170" rx="18" fill="#131D31" stroke="#334155" stroke-width="1" />
    <circle cx="105" cy="90" r="30" fill="#10B981" fill-opacity="0.2" />
    <text x="105" y="98" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="28" font-weight="900" text-anchor="middle">👟</text>
    <text x="105" y="150" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">FOTO HD</text>

    <!-- Details -->
    <text x="215" y="55" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="800">Nike Dunk Low Panda (42)</text>
    <rect x="215" y="70" width="85" height="26" rx="8" fill="#0EA5E9" fill-opacity="0.2" />
    <text x="257" y="88" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">VINTED</text>

    <text x="215" y="130" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Costo: € 45 · Prezzo: € 115</text>
    <text x="215" y="172" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="900">Profitto: +€ 70,00</text>

    <!-- Mark Sold Button -->
    <rect x="640" y="130" width="160" height="54" rx="16" fill="#10B981" />
    <text x="720" y="163" fill="#042F2E" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="800" text-anchor="middle">VENDUTO ✓</text>
  </g>

  <!-- Item Card 2 (Active) -->
  <g transform="translate(130, 945)">
    <rect x="0" y="0" width="820" height="210" rx="24" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <!-- Photo thumbnail placeholder -->
    <rect x="20" y="20" width="170" height="170" rx="18" fill="#131D31" stroke="#334155" stroke-width="1" />
    <circle cx="105" cy="90" r="30" fill="#6366F1" fill-opacity="0.2" />
    <text x="105" y="98" fill="#818CF8" font-family="-apple-system, system-ui, sans-serif" font-size="28" font-weight="900" text-anchor="middle">🧥</text>
    <text x="105" y="150" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700" text-anchor="middle">FOTO HD</text>

    <!-- Details -->
    <text x="215" y="55" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="800">Bomber Carhartt Detroit (L)</text>
    <rect x="215" y="70" width="75" height="26" rx="8" fill="#F59E0B" fill-opacity="0.2" />
    <text x="252" y="88" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">EBAY</text>

    <text x="215" y="130" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Costo: € 30 · Prezzo: € 95</text>
    <text x="215" y="172" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="900">Profitto: +€ 53,20</text>

    <!-- Mark Sold Button -->
    <rect x="640" y="130" width="160" height="54" rx="16" fill="#10B981" />
    <text x="720" y="163" fill="#042F2E" font-family="-apple-system, system-ui, sans-serif" font-size="17" font-weight="800" text-anchor="middle">VENDUTO ✓</text>
  </g>

  <!-- Item Card 3 (Sold) -->
  <g transform="translate(130, 1180)">
    <rect x="0" y="0" width="820" height="190" rx="24" fill="#0B132B" stroke="#1E293B" stroke-width="1.5" opacity="0.85" />
    <rect x="20" y="20" width="150" height="150" rx="16" fill="#131D31" />
    <text x="95" y="105" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="900" text-anchor="middle">✓</text>

    <text x="195" y="55" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="22" font-weight="800">Felpa Stussy Basic Logo</text>
    <rect x="195" y="70" width="125" height="26" rx="8" fill="#10B981" fill-opacity="0.2" />
    <text x="257" y="88" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="800" text-anchor="middle">VENDUTO VINTED</text>

    <text x="195" y="135" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="22" font-weight="900">Incassato Netto: +€ 38,00</text>
  </g>

  <!-- Floating Add Button -->
  <g transform="translate(810, 1420)">
    <circle cx="50" cy="50" r="50" fill="url(#emeraldGrad)" />
    <text x="50" y="65" fill="#042F2E" font-family="-apple-system, system-ui, sans-serif" font-size="44" font-weight="900" text-anchor="middle">+</text>
  </g>
`;

// 3. SCREENSHOT 3: RESELLER CLUB & STATISTICHE
const screen3Content = `
  <!-- Screen Header -->
  <g transform="translate(130, 560)">
    <text x="0" y="0" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="800">Reseller Club &amp; Statistiche</text>
    <text x="0" y="32" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="500">I tuoi progressi e metriche di vendita</text>
  </g>

  <!-- Gamification / Club Hero Card -->
  <g transform="translate(130, 630)">
    <rect x="0" y="0" width="820" height="260" rx="28" fill="url(#cardGrad)" stroke="#10B981" stroke-width="2.5" />
    <circle cx="740" cy="110" r="100" fill="#10B981" fill-opacity="0.12" />

    <!-- Badge Rank -->
    <rect x="36" y="36" width="180" height="36" rx="10" fill="#10B981" fill-opacity="0.2" />
    <text x="126" y="60" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="900" text-anchor="middle">👑 TOP SELLER</text>

    <!-- 2x XP Booster badge -->
    <rect x="230" y="36" width="160" height="36" rx="10" fill="#F59E0B" fill-opacity="0.2" />
    <text x="310" y="60" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="800" text-anchor="middle">⚡ 2x XP ATTIVO</text>

    <text x="36" y="125" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="36" font-weight="900">Livello 4: 1.850 XP</text>
    <text x="36" y="160" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="600">Prossimo traguardo: Reseller Mogul (2.500 XP)</text>

    <!-- Progress Bar -->
    <rect x="36" y="195" width="748" height="20" rx="10" fill="#0B132B" stroke="#334155" stroke-width="1" />
    <rect x="36" y="195" width="550" height="20" rx="10" fill="url(#emeraldGrad)" />
  </g>

  <!-- 4 Stat Cards Grid -->
  <g transform="translate(130, 920)">
    <!-- Profitto Netto Totale -->
    <rect x="0" y="0" width="395" height="150" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <text x="28" y="42" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Profitto Totale</text>
    <text x="28" y="94" fill="#10B981" font-family="-apple-system, system-ui, sans-serif" font-size="38" font-weight="900">+1.480 €</text>
    <text x="28" y="128" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700">▲ +28% questo mese</text>

    <!-- Articoli Venduti -->
    <rect x="425" y="0" width="395" height="150" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <text x="453" y="42" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Capi Venduti</text>
    <text x="453" y="94" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="38" font-weight="900">42 pezzi</text>
    <text x="453" y="128" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700">Su Vinted ed eBay</text>

    <!-- Margine Medio -->
    <g transform="translate(0, 175)">
      <rect x="0" y="0" width="395" height="150" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
      <text x="28" y="42" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">Margine Medio</text>
      <text x="28" y="94" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="38" font-weight="900">58.4%</text>
      <text x="28" y="128" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700">Molto Redditizio</text>
    </g>

    <!-- ROI Medio -->
    <g transform="translate(425, 175)">
      <rect x="0" y="0" width="395" height="150" rx="20" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
      <text x="28" y="42" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="600">ROI Medio</text>
      <text x="28" y="94" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-size="38" font-weight="900">142%</text>
      <text x="28" y="128" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="700">Ritorno su Spesa</text>
    </g>
  </g>

  <!-- Trend Bar Chart Card -->
  <g transform="translate(130, 1275)">
    <rect x="0" y="0" width="820" height="230" rx="24" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <text x="32" y="45" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="800">Andamento Vendite Mensili</text>

    <!-- Bars -->
    <g transform="translate(60, 80)">
      <!-- Jan -->
      <rect x="0" y="70" width="70" height="40" rx="8" fill="#1E293B" />
      <text x="35" y="130" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">MAG</text>

      <!-- Feb -->
      <rect x="120" y="45" width="70" height="65" rx="8" fill="#1E293B" />
      <text x="155" y="130" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">GIU</text>

      <!-- Mar -->
      <rect x="240" y="30" width="70" height="80" rx="8" fill="#10B981" fill-opacity="0.5" />
      <text x="275" y="130" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="600" text-anchor="middle">LUG</text>

      <!-- Apr -->
      <rect x="360" y="10" width="70" height="100" rx="8" fill="#10B981" />
      <text x="395" y="130" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">AGO</text>

      <!-- May -->
      <rect x="480" y="0" width="70" height="110" rx="8" fill="url(#emeraldGrad)" />
      <text x="515" y="130" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">SET</text>

      <!-- Jun -->
      <rect x="600" y="-15" width="70" height="125" rx="8" fill="url(#emeraldGrad)" />
      <text x="635" y="130" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="14" font-weight="800" text-anchor="middle">OTT</text>
    </g>
  </g>
`;

// 4. SCREENSHOT 4: 100% OFFLINE & PRIVACY FIRST
const screen4Content = `
  <!-- Screen Header -->
  <g transform="translate(130, 560)">
    <text x="0" y="0" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="34" font-weight="800">Privacy &amp; Backup</text>
    <text x="0" y="32" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="500">I tuoi dati sono protetti e sotto il tuo controllo</text>
  </g>

  <!-- Big Shield Card -->
  <g transform="translate(130, 630)">
    <rect x="0" y="0" width="820" height="280" rx="28" fill="url(#cardGrad)" stroke="#10B981" stroke-width="2" />
    <circle cx="410" cy="90" r="50" fill="#10B981" fill-opacity="0.15" />
    <text x="410" y="105" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="44" font-weight="900" text-anchor="middle">🛡️</text>

    <text x="410" y="175" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="28" font-weight="900" text-anchor="middle">100% Locale &amp; Offline First</text>
    <text x="410" y="215" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="500" text-anchor="middle">Nessun server esterno. Nessuna registrazione.</text>
    <text x="410" y="245" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="18" font-weight="500" text-anchor="middle">Tutto salvato in SQLite direttamente sul dispositivo.</text>
  </g>

  <!-- Export CSV Card -->
  <g transform="translate(130, 940)">
    <rect x="0" y="0" width="820" height="220" rx="24" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <text x="40" y="55" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="800">Esporta Inventario in Excel / CSV</text>
    <text x="40" y="90" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="500">Scarica il foglio di calcolo completo con foto e margini</text>

    <rect x="40" y="125" width="740" height="65" rx="18" fill="#1E293B" stroke="#10B981" stroke-width="1.5" />
    <text x="410" y="165" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="800" text-anchor="middle">📊 SCARICA FOGLIO CSV</text>
  </g>

  <!-- Multi Market Card -->
  <g transform="translate(130, 1190)">
    <rect x="0" y="0" width="820" height="270" rx="24" fill="url(#cardGrad)" stroke="#334155" stroke-width="1.5" />
    <text x="40" y="55" fill="#FFFFFF" font-family="-apple-system, system-ui, sans-serif" font-size="24" font-weight="800">5 Mercatini Supportati Ufficialmente</text>
    <text x="40" y="90" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="500">Algoritmi sempre aggiornati alle ultime tariffe 2026</text>

    <!-- Pills Grid -->
    <g transform="translate(40, 125)">
      <rect x="0" y="0" width="135" height="44" rx="12" fill="#131D31" stroke="#334155" stroke-width="1" />
      <text x="67" y="28" fill="#38BDF8" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">Vinted</text>

      <rect x="150" y="0" width="135" height="44" rx="12" fill="#131D31" stroke="#334155" stroke-width="1" />
      <text x="217" y="28" fill="#FBBF24" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">eBay</text>

      <rect x="300" y="0" width="135" height="44" rx="12" fill="#131D31" stroke="#334155" stroke-width="1" />
      <text x="367" y="28" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">Wallapop</text>

      <rect x="450" y="0" width="135" height="44" rx="12" fill="#131D31" stroke="#334155" stroke-width="1" />
      <text x="517" y="28" fill="#FB7185" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">Subito</text>

      <rect x="600" y="0" width="135" height="44" rx="12" fill="#131D31" stroke="#334155" stroke-width="1" />
      <text x="667" y="28" fill="#C084FC" font-family="-apple-system, system-ui, sans-serif" font-size="16" font-weight="800" text-anchor="middle">Depop</text>
    </g>

    <text x="410" y="225" fill="#64748B" font-family="-apple-system, system-ui, sans-serif" font-size="15" font-weight="600" text-anchor="middle">Calcolo tariffe venditore e acquirente sempre sincronizzato</text>
  </g>
`;

const screenshotsConfig = [
  {
    fileName: 'screenshot-1-calcolatore.png',
    tagline: 'CALCOLATORE INTELLIGENTE',
    title: ['CALCOLA IL VERO', 'GUADAGNO NETTO'],
    screenContentSvg: screen1Content,
  },
  {
    fileName: 'screenshot-2-inventario.png',
    tagline: 'GESTIONE STOCK &amp; FOTO',
    title: ['ORGANIZZA TUTTO', 'IL TUO INVENTARIO'],
    screenContentSvg: screen2Content,
  },
  {
    fileName: 'screenshot-3-statistiche.png',
    tagline: 'GAMIFICATION &amp; METRICHE',
    title: ['SCALA I LIVELLI', '&amp; TRACCIA I RICAVI'],
    screenContentSvg: screen3Content,
  },
  {
    fileName: 'screenshot-4-offline.png',
    tagline: 'PRIVACY &amp; ZERO SERVER',
    title: ['100% OFFLINE', '&amp; EXPORT IN EXCEL'],
    screenContentSvg: screen4Content,
  },
];

async function generateScreenshots() {
  console.log('Generating Play Store screenshots (1080x1920)...');

  for (const item of screenshotsConfig) {
    const svg = createScreenshotSvg(item);
    const storePath = path.join(storeDir, item.fileName);
    const desktopPath = path.join(desktopDir, item.fileName);

    const buffer = await sharp(Buffer.from(svg))
      .png({ quality: 100, compressionLevel: 8 })
      .toBuffer();

    fs.writeFileSync(storePath, buffer);
    fs.writeFileSync(desktopPath, buffer);

    console.log(`✓ Generated ${item.fileName} -> Desktop & store-listing/`);
  }

  console.log('🎉 All 4 screenshots generated successfully!');
}

generateScreenshots().catch(err => {
  console.error('Error generating screenshots:', err);
  process.exit(1);
});
