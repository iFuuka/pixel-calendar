import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'pixel-calendar-habits';

function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { habits: [], checks: {} };
    } catch { return { habits: [], checks: {} }; }
}

/**
 * useHabits — habit tracker with daily check-offs.
 * Storage: { habits: [{id, name, icon}], checks: { [dateKey]: [habitId, ...] } }
 */
export function useHabits() {
    const [data, setData] = useState(load);

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
    }, [data]);

    const habits = data.habits || [];
    const checks = data.checks || {};

    const addHabit = useCallback((name, icon = '✅') => {
        const id = `h-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setData(prev => ({
            ...prev,
            habits: [...(prev.habits || []), { id, name, icon }],
        }));
    }, []);

    const removeHabit = useCallback((habitId) => {
        setData(prev => ({
            ...prev,
            habits: (prev.habits || []).filter(h => h.id !== habitId),
        }));
    }, []);

    const toggleCheck = useCallback((dateKey, habitId) => {
        setData(prev => {
            const dayChecks = prev.checks?.[dateKey] || [];
            const next = dayChecks.includes(habitId)
                ? dayChecks.filter(id => id !== habitId)
                : [...dayChecks, habitId];
            return {
                ...prev,
                checks: { ...prev.checks, [dateKey]: next },
            };
        });
    }, []);

    const isChecked = useCallback((dateKey, habitId) => {
        return (checks[dateKey] || []).includes(habitId);
    }, [checks]);

    const getStreak = useCallback((habitId) => {
        let streak = 0;
        for (let i = 0; i <= 365; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            if ((checks[key] || []).includes(habitId)) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        return streak;
    }, [checks]);

    return { habits, checks, addHabit, removeHabit, toggleCheck, isChecked, getStreak };
}
