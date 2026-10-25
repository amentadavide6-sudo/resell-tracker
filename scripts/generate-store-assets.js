const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const storeDir = path.join(__dirname, '..', 'store-listing');
if (!fs.existsSync(storeDir)) {
  fs.mkdirSync(storeDir, { recursive: true });
}

// 1. Play Store Icon 512x512
// Generated directly from assets/icon.png resized to 512x512 with high quality Lanczos3
async function generateStoreIcon() {
  const iconSrc = path.join(__dirname, '..', 'assets', 'icon.png');
  const iconDest = path.join(storeDir, 'play-store-icon-512.png');
  await sharp(iconSrc)
    .resize(512, 512, { kernel: sharp.kernel.lanczos3 })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(iconDest);
  console.log('Generated 512x512 store icon at:', iconDest);
}

// 2. Play Store Feature Graphic 1024x500
// Deep obsidian/slate canvas with ambient emerald aura, 3D icon on left, typography & badge pills on right
const featureSvg = `
<svg width="1024" height="500" viewBox="0 0 1024 500" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B0F19" />
      <stop offset="50%" stop-color="#0F172A" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Radial Emerald Glow on Left -->
    <radialGradient id="emeraldGlow" cx="24%" cy="50%" r="55%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.25" />
      <stop offset="50%" stop-color="#059669" stop-opacity="0.08" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Subtle Indigo Ambient Glow on Right -->
    <radialGradient id="indigoGlow" cx="80%" cy="30%" r="45%">
      <stop offset="0%" stop-color="#6366F1" stop-opacity="0.12" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Tag Primary Gradient -->
    <linearGradient id="tagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <linearGradient id="titleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="70%" stop-color="#F1F5F9" />
      <stop offset="100%" stop-color="#34D399" />
    </linearGradient>

    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.65" />
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#10B981" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1024" height="500" fill="url(#bg)" />
  <rect width="1024" height="500" fill="url(#emeraldGlow)" />
  <rect width="1024" height="500" fill="url(#indigoGlow)" />

  <!-- Grid Accent Lines (Subtle Tech Texture) -->
  <g opacity="0.04" stroke="#FFFFFF" stroke-width="1">
    <line x1="0" y1="100" x2="1024" y2="100" />
    <line x1="0" y1="250" x2="1024" y2="250" />
    <line x1="0" y1="400" x2="1024" y2="400" />
    <line x1="200" y1="0" x2="200" y2="500" />
    <line x1="500" y1="0" x2="500" y2="500" />
    <line x1="800" y1="0" x2="800" y2="500" />
  </g>

  <!-- LEFT: Icon Emblem Group -->
  <g transform="translate(140, 160)" filter="url(#shadow)">
    <!-- Back secondary tag (stacked effect) -->
    <g transform="rotate(-8 90 90) translate(-14, 14)" opacity="0.4">
      <rect x="0" y="0" width="160" height="180" rx="36" fill="#047857" />
    </g>

    <!-- Main Tag Base -->
    <rect x="0" y="0" width="160" height="180" rx="36" fill="url(#tagGrad)" />

    <!-- Tag hole ring -->
    <circle cx="80" cy="38" r="14" fill="#0B0F19" />
    <circle cx="80" cy="38" r="14" stroke="#34D399" stroke-width="3" fill="none" opacity="0.7" />

    <!-- Embedded Bold Growth Arrow (Symbolizing profit / net gain) -->
    <path d="M 80 72
             L 122 114
             L 94 114
             L 94 148
             L 66 148
             L 66 114
             L 38 114
             Z" fill="#0F172A" />
    <path d="M 80 78
             L 114 112
             L 90 112
             L 90 144
             L 70 144
             L 70 112
             L 46 112
             Z" fill="#FFFFFF" opacity="0.95" />
  </g>

  <!-- RIGHT: Typography & Store Pitch -->
  <g transform="translate(390, 120)">
    <!-- Small Category Pill -->
    <g transform="translate(0, 0)">
      <rect width="210" height="30" rx="15" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="1.2" />
      <text x="105" y="20" fill="#34D399" font-family="-apple-system, system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="1.2" text-anchor="middle">CALCOLATORE RESELLING</text>
    </g>

    <!-- App Title -->
    <text x="0" y="85" fill="url(#titleGrad)" font-family="-apple-system, system-ui, sans-serif" font-size="52" font-weight="900" letter-spacing="-1">ResellTracker</text>

    <!-- Subtitle / Value Prop -->
    <text x="0" y="125" fill="#94A3B8" font-family="-apple-system, system-ui, sans-serif" font-size="20" font-weight="500">
      Calcola il guadagno netto reale e gestisci il tuo inventario
    </text>

    <!-- Supported Platforms Pill Row -->
    <g transform="translate(0, 160)">
      <!-- Vinted -->
      <rect x="0" y="0" width="85" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="42.5" y="22" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">Vinted</text>

      <!-- eBay -->
      <rect x="95" y="0" width="75" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="132.5" y="22" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">eBay</text>

      <!-- Wallapop -->
      <rect x="180" y="0" width="95" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="227.5" y="22" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">Wallapop</text>

      <!-- Subito -->
      <rect x="285" y="0" width="85" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="327.5" y="22" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">Subito</text>

      <!-- Depop -->
      <rect x="380" y="0" width="85" height="34" rx="8" fill="#1E293B" stroke="#334155" stroke-width="1" />
      <text x="422.5" y="22" fill="#E2E8F0" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="700" text-anchor="middle">Depop</text>
    </g>

    <!-- Key Feature Badges Row -->
    <g transform="translate(0, 220)">
      <circle cx="8" cy="8" r="4" fill="#10B981" />
      <text x="20" y="12" fill="#CBD5E1" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600">100% Offline First</text>

      <circle cx="160" cy="8" r="4" fill="#10B981" />
      <text x="172" y="12" fill="#CBD5E1" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600">Zero Server</text>

      <circle cx="280" cy="8" r="4" fill="#10B981" />
      <text x="292" y="12" fill="#CBD5E1" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600">Export Excel/CSV</text>

      <circle cx="435" cy="8" r="4" fill="#10B981" />
      <text x="447" y="12" fill="#CBD5E1" font-family="-apple-system, system-ui, sans-serif" font-size="13" font-weight="600">Foto Inventario</text>
    </g>
  </g>
</svg>
`;

async function generateFeatureGraphic() {
  const graphicDest = path.join(storeDir, 'feature-graphic-1024x500.png');
  await sharp(Buffer.from(featureSvg))
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(graphicDest);
  console.log('Generated 1024x500 feature graphic at:', graphicDest);
}

async function run() {
  try {
    await generateStoreIcon();
    await generateFeatureGraphic();
    console.log('✅ All Play Store visual assets generated successfully!');
  } catch (err) {
    console.error('Error generating assets:', err);
    process.exit(1);
  }
}

run();
