import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pixel-calendar-day-meta';

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function save(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { /* storage unavailable */ }
}

/**
 * useDayMeta — per-day metadata (color labels, stickers).
 * Stored as { [dateKey]: { color?: string, stickers?: string[] } }
 */
export function useDayMeta() {
    const [meta, setMeta] = useState(load);

    useEffect(() => { save(meta); }, [meta]);

    const getDayMeta = useCallback(
        (dateKey) => meta[dateKey] || null,
        [meta]
    );

    const setDayColor = useCallback((dateKey, color) => {
        setMeta((prev) => {
            const entry = prev[dateKey] || {};
            if (!color) {
                // Remove color
                const next = { ...prev, [dateKey]: { ...entry, color: undefined } };
                // Clean up empty entries
                if (!next[dateKey].color && (!next[dateKey].stickers || next[dateKey].stickers.length === 0)) {
                    delete next[dateKey];
                }
                return next;
            }
            return { ...prev, [dateKey]: { ...entry, color } };
        });
    }, []);

    const addSticker = useCallback((dateKey, sticker) => {
        setMeta((prev) => {
            const entry = prev[dateKey] || {};
            const stickers = entry.stickers || [];
            if (stickers.includes(sticker) || stickers.length >= 3) return prev;
            return { ...prev, [dateKey]: { ...entry, stickers: [...stickers, sticker] } };
        });
    }, []);

    const removeSticker = useCallback((dateKey, sticker) => {
        setMeta((prev) => {
            const entry = prev[dateKey] || {};
            const stickers = (entry.stickers || []).filter(s => s !== sticker);
            const next = { ...prev, [dateKey]: { ...entry, stickers } };
            if (!next[dateKey].color && stickers.length === 0) {
                delete next[dateKey];
            }
            return next;
        });
    }, []);

    const toggleSticker = useCallback((dateKey, sticker) => {
        setMeta((prev) => {
            const entry = prev[dateKey] || {};
            const stickers = entry.stickers || [];
            if (stickers.includes(sticker)) {
                const next = stickers.filter(s => s !== sticker);
                const newEntry = { ...entry, stickers: next };
                if (!newEntry.color && next.length === 0) {
                    const result = { ...prev };
                    delete result[dateKey];
                    return result;
                }
                return { ...prev, [dateKey]: newEntry };
            }
            if (stickers.length >= 3) return prev;
            return { ...prev, [dateKey]: { ...entry, stickers: [...stickers, sticker] } };
        });
    }, []);

    return { getDayMeta, setDayColor, addSticker, removeSticker, toggleSticker };
}
