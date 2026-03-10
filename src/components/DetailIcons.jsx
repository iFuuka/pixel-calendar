import React from 'react';

/* ─────────────────────────────────────────────────────────────
   Detail Icons — pixel-art SVG icons for the Weather Detail
   panel and Current Day Dashboard.
───────────────────────────────────────────────────────────── */

// ── Umbrella (Precipitation) ───────────────────────────────────
export function UmbrellaIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="1" y="6" width="14" height="2" fill="#80b8f8" />
            <rect x="2" y="4" width="12" height="2" fill="#80b8f8" />
            <rect x="4" y="3" width="8" height="1" fill="#80b8f8" />
            <rect x="5" y="2" width="6" height="1" fill="#a8ccff" />
            <rect x="7" y="8" width="2" height="5" fill="#b090d0" />
            <rect x="6" y="12" width="3" height="1" fill="#b090d0" />
            <rect x="3" y="10" width="1" height="2" fill="#6aaaee" />
            <rect x="8" y="10" width="1" height="2" fill="#6aaaee" />
            <rect x="12" y="10" width="1" height="2" fill="#6aaaee" />
        </svg>
    );
}

// ── Wind ──────────────────────────────────────────────────────
export function WindIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="1" y="4" width="9" height="1" fill="#c8d8ee" />
            <rect x="1" y="6" width="11" height="1" fill="#b0c8e8" />
            <rect x="1" y="8" width="13" height="1" fill="#a0b8e0" />
            <rect x="1" y="10" width="10" height="1" fill="#b0c8e8" />
            <rect x="1" y="12" width="7" height="1" fill="#c8d8ee" />
            <rect x="10" y="3" width="2" height="2" fill="#c8d8ee" />
            <rect x="12" y="5" width="1" height="2" fill="#c8d8ee" />
            <rect x="14" y="7" width="1" height="2" fill="#a0b8e0" />
        </svg>
    );
}

// ── Sunrise ────────────────────────────────────────────────────
export function SunriseIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="1" y="11" width="14" height="1" fill="#f0b87a" />
            <rect x="5" y="8" width="6" height="3" fill="#ffe066" />
            <rect x="4" y="9" width="8" height="2" fill="#ffe066" />
            <rect x="6" y="7" width="4" height="2" fill="#ffd040" />
            <rect x="7" y="4" width="2" height="2" fill="#ffe879" />
            <rect x="2" y="9" width="2" height="1" fill="#ffe879" />
            <rect x="12" y="9" width="2" height="1" fill="#ffe879" />
            {/* arrow up */}
            <rect x="7" y="13" width="2" height="2" fill="#f0b87a" />
            <rect x="5" y="13" width="6" height="1" fill="#f0b87a" />
        </svg>
    );
}

// ── Sunset ─────────────────────────────────────────────────────
export function SunsetIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="1" y="11" width="14" height="1" fill="#f090a8" />
            <rect x="5" y="8" width="6" height="3" fill="#ffc844" />
            <rect x="4" y="9" width="8" height="2" fill="#ffc844" />
            <rect x="6" y="7" width="4" height="2" fill="#ffaa30" />
            <rect x="7" y="4" width="2" height="2" fill="#ffd040" />
            <rect x="2" y="9" width="2" height="1" fill="#ffd040" />
            <rect x="12" y="9" width="2" height="1" fill="#ffd040" />
            {/* arrow down */}
            <rect x="7" y="13" width="2" height="2" fill="#f090a8" />
            <rect x="5" y="14" width="6" height="1" fill="#f090a8" />
        </svg>
    );
}

// ── Thermometer ────────────────────────────────────────────────
export function ThermometerIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="6" y="2" width="4" height="9" fill="#e8e0f8" />
            <rect x="7" y="3" width="2" height="8" fill="#cbb8f0" />
            <rect x="5" y="10" width="6" height="4" rx="2" fill="#f090a8" />
            <rect x="7" y="11" width="2" height="2" fill="#ffdde8" />
            <rect x="10" y="5" width="2" height="1" fill="#cbb8f0" />
            <rect x="10" y="7" width="2" height="1" fill="#cbb8f0" />
            <rect x="10" y="9" width="2" height="1" fill="#cbb8f0" />
        </svg>
    );
}

// ── Clock ──────────────────────────────────────────────────────
export function ClockIcon({ size = 20 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="4" y="2" width="8" height="12" rx="4" fill="#e8e0f8" />
            <rect x="5" y="3" width="6" height="10" rx="3" fill="#fff8fe" />
            <rect x="4" y="2" width="8" height="1" fill="#cbb8f0" />
            <rect x="4" y="13" width="8" height="1" fill="#cbb8f0" />
            <rect x="3" y="3" width="1" height="10" fill="#cbb8f0" />
            <rect x="12" y="3" width="1" height="10" fill="#cbb8f0" />
            <rect x="7" y="5" width="2" height="3" fill="#9b70d8" />
            <rect x="7" y="7" width="3" height="2" fill="#f090a8" />
            <rect x="7" y="7" width="2" height="2" fill="#4a3860" />
        </svg>
    );
}
