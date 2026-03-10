/**
 * scripts/prepare-build.js
 * ─────────────────────────────────────────
 * Copies build/icon.png from public/icon.png if not already present.
 * Run automatically via the "prebuild:electron" npm hook.
 */
const fs = require('fs');
const path = require('path');

const srcCandidates = [
    path.join(__dirname, '..', 'public', 'icon.png'),
    path.join(__dirname, '..', 'src', 'assets', 'icon.png'),
];

const dest = path.join(__dirname, '..', 'build', 'icon.png');

// Ensure build/ dir exists
fs.mkdirSync(path.dirname(dest), { recursive: true });

if (!fs.existsSync(dest)) {
    const src = srcCandidates.find(fs.existsSync);
    if (src) {
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied icon from ${src} → ${dest}`);
    } else {
        console.warn('⚠ build/icon.png not found. Using SVG fallback — the app will still work but the .exe icon may be generic.');
    }
} else {
    console.log('✓ build/icon.png already exists');
}
