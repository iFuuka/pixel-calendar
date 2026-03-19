import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pixel-calendar-countdowns';

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch { return []; }
}

/**
 * useCountdowns — countdown timers to specific dates.
 * Each: { id, dateKey, label, emoji }
 */
export function useCountdowns() {
    const [countdowns, setCountdowns] = useState(load);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(countdowns)); } catch {}
    }, [countdowns]);

    const addCountdown = useCallback((dateKey, label, emoji = '🎯') => {
        const id = `cd-${Date.now()}`;
        setCountdowns(prev => [...prev, { id, dateKey, label, emoji }]);
    }, []);

    const removeCountdown = useCallback((id) => {
        setCountdowns(prev => prev.filter(c => c.id !== id));
    }, []);

    return { countdowns, addCountdown, removeCountdown };
}
