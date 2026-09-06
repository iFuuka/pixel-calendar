import { useState, useEffect, useCallback, useMemo } from 'react';
import { findNoteDate, moveOccurrence, notesForDate, occursOn } from '../utils/events';

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
    { key: 'same-day', labelEn: 'At event time', labelRu: 'В момент события' },
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
        (dateKey) => notesForDate(allNotes, dateKey),
        [allNotes]
    );

    const addNote = useCallback((dateKey, text, tags = [], reminder = null, schedule = {}) => {
        if (!text.trim()) return;
        const note = {
            id: `${dateKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            text: text.trim(),
            createdAt: Date.now(),
            tags: tags.filter(Boolean),
            time: schedule.time || '',
            outdoor: !!schedule.outdoor,
            repeat: schedule.repeat || 'none',
            repeatUntil: schedule.repeatUntil || '',
            reminder: reminder || { enabled: false, intervals: [], notified: [] },
        };
        setAllNotes((prev) => ({
            ...prev,
            [dateKey]: [...(prev[dateKey] ?? []), note],
        }));
    }, []);

    const updateNote = useCallback((dateKey, noteId, update) => {
        setAllNotes(prev => {
            const source = findNoteDate(prev, dateKey, noteId);
            if (!source) return prev;
            return { ...prev, [source]: prev[source].map(n => n.id === noteId ? update(n) : n) };
        });
    }, []);

    const editNote = useCallback((dateKey, noteId, newText) => {
        if (!newText.trim()) return;
        updateNote(dateKey, noteId, n => ({ ...n, text: newText.trim() }));
    }, [updateNote]);

    const updateNoteTags = useCallback((dateKey, noteId, tags) => {
        updateNote(dateKey, noteId, n => ({ ...n, tags: tags.filter(Boolean) }));
    }, [updateNote]);

    const updateNoteReminder = useCallback((dateKey, noteId, reminder) => {
        updateNote(dateKey, noteId, n => ({ ...n, reminder: { ...reminder, notified: [], snoozes: {} } }));
    }, [updateNote]);

    const updateNoteSchedule = useCallback((dateKey, noteId, schedule) => {
        updateNote(dateKey, noteId, n => ({
            ...n, ...schedule,
            excludedDates: (n.repeat || 'none') === schedule.repeat ? n.excludedDates || [] : [],
            reminder: { enabled: false, intervals: [], ...n.reminder, notified: [], snoozes: {} },
        }));
    }, [updateNote]);

    const markReminderNotified = useCallback((dateKey, noteId, intervalKey) => {
        updateNote(dateKey, noteId, n => {
            const notified = [...new Set([...(n.reminder?.notified ?? []), intervalKey])].slice(-128);
            const snoozes = { ...n.reminder?.snoozes };
            for (const [key, at] of Object.entries(snoozes)) {
                if (`snooze:${key}:${at}` === intervalKey) delete snoozes[key];
            }
            return { ...n, reminder: { ...n.reminder, notified, snoozes } };
        });
    }, [updateNote]);

    const snoozeReminder = useCallback((dateKey, noteId) => {
        const source = findNoteDate(allNotes, dateKey, noteId);
        const note = allNotes[source]?.find(item => item.id === noteId);
        if (!note || !occursOn(note, source, dateKey)) throw new Error('Event unavailable');
        const reminder = {
            enabled: false, intervals: [], ...note.reminder,
            snoozes: { ...note.reminder?.snoozes, [dateKey]: Date.now() + 15 * 60 * 1000 },
        };
        const next = { ...allNotes, [source]: allNotes[source].map(item => item.id === noteId ? { ...item, reminder } : item) };
        // Acknowledge the notification action only after durable storage succeeds.
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        setAllNotes(next);
    }, [allNotes]);

    const deleteNote = useCallback((dateKey, noteId) => {
        setAllNotes((prev) => {
            const source = findNoteDate(prev, dateKey, noteId);
            if (!source) return prev;
            const updated = prev[source].filter((n) => n.id !== noteId);
            const next = { ...prev };
            if (updated.length === 0) {
                delete next[source];
            } else {
                next[source] = updated;
            }
            return next;
        });
    }, []);

    const moveNote = useCallback((fromDateKey, toDateKey, noteId, newTime) => {
        const newId = `${toDateKey}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setAllNotes(prev => moveOccurrence(prev, fromDateKey, toDateKey, noteId, newId, newTime));
    }, []);

    const hasNotes = useCallback(
        (dateKey) => notesForDate(allNotes, dateKey).length > 0,
        [allNotes]
    );

    const clearAllNotes = useCallback(() => {
        setAllNotes({});
    }, []);

    const importNotes = useCallback((data) => {
        setAllNotes((prev) => {
            const next = { ...prev };
            const existingIds = new Set(Object.values(prev).flatMap(notes => notes.map(note => note.id)));
            Object.entries(data).forEach(([dateKey, notes]) => {
                if (!Array.isArray(notes)) return;
                const existing = next[dateKey] ?? [];
                const newNotes = notes
                    .filter((n) => {
                        if (!n || !n.id || !n.text || existingIds.has(n.id)) return false;
                        existingIds.add(n.id);
                        return true;
                    })
                    .map((n) => ({
                        ...n,
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
        markReminderNotified, updateNoteSchedule, snoozeReminder, allTags,
    };
}
