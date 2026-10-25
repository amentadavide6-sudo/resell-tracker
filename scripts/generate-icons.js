const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Master 1024x1024 SVG Icon
// Concept: Sleek modern tilted price tag with embedded upward profit arrow (negative space / contrast)
// Background: Deep Slate Obsidian gradient
// Tag: Gradient Emerald Green with polished modern geometry
const masterSvg = `
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#0B0F19" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>

    <!-- Center Ambient Glow -->
    <radialGradient id="ambientGlow" cx="50%" cy="46%" r="48%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.18" />
      <stop offset="60%" stop-color="#6366F1" stop-opacity="0.06" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Tag Primary Gradient (Emerald / Mint Profit) -->
    <linearGradient id="tagGrad" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>

    <!-- Secondary Tag Accent Gradient (Indigo Depth) -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="tagShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="24" stdDeviation="32" flood-color="#000000" flood-opacity="0.55" />
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#10B981" flood-opacity="0.22" />
    </filter>

    <!-- Inner Shadow / Soft Stroke for Tag -->
    <linearGradient id="tagStroke" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.05" />
    </linearGradient>
  </defs>

  <!-- Background Canvas -->
  <rect width="1024" height="1024" rx="224" fill="url(#bgGrad)" />
  <circle cx="512" cy="480" r="420" fill="url(#ambientGlow)" />

  <!-- Main Composition Group: Tilted at 14 degrees for dynamic velocity -->
  <g transform="translate(512, 512) rotate(-12) translate(-512, -512)" filter="url(#tagShadow)">
    
    <!-- Secondary Behind Tag (Layered effect - represents multiple listings / inventory) -->
    <g transform="translate(-24, 28) rotate(-10 512 512)" opacity="0.38">
      <path d="M 400 240
               L 624 240
               C 660 240 690 265 700 300
               L 730 420
               C 740 455 725 490 695 510
               L 480 660
               C 445 685 400 675 375 640
               L 260 480
               C 235 445 245 400 280 375
               Z"
            fill="url(#accentGrad)" />
    </g>

    <!-- Master Price Tag Silhouette -->
    <!-- Pointy top tag with round eyelet and rectangular body -->
    <g>
      <!-- Base Tag Shape -->
      <path d="M 452 230
               C 475 205 515 205 538 230
               L 670 362
               C 685 377 694 398 694 420
               L 694 690
               C 694 730 662 762 622 762
               L 368 762
               C 328 762 296 730 296 690
               L 296 420
               C 296 398 305 377 320 362
               Z"
            fill="url(#tagGrad)"
            stroke="url(#tagStroke)"
            stroke-width="5" />

      <!-- Tag Eyelet (Round Hole at the Top) -->
      <circle cx="495" cy="305" r="32" fill="#0B0F19" />
      <circle cx="495" cy="305" r="32" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="4" fill="none" />

      <!-- Inside Symbol: Clean, Sharp Growth Arrow / Trend (Profit Flip) -->
      <!-- Clean geometric upward trending arrow in pure crisp white -->
      <g transform="translate(495, 545)">
        <!-- Trendline with Arrowhead -->
        <path d="M -105 75 
                 L -35 5 
                 L 20 60 
                 L 95 -20" 
              fill="none" 
              stroke="#FFFFFF" 
              stroke-width="32" 
              stroke-linecap="round" 
              stroke-linejoin="round" />
        
        <!-- Arrowhead at Top Right -->
        <path d="M 35 -22 
                 L 100 -24 
                 L 98 40" 
              fill="none" 
              stroke="#FFFFFF" 
              stroke-width="32" 
              stroke-linecap="round" 
              stroke-linejoin="round" />

        <!-- Accent Sparkle / Coin Node -->
        <circle cx="-105" cy="75" r="14" fill="#FFFFFF" />
        <circle cx="-35" cy="5" r="14" fill="#FFFFFF" />
        <circle cx="20" cy="60" r="14" fill="#FFFFFF" />
      </g>

      <!-- Euro Symbol (€) Subtle Badge -->
      <text x="495" y="710" 
            text-anchor="middle" 
            font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" 
            font-size="44" 
            font-weight="900" 
            letter-spacing="2" 
            fill="#FFFFFF" 
            fill-opacity="0.85">€ PROFIT</text>
    </g>
  </g>
</svg>
`;

// Foreground SVG for Android Adaptive Icon (Safe area inside 66% circle, 512x512)
const adaptiveForegroundSvg = `
<svg width="512" height="512" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tagGrad2" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="accentGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8" />
      <stop offset="100%" stop-color="#4F46E5" />
    </linearGradient>
    <filter id="tagShadow2" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="18" stdDeviation="24" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Scaled slightly down (0.85) to fit perfectly within Android's 66% adaptive mask -->
  <g transform="translate(512, 512) scale(0.82) rotate(-12) translate(-512, -512)" filter="url(#tagShadow2)">
    <!-- Back Tag -->
    <g transform="translate(-24, 28) rotate(-10 512 512)" opacity="0.4">
      <path d="M 400 240 L 624 240 C 660 240 690 265 700 300 L 730 420 C 740 455 725 490 695 510 L 480 660 C 445 685 400 675 375 640 L 260 480 C 235 445 245 400 280 375 Z" fill="url(#accentGrad2)" />
    </g>

    <!-- Main Tag -->
    <path d="M 452 230 C 475 205 515 205 538 230 L 670 362 C 685 377 694 398 694 420 L 694 690 C 694 730 662 762 622 762 L 368 762 C 328 762 296 730 296 690 L 296 420 C 296 398 305 377 320 362 Z" fill="url(#tagGrad2)" />
    
    <!-- Eyelet -->
    <circle cx="495" cy="305" r="32" fill="#0B0F19" />
    <circle cx="495" cy="305" r="32" stroke="#FFFFFF" stroke-opacity="0.25" stroke-width="4" fill="none" />

    <!-- Trend Arrow -->
    <g transform="translate(495, 545)">
      <path d="M -105 75 L -35 5 L 20 60 L 95 -20" fill="none" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M 35 -22 L 100 -24 L 98 40" fill="none" stroke="#FFFFFF" stroke-width="32" stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="-105" cy="75" r="14" fill="#FFFFFF" />
      <circle cx="-35" cy="5" r="14" fill="#FFFFFF" />
      <circle cx="20" cy="60" r="14" fill="#FFFFFF" />
    </g>

    <text x="495" y="710" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="44" font-weight="900" letter-spacing="2" fill="#FFFFFF" fill-opacity="0.85">€ PROFIT</text>
  </g>
</svg>
`;

async function buildAllAssets() {
  const assetsDir = path.join(__dirname, '..', 'assets');

  console.log('1. Rendering master icon.png (1024x1024)...');
  await sharp(Buffer.from(masterSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'icon.png'));

  console.log('2. Rendering splash-icon.png (1024x1024)...');
  await sharp(Buffer.from(masterSvg))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(assetsDir, 'splash-icon.png'));

  console.log('3. Rendering android-icon-foreground.png (512x512)...');
  await sharp(Buffer.from(adaptiveForegroundSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(assetsDir, 'android-icon-foreground.png'));

  console.log('4. Rendering android-icon-background.png (512x512)...');
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: '#0B0F19',
    },
  })
    .png()
    .toFile(path.join(assetsDir, 'android-icon-background.png'));

  console.log('5. Rendering favicon.png (48x48)...');
  await sharp(Buffer.from(masterSvg))
    .resize(48, 48)
    .png()
    .toFile(path.join(assetsDir, 'favicon.png'));

  console.log('6. Rendering android-icon-monochrome.png (512x512)...');
  await sharp(Buffer.from(adaptiveForegroundSvg))
    .resize(512, 512)
    .greyscale()
    .png()
    .toFile(path.join(assetsDir, 'android-icon-monochrome.png'));

  console.log('✅ All icons generated with mathematical precision!');
}

buildAllAssets().catch((err) => {
  console.error(err);
  process.exit(1);
});
