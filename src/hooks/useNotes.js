import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'pixel-calendar-notes';

function loadAllNotes() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function saveAllNotes(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
        // storage full or unavailable
    }
}

/** Reminder interval options */
export const REMINDER_INTERVALS = [
    { key: 'same-day', labelEn: 'On the day (9:00)', labelRu: 'В этот день (9:00)' },
    { key: '1-day', labelEn: '1 day before', labelRu: 'За 1 день' },
    { key: '2-days', labelEn: '2 days before', labelRu: 'За 2 дня' },
    { key: '3-days', labelEn: '3 days before', labelRu: 'За 3 дня' },
    { key: '1-week', labelEn: '1 week before', labelRu: 'За неделю' },
];

/**
 * useNotes — per-day notes stored in localStorage.
 * Notes keyed by 'yyyy-MM-dd' date string.
 * Each note: { id, text, createdAt, tags[], reminder: { enabled, intervals[], notified[] } }
 */
export function useNotes() {
    const [allNotes, setAllNotes] = useState(loadAllNotes);

    // persist on change
    useEffect(() => {
        saveAllNotes(allNotes);
    }, [allNotes]);

    const getNotesForDate = useCallback(
        (dateKey) => allNotes[dateKey] ?? [],
        [allNotes]
    );

    const addNote = useCallback((dateKey, text, tags = [], reminder = null) => {
        if (!text.trim()) return;
        const note = {
            id: `${dateKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: text.trim(),
            createdAt: Date.now(),
            tags: tags.filter(Boolean),
            reminder: reminder || { enabled: false, intervals: [], notified: [] },
        };
        setAllNotes((prev) => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] ?? []), note],
        }));
    }, []);

    const editNote = useCallback((dateKey, noteId, newText) => {
        if (!newText.trim()) return;
        setAllNotes((prev) => ({
            ...prev,
            [dateKey]: (prev[dateKey] ?? []).map((n) =>
                n.id === noteId ? { ...n, text: newText.trim() } : n
            ),
        }));
    }, []);

    const updateNoteTags = useCallback((dateKey, noteId, tags) => {
        setAllNotes((prev) => ({
            ...prev,
            [dateKey]: (prev[dateKey] ?? []).map((n) =>
                n.id === noteId ? { ...n, tags: tags.filter(Boolean) } : n
            ),
        }));
    }, []);

    const updateNoteReminder = useCallback((dateKey, noteId, reminder) => {
        setAllNotes((prev) => ({
            ...prev,
            [dateKey]: (prev[dateKey] ?? []).map((n) =>
                n.id === noteId ? { ...n, reminder } : n
            ),
        }));
    }, []);

    const markReminderNotified = useCallback((dateKey, noteId, intervalKey) => {
        setAllNotes((prev) => ({
            ...prev,
            [dateKey]: (prev[dateKey] ?? []).map((n) => {
                if (n.id !== noteId) return n;
                const notified = [...(n.reminder?.notified ?? [])];
                if (!notified.includes(intervalKey)) notified.push(intervalKey);
                return { ...n, reminder: { ...n.reminder, notified } };
            }),
        }));
    }, []);

    const deleteNote = useCallback((dateKey, noteId) => {
        setAllNotes((prev) => {
            const updated = (prev[dateKey] ?? []).filter((n) => n.id !== noteId);
            const next = { ...prev };
            if (updated.length === 0) {
                delete next[dateKey];
            } else {
                next[dateKey] = updated;
            }
            return next;
        });
    }, []);

    const moveNote = useCallback((fromDateKey, toDateKey, noteId) => {
        if (fromDateKey === toDateKey) return;
        setAllNotes((prev) => {
            const fromNotes = prev[fromDateKey] ?? [];
            const note = fromNotes.find(n => n.id === noteId);
            if (!note) return prev;
            const next = { ...prev };
            // Remove from source
            const remaining = fromNotes.filter(n => n.id !== noteId);
            if (remaining.length === 0) {
                delete next[fromDateKey];
            } else {
                next[fromDateKey] = remaining;
            }
            // Add to target
            next[toDateKey] = [...(next[toDateKey] ?? []), note];
            return next;
        });
    }, []);

    const hasNotes = useCallback(
        (dateKey) => (allNotes[dateKey]?.length ?? 0) > 0,
        [allNotes]
    );

    const clearAllNotes = useCallback(() => {
        setAllNotes({});
    }, []);

    const importNotes = useCallback((data) => {
        setAllNotes((prev) => {
            const next = { ...prev };
            Object.entries(data).forEach(([dateKey, notes]) => {
                if (!Array.isArray(notes)) return;
                const existing = next[dateKey] ?? [];
                const existingIds = new Set(existing.map((n) => n.id));
                const newNotes = notes
                    .filter((n) => n && n.id && n.text && !existingIds.has(n.id))
                    .map((n) => ({
                        id: n.id,
                        text: n.text,
                        createdAt: n.createdAt ?? Date.now(),
                        tags: Array.isArray(n.tags) ? n.tags : [],
                        reminder: n.reminder ?? { enabled: false, intervals: [], notified: [] },
                    }));
                if (newNotes.length > 0) {
                    next[dateKey] = [...existing, ...newNotes];
                }
            });
            return next;
        });
    }, []);

    // Collect all unique tags across all notes
    const allTags = useMemo(() => {
        const tagSet = new Set();
        Object.values(allNotes).forEach((notes) => {
            notes.forEach((note) => {
                (note.tags ?? []).forEach((tag) => tagSet.add(tag));
            });
        });
        return [...tagSet].sort();
    }, [allNotes]);

    return {
        allNotes, getNotesForDate, addNote, editNote, deleteNote, moveNote,
        hasNotes, clearAllNotes, importNotes, updateNoteTags, updateNoteReminder,
        markReminderNotified, allTags,
    };
}
