import React, { useMemo } from 'react';
import './SeasonalDecorations.css';

function getSeason(month) {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
}

const PARTICLES = {
    winter: { chars: ['❄', '❅', '❆', '✦'], count: 18 },
    spring: { chars: ['🌸', '✿', '❀', '🌷'], count: 14 },
    summer: { chars: ['☀', '✦', '·', '°'], count: 10 },
    autumn: { chars: ['🍂', '🍁', '🍃', '🌿'], count: 16 },
};

export default function SeasonalDecorations() {
    const season = getSeason(new Date().getMonth());
    const { chars, count } = PARTICLES[season];

    const particles = useMemo(() => {
        return Array.from({ length: count }, (_, i) => ({
            id: i,
            char: chars[i % chars.length],
            left: Math.random() * 100,
            delay: Math.random() * 12,
            duration: 8 + Math.random() * 10,
            size: 0.6 + Math.random() * 0.8,
            drift: -30 + Math.random() * 60,
        }));
    }, [season]);

    return (
        <div className={`seasonal-overlay seasonal-overlay--${season}`} aria-hidden="true">
            {particles.map(p => (
                <span
                    key={p.id}
                    className="seasonal-particle"
                    style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        fontSize: `${p.size}rem`,
                        '--drift': `${p.drift}px`,
                    }}
                >
                    {p.char}
                </span>
            ))}
        </div>
    );
}
