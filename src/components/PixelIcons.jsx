import React from 'react';

/* ─────────────────────────────────────────────────────────────
   Pixel-art SVG weather icons built entirely from <rect> elements
   on a 16×16 grid. Each icon is cute and stylized.
───────────────────────────────────────────────────────────── */

const UNIT = 2; // px per pixel unit, icon renders at 32×32 by default

function Px({ x, y, w = 1, h = 1, fill }) {
    return <rect x={x * UNIT} y={y * UNIT} width={w * UNIT} height={h * UNIT} fill={fill} />;
}

// ── Sun ──────────────────────────────────────────────────────
export function SunIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            {/* rays */}
            <Px x={7} y={1} fill="#ffe066" />
            <Px x={8} y={1} fill="#ffe066" />
            <Px x={7} y={2} fill="#ffc844" />
            <Px x={8} y={2} fill="#ffc844" />
            <Px x={13} y={1} fill="#ffe066" />
            <Px x={14} y={1} fill="#ffe066" />
            <Px x={13} y={2} fill="#ffc844" />
            <Px x={14} y={2} fill="#ffc844" />
            <Px x={1} y={7} fill="#ffe066" />
            <Px x={1} y={8} fill="#ffc844" />
            <Px x={2} y={7} fill="#ffe066" />
            <Px x={2} y={8} fill="#ffc844" />
            <Px x={13} y={13} fill="#ffe066" />
            <Px x={14} y={13} fill="#ffc844" />
            <Px x={13} y={14} fill="#ffe066" />
            <Px x={14} y={14} fill="#ffc844" />
            <Px x={1} y={13} fill="#ffe066" />
            <Px x={2} y={13} fill="#ffc844" />
            <Px x={1} y={14} fill="#ffe066" />
            <Px x={2} y={14} fill="#ffc844" />
            {/* body */}
            <Px x={4} y={4} w={8} h={8} fill="#ffe066" />
            <Px x={5} y={3} w={6} h={1} fill="#ffe879" />
            <Px x={3} y={5} w={1} h={6} fill="#ffe879" />
            <Px x={5} y={3} w={6} h={10} fill="#ffe066" />
            <Px x={3} y={5} w={10} h={6} fill="#ffe066" />
            {/* shine dots */}
            <Px x={5} y={5} fill="#fff08a" />
            <Px x={6} y={5} fill="#fff08a" />
            <Px x={5} y={6} fill="#fff08a" />
        </svg>
    );
}

// ── Cloud ─────────────────────────────────────────────────────
export function CloudIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            <Px x={4} y={7} w={2} h={2} fill="#c8e4ff" />
            <Px x={6} y={5} w={4} h={2} fill="#c8e4ff" />
            <Px x={5} y={6} w={6} h={6} fill="#e8f4ff" />
            <Px x={3} y={8} w={10} h={4} fill="#e8f4ff" />
            <Px x={2} y={9} w={12} h={3} fill="#f0f8ff" />
            <Px x={4} y={5} w={2} h={2} fill="#d8ecff" />
            <Px x={9} y={4} w={3} h={2} fill="#c8e4ff" />
            <Px x={8} y={5} w={5} h={2} fill="#d8ecff" />
            {/* outline pixels */}
            <Px x={2} y={8} w={1} h={4} fill="#b0ccff" />
            <Px x={14} y={8} w={1} h={4} fill="#b0ccff" />
            <Px x={3} y={12} w={11} h={1} fill="#b0ccff" />
        </svg>
    );
}

// ── Cloud + Sun ───────────────────────────────────────────────
export function CloudSunIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            {/* mini sun top-right */}
            <Px x={10} y={1} w={4} h={4} fill="#ffe066" />
            <Px x={9} y={2} w={1} h={2} fill="#ffe066" />
            <Px x={14} y={2} w={1} h={2} fill="#ffe066" />
            <Px x={11} y={0} w={2} h={1} fill="#ffe066" />
            <Px x={11} y={5} w={2} h={1} fill="#ffe066" />
            {/* cloud */}
            <Px x={2} y={8} w={2} h={2} fill="#c8e4ff" />
            <Px x={4} y={6} w={4} h={2} fill="#c8e4ff" />
            <Px x={3} y={7} w={9} h={6} fill="#e8f4ff" />
            <Px x={1} y={9} w={12} h={4} fill="#f0f8ff" />
            <Px x={8} y={5} w={4} h={3} fill="#dde8f8" />
        </svg>
    );
}

// ── Rain ──────────────────────────────────────────────────────
export function RainIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            {/* cloud */}
            <Px x={2} y={3} w={2} h={2} fill="#b0ccee" />
            <Px x={4} y={1} w={4} h={2} fill="#b8d4f8" />
            <Px x={3} y={2} w={8} h={5} fill="#c8dff8" />
            <Px x={1} y={4} w={13} h={4} fill="#d4e8ff" />
            {/* drops */}
            <Px x={3} y={9} w={1} h={2} fill="#80b8f8" />
            <Px x={6} y={10} w={1} h={2} fill="#80b8f8" />
            <Px x={9} y={9} w={1} h={2} fill="#80b8f8" />
            <Px x={12} y={10} w={1} h={2} fill="#80b8f8" />
            <Px x={4} y={12} w={1} h={2} fill="#6aaaee" />
            <Px x={7} y={13} w={1} h={2} fill="#6aaaee" />
            <Px x={10} y={12} w={1} h={2} fill="#6aaaee" />
        </svg>
    );
}

// ── Snow ──────────────────────────────────────────────────────
export function SnowIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            {/* cloud */}
            <Px x={2} y={2} w={2} h={2} fill="#c0d8f0" />
            <Px x={4} y={1} w={5} h={2} fill="#cce0f8" />
            <Px x={3} y={2} w={9} h={5} fill="#d8ecff" />
            <Px x={1} y={4} w={13} h={3} fill="#e4f2ff" />
            {/* snowflakes */}
            <Px x={3} y={9} fill="#b0ccff" />
            <Px x={4} y={10} fill="#b0ccff" />
            <Px x={3} y={11} fill="#b0ccff" />
            <Px x={5} y={10} fill="#b0ccff" />
            <Px x={2} y={10} fill="#b0ccff" />

            <Px x={8} y={10} fill="#98bcff" />
            <Px x={9} y={11} fill="#98bcff" />
            <Px x={8} y={12} fill="#98bcff" />
            <Px x={10} y={11} fill="#98bcff" />
            <Px x={7} y={11} fill="#98bcff" />

            <Px x={12} y={9} fill="#b0ccff" />
            <Px x={13} y={10} fill="#b0ccff" />
            <Px x={12} y={11} fill="#b0ccff" />
            <Px x={11} y={10} fill="#b0ccff" />
        </svg>
    );
}

// ── Thunder ───────────────────────────────────────────────────
export function ThunderIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            {/* dark cloud */}
            <Px x={2} y={2} w={2} h={2} fill="#9090b8" />
            <Px x={4} y={1} w={5} h={2} fill="#a0a0c8" />
            <Px x={3} y={2} w={9} h={5} fill="#b0b0d8" />
            <Px x={1} y={4} w={13} h={3} fill="#c0c0e0" />
            {/* bolt */}
            <Px x={8} y={7} w={3} h={2} fill="#ffe066" />
            <Px x={6} y={9} w={4} h={2} fill="#ffe066" />
            <Px x={7} y={11} w={4} h={2} fill="#ffc844" />
            <Px x={9} y={9} fill="#fff08a" />
        </svg>
    );
}

// ── Fog ───────────────────────────────────────────────────────
export function FogIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            <Px x={1} y={3} w={14} h={2} fill="#c8d8e8" />
            <Px x={2} y={6} w={12} h={2} fill="#d4e0ee" />
            <Px x={1} y={9} w={13} h={2} fill="#c0d0e0" />
            <Px x={3} y={12} w={10} h={2} fill="#ccd8e8" />
        </svg>
    );
}

// ── Moon (clear night) ────────────────────────────────────────
export function MoonIcon({ size = 32 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 32 32" style={{ imageRendering: 'pixelated' }}>
            <Px x={5} y={2} w={5} h={2} fill="#e8d8ff" />
            <Px x={3} y={4} w={7} h={6} fill="#d8c4f8" />
            <Px x={2} y={5} w={9} h={4} fill="#e4d4ff" />
            <Px x={4} y={10} w={6} h={2} fill="#d8c4f8" />
            <Px x={5} y={12} w={4} h={1} fill="#c8b4e8" />
            {/* shadow cutout */}
            <Px x={7} y={3} w={4} h={8} fill="none" />
            <Px x={9} y={2} w={5} h={3} fill="#fdf6f0" />
            <Px x={10} y={3} w={4} h={8} fill="#fdf6f0" />
            <Px x={8} y={10} w={4} h={2} fill="#fdf6f0" />
            {/* stars */}
            <Px x={13} y={1} fill="#d8c4f8" />
            <Px x={14} y={4} fill="#c8b4e8" />
            <Px x={12} y={7} fill="#e4d4ff" />
        </svg>
    );
}

// ── Dispatcher ────────────────────────────────────────────────
export function WeatherIcon({ type, size = 32 }) {
    switch (type) {
        case 'sun': return <SunIcon size={size} />;
        case 'cloud-sun': return <CloudSunIcon size={size} />;
        case 'cloud': return <CloudIcon size={size} />;
        case 'rain': return <RainIcon size={size} />;
        case 'snow': return <SnowIcon size={size} />;
        case 'thunder': return <ThunderIcon size={size} />;
        case 'fog': return <FogIcon size={size} />;
        case 'moon': return <MoonIcon size={size} />;
        default: return <CloudIcon size={size} />;
    }
}

// ── Gear (Settings) ───────────────────────────────────────────
export function GearIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            {/* center */}
            <rect x="6" y="6" width="4" height="4" fill="currentColor" />
            {/* teeth */}
            <rect x="7" y="1" width="2" height="3" fill="currentColor" />
            <rect x="7" y="12" width="2" height="3" fill="currentColor" />
            <rect x="1" y="7" width="3" height="2" fill="currentColor" />
            <rect x="12" y="7" width="3" height="2" fill="currentColor" />
            {/* corner teeth */}
            <rect x="3" y="3" width="2" height="2" fill="currentColor" />
            <rect x="11" y="3" width="2" height="2" fill="currentColor" />
            <rect x="3" y="11" width="2" height="2" fill="currentColor" />
            <rect x="11" y="11" width="2" height="2" fill="currentColor" />
            {/* hole */}
            <rect x="7" y="7" width="2" height="2" fill="var(--clr-bg, #fdf6f0)" />
        </svg>
    );
}

// ── Notes List Icon ────────────────────────────────────────────
export function NotesListIcon({ size = 24 }) {
    return (
        <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }} fill="none">
            <rect x="2" y="2" width="12" height="12" rx="1" fill="currentColor" opacity="0.15" />
            <rect x="2" y="2" width="12" height="12" rx="1" stroke="currentColor" strokeWidth="2" />
            <rect x="4" y="5" width="8" height="1" fill="currentColor" />
            <rect x="4" y="8" width="6" height="1" fill="currentColor" />
            <rect x="4" y="11" width="7" height="1" fill="currentColor" />
        </svg>
    );
}

