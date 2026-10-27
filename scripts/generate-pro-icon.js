const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const desktopPath = 'C:\\Users\\damen\\Desktop\\pro-badge-icon-512.png';
const storePath = path.join(__dirname, '..', 'store-listing', 'pro-badge-icon-512.png');

const proIconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Deep Obsidian / Carbon Gradient -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0F172A" />
      <stop offset="50%" stop-color="#020617" />
      <stop offset="100%" stop-color="#000000" />
    </linearGradient>

    <!-- Luxury Gold Gradient -->
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FDE047" />
      <stop offset="35%" stop-color="#F59E0B" />
      <stop offset="70%" stop-color="#D97706" />
      <stop offset="100%" stop-color="#B45309" />
    </linearGradient>

    <!-- Emerald Glow -->
    <radialGradient id="emeraldAura" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#10B981" stop-opacity="0.35" />
      <stop offset="70%" stop-color="#059669" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Golden Aura -->
    <radialGradient id="goldAura" cx="50%" cy="40%" r="45%">
      <stop offset="0%" stop-color="#FBBF24" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Tag Emerald Gradient -->
    <linearGradient id="tagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="50%" stop-color="#10B981" />
      <stop offset="100%" stop-color="#047857" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="16" flood-color="#F59E0B" flood-opacity="0.4" />
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6" />
    </filter>
  </defs>

  <!-- Background Base with Squircle (Standard Play Store 512x512) -->
  <rect width="512" height="512" rx="115" fill="url(#bg)" />
  <rect width="512" height="512" rx="115" fill="url(#emeraldAura)" />
  <rect width="512" height="512" rx="115" fill="url(#goldAura)" />

  <!-- Gold Ring Border -->
  <rect x="16" y="16" width="480" height="480" rx="100" fill="none" stroke="url(#goldGrad)" stroke-width="6" opacity="0.85" />

  <!-- Crown / Star VIP symbol on top -->
  <g transform="translate(256, 95)" text-anchor="middle" filter="url(#glow)">
    <!-- 5-Point Crown -->
    <path d="M -45 15 L -35 -20 L -12 -5 L 0 -28 L 12 -5 L 35 -20 L 45 15 Z" fill="url(#goldGrad)" stroke="#78350F" stroke-width="1.5" />
    <circle cx="-35" cy="-22" r="4" fill="#FEF08A" />
    <circle cx="0" cy="-30" r="5" fill="#FEF08A" />
    <circle cx="35" cy="-22" r="4" fill="#FEF08A" />
  </g>

  <!-- Center Tag Emblem -->
  <g transform="translate(166, 140)" filter="url(#glow)">
    <!-- Main Tag -->
    <rect x="0" y="0" width="180" height="200" rx="40" fill="url(#tagGrad)" stroke="#6EE7B7" stroke-width="2" />
    <!-- Tag Ring Hole -->
    <circle cx="90" cy="42" r="16" fill="#020617" />
    <circle cx="90" cy="42" r="16" stroke="url(#goldGrad)" stroke-width="3" />

    <!-- Rising Chart Vector Inside Tag -->
    <path d="M 45 140 L 75 110 L 105 125 L 135 85" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M 115 85 L 135 85 L 135 105" stroke="#FFFFFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" />
  </g>

  <!-- PRO Gold Luxury Pill Badge (Bottom) -->
  <g transform="translate(256, 400)" filter="url(#glow)">
    <rect x="-105" y="-32" width="210" height="64" rx="20" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="2" />
    <text x="0" y="11" fill="#451A03" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-size="34" font-weight="900" letter-spacing="4" text-anchor="middle">PRO</text>
  </g>
</svg>
`;

async function run() {
  const buf = await sharp(Buffer.from(proIconSvg))
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(desktopPath, buf);
  fs.writeFileSync(storePath, buf);
  console.log('✓ Elite PRO icon generated at:', desktopPath);
}

run().catch(console.error);
