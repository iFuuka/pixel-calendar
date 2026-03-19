import React, { useMemo } from 'react';
import './Confetti.css';

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bd6', '#ffa06b'];

export default function Confetti() {
    const particles = useMemo(() =>
        Array.from({ length: 40 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            delay: Math.random() * 2,
            duration: 1.5 + Math.random() * 2,
            color: COLORS[i % COLORS.length],
            size: 4 + Math.random() * 6,
            rotation: Math.random() * 360,
            drift: -40 + Math.random() * 80,
        }))
    , []);

    return (
        <div className="confetti-overlay" aria-hidden="true">
            {particles.map(p => (
                <span
                    key={p.id}
                    className="confetti-piece"
                    style={{
                        left: `${p.left}%`,
                        animationDelay: `${p.delay}s`,
                        animationDuration: `${p.duration}s`,
                        backgroundColor: p.color,
                        width: `${p.size}px`,
                        height: `${p.size * 0.6}px`,
                        '--drift': `${p.drift}px`,
                        '--rot': `${p.rotation}deg`,
                    }}
                />
            ))}
        </div>
    );
}
