// Events are stored once, on their first date. Occurrences are derived, never copied.
export const REPEAT_OPTIONS = ['none', 'daily', 'weekly', 'monthly', 'yearly'];
export const REMINDER_DAYS = { 'same-day': 0, '1-day': 1, '2-days': 2, '3-days': 3, '1-week': 7 };

export function dateKeyOf(date) {
    return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function localDate(key, time = '09:00') {
    const [year, month, day] = key.split('-').map(Number);
    const [hour, minute] = (time || '09:00').split(':').map(Number);
    const date = new Date(0);
    date.setFullYear(year, month - 1, day);
    date.setHours(hour, minute, 0, 0);
    return date;
}

export function isDateKey(value) {
    return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
        && Number(value.slice(0, 4)) >= 1 && dateKeyOf(localDate(value)) === value;
}

export function isEventTime(value) {
    return value === '' || (typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

export function occursOn(note, sourceDateKey, dateKey) {
    if (dateKey < sourceDateKey || note.excludedDates?.includes(dateKey)) return false;
    if (note.repeatUntil && dateKey > note.repeatUntil) return false;
    if (dateKey === sourceDateKey) return true;
    switch (note.repeat) {
        case 'daily': return true;
        case 'weekly': return localDate(sourceDateKey).getDay() === localDate(dateKey).getDay();
        // Dates absent from a month/year are skipped (31st, February 29).
        case 'monthly': return sourceDateKey.slice(8) === dateKey.slice(8);
        case 'yearly': return sourceDateKey.slice(5) === dateKey.slice(5);
        default: return false;
    }
}

export function notesForDate(allNotes, dateKey) {
    return Object.entries(allNotes).flatMap(([sourceDateKey, notes]) =>
        notes.filter(note => occursOn(note, sourceDateKey, dateKey))
            .map(note => ({ ...note, sourceDateKey, occurrenceDateKey: dateKey }))
    ).sort((a, b) => (a.time || '').localeCompare(b.time || '') || a.createdAt - b.createdAt);
}

export function findNoteDate(allNotes, dateKey, id) {
    if (allNotes[dateKey]?.some(note => note.id === id)) return dateKey;
    return Object.keys(allNotes).find(key => allNotes[key].some(note => note.id === id));
}

export function moveOccurrence(allNotes, from, to, id, newId, newTime) {
    if (!isDateKey(from) || !isDateKey(to) || (newTime !== undefined && (!newTime || !isEventTime(newTime)))) return allNotes;
    if (from === to && newTime === undefined) return allNotes;
    const source = findNoteDate(allNotes, from, id);
    const note = allNotes[source]?.find(item => item.id === id);
    if (!note || !occursOn(note, source, from)) return allNotes;
    if (from === to && note.time === newTime) return allNotes;
    const next = { ...allNotes };
    const recurring = note.repeat && note.repeat !== 'none';
    if (recurring) {
        next[source] = next[source].map(item => item.id === id
            ? { ...item, excludedDates: [...(item.excludedDates || []), from] } : item);
    } else {
        next[source] = next[source].filter(item => item.id !== id);
        if (!next[source].length) delete next[source];
    }
    const moved = {
        ...note, id: recurring ? newId : id, repeat: 'none', repeatUntil: '', excludedDates: [],
        ...(newTime !== undefined ? { time: newTime } : {}),
        reminder: { enabled: false, intervals: [], ...note.reminder, notified: [], snoozes: {} },
    };
    next[to] = [...(next[to] || []), moved];
    return next;
}

export function dueReminders(allNotes, now = new Date()) {
    const due = [];
    for (const [sourceDateKey, notes] of Object.entries(allNotes)) {
        for (const note of notes) {
            for (const [dateKey, fireAt] of Object.entries(note.reminder?.snoozes || {})) {
                if (!occursOn(note, sourceDateKey, dateKey) || !Number.isFinite(fireAt)) continue;
                const notificationKey = `snooze:${dateKey}:${fireAt}`;
                if (now.getTime() >= fireAt && !(note.reminder.notified || []).includes(notificationKey)) {
                    due.push({ note: { ...note, sourceDateKey }, dateKey, interval: 'snooze', notificationKey, fireAt });
                }
            }
        }
    }
    // Covers the 24h catch-up window and the longest advance reminder (one week).
    // Two past calendar dates also cover a 23-hour day at the spring DST transition.
    for (let offset = -2; offset <= 7; offset++) {
        const date = new Date(now);
        date.setDate(date.getDate() + offset);
        const dateKey = dateKeyOf(date);
        for (const note of notesForDate(allNotes, dateKey)) {
            const reminder = note.reminder;
            if (!reminder?.enabled) continue;
            for (const interval of reminder.intervals || []) {
                if (!Object.hasOwn(REMINDER_DAYS, interval)) continue;
                const notificationKey = `${dateKey}:${interval}`;
                const notified = reminder.notified || [];
                if (notified.includes(notificationKey)
                    || (dateKey === note.sourceDateKey && notified.includes(interval))) continue;
                const fireAt = localDate(dateKey, note.time);
                fireAt.setDate(fireAt.getDate() - REMINDER_DAYS[interval]);
                const elapsed = now.getTime() - fireAt.getTime();
                if (elapsed >= 0 && elapsed < 24 * 60 * 60 * 1000) {
                    due.push({ note, dateKey, interval, notificationKey, fireAt: fireAt.getTime() });
                }
            }
        }
    }
    return due.sort((a, b) => a.fireAt - b.fireAt);
}
