import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pixel-calendar-moods';

export const MOOD_OPTIONS = [
    { emoji: '🔥', key: 'fire', en: 'On fire', ru: 'Огонь' },
    { emoji: '😊', key: 'happy', en: 'Happy', ru: 'Радость' },
    { emoji: '😌', key: 'calm', en: 'Calm', ru: 'Спокойствие' },
    { emoji: '😐', key: 'neutral', en: 'Neutral', ru: 'Нейтрально' },
    { emoji: '😢', key: 'sad', en: 'Sad', ru: 'Грусть' },
    { emoji: '😴', key: 'tired', en: 'Tired', ru: 'Усталость' },
    { emoji: '😡', key: 'angry', en: 'Angry', ru: 'Злость' },
];

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
}

/**
 * useMoods — per-day mood emoji tracker.
 * Stored as { [dateKey]: string (emoji) }
 */
export function useMoods() {
    const [moods, setMoods] = useState(load);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(moods)); } catch {}
    }, [moods]);

    const getMood = useCallback((dateKey) => moods[dateKey] || null, [moods]);

    const setMood = useCallback((dateKey, emoji) => {
        setMoods(prev => {
            if (!emoji || prev[dateKey] === emoji) {
                const next = { ...prev };
                delete next[dateKey];
                return next;
            }
            return { ...prev, [dateKey]: emoji };
        });
    }, []);

    return { moods, getMood, setMood };
}
