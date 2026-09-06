import { isDateKey, isEventTime, REPEAT_OPTIONS, REMINDER_DAYS } from './events.js';

export const BACKUP_FORMAT = 'pixel-calendar-backup';
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
export const RECOVERY_KEY = 'pixel-calendar-before-restore';
export const DATA_KEYS = {
    notes: 'pixel-calendar-notes',
    settings: 'pixel-calendar-settings',
    habits: 'pixel-calendar-habits',
    moods: 'pixel-calendar-moods',
    dayMeta: 'pixel-calendar-day-meta',
    countdowns: 'pixel-calendar-countdowns',
};
const DEFAULT_DATA = { notes: {}, settings: {}, habits: { habits: [], checks: {} }, moods: {}, dayMeta: {}, countdowns: [] };
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
function requireValid(condition) { if (!condition) throw new Error('Invalid backup data'); }

function validateDateMap(value, validate) {
    requireValid(object(value));
    for (const [key, item] of Object.entries(value)) {
        requireValid(isDateKey(key));
        validate(item, key);
    }
}

export function validateNotes(value) {
    const ids = new Set();
    validateDateMap(value, (notes, dateKey) => {
        requireValid(Array.isArray(notes));
        for (const note of notes) {
            requireValid(object(note) && nonempty(note.id) && nonempty(note.text) && !ids.has(note.id));
            ids.add(note.id);
            if (note.createdAt !== undefined) requireValid(Number.isFinite(note.createdAt));
            if (note.tags !== undefined) requireValid(strings(note.tags));
            if (note.time !== undefined) requireValid(isEventTime(note.time));
            if (note.outdoor !== undefined) requireValid(typeof note.outdoor === 'boolean');
            if (note.repeat !== undefined) requireValid(REPEAT_OPTIONS.includes(note.repeat));
            if (note.repeatUntil) requireValid(isDateKey(note.repeatUntil) && note.repeatUntil >= dateKey);
            if (note.excludedDates !== undefined) requireValid(Array.isArray(note.excludedDates) && note.excludedDates.every(isDateKey));
            if (note.reminder != null) {
                const reminder = note.reminder;
                requireValid(object(reminder) && typeof reminder.enabled === 'boolean');
                requireValid(Array.isArray(reminder.intervals) && reminder.intervals.every(key => Object.hasOwn(REMINDER_DAYS, key)));
                if (reminder.notified !== undefined) requireValid(strings(reminder.notified));
                if (reminder.snoozes !== undefined) validateDateMap(reminder.snoozes, at => requireValid(Number.isSafeInteger(at) && at > 0));
            }
        }
    });
    return value;
}

function validateSettings(settings) {
    requireValid(object(settings));
    const booleans = ['autoStart', 'startMinimized', 'holidaysEnabled', 'soundEnabled', 'weatherAlertsEnabled', 'updateAlertsEnabled', 'decorationsEnabled', 'windowBackgroundEnabled', 'customThemeEnabled'];
    const textKeys = ['city', 'locationName', 'holidayCountry'];
    const enums = {
        tempUnit: ['C', 'F'], firstDayOfWeek: [0, 1], language: ['en', 'ru', 'ja', 'ko'],
        theme: ['vanilla-sky', 'lavender-night', 'matcha-box', 'autumn-sunset', 'terraria-forest'],
        timeFormat: ['12', '24'], fontFamily: ['pixel', 'classic'],
    };
    for (const [key, value] of Object.entries(settings)) {
        if (booleans.includes(key)) requireValid(typeof value === 'boolean');
        else if (textKeys.includes(key)) requireValid(typeof value === 'string');
        else if (Object.hasOwn(enums, key)) requireValid(enums[key].includes(value));
        else if (key === 'lat' || key === 'lon') requireValid(Number.isFinite(value) && Math.abs(value) <= (key === 'lat' ? 90 : 180));
        else if (key === 'customColors') {
            requireValid(object(value));
            for (const color of ['bg', 'surface', 'accent', 'text']) requireValid(/^#[\da-f]{6}$/i.test(value[color]));
        } else requireValid(false);
    }
}

export function validateBackup(backup) {
    requireValid(object(backup) && backup.format === BACKUP_FORMAT && backup.version === BACKUP_VERSION);
    requireValid(typeof backup.createdAt === 'string' && Number.isFinite(Date.parse(backup.createdAt)));
    const data = backup.data;
    requireValid(object(data) && Object.keys(DATA_KEYS).every(key => Object.hasOwn(data, key)));
    validateNotes(data.notes);
    validateSettings(data.settings);
    requireValid(object(data.habits) && Array.isArray(data.habits.habits));
    const habitIds = new Set();
    for (const habit of data.habits.habits) {
        requireValid(object(habit) && nonempty(habit.id) && nonempty(habit.name) && typeof habit.icon === 'string' && !habitIds.has(habit.id));
        habitIds.add(habit.id);
    }
    validateDateMap(data.habits.checks, item => requireValid(strings(item)));
    validateDateMap(data.moods, item => requireValid(typeof item === 'string'));
    validateDateMap(data.dayMeta, item => {
        requireValid(object(item));
        if (item.color != null) requireValid(typeof item.color === 'string');
        if (item.stickers !== undefined) requireValid(strings(item.stickers));
    });
    requireValid(Array.isArray(data.countdowns));
    const countdownIds = new Set();
    for (const countdown of data.countdowns) {
        requireValid(object(countdown) && nonempty(countdown.id) && !countdownIds.has(countdown.id)
            && isDateKey(countdown.dateKey) && nonempty(countdown.label) && typeof countdown.emoji === 'string');
        countdownIds.add(countdown.id);
    }
    return backup;
}

export function createBackup(storage, now = new Date()) {
    const data = Object.fromEntries(Object.entries(DATA_KEYS).map(([name, key]) => {
        const raw = storage.getItem(key);
        return [name, raw === null ? structuredClone(DEFAULT_DATA[name]) : JSON.parse(raw)];
    }));
    return validateBackup({ format: BACKUP_FORMAT, version: BACKUP_VERSION, createdAt: now.toISOString(), data });
}

export function parseBackup(text) {
    requireValid(typeof text === 'string' && new TextEncoder().encode(text).length <= MAX_BACKUP_BYTES);
    const backup = JSON.parse(text, (key, value) => {
        requireValid(!['__proto__', 'prototype', 'constructor'].includes(key));
        return value;
    });
    return validateBackup(backup);
}

export function backupCounts(backup) {
    const { notes, habits, moods, dayMeta, countdowns } = backup.data;
    return {
        notes: Object.values(notes).reduce((total, list) => total + list.length, 0),
        habits: habits.habits.length, moods: Object.keys(moods).length,
        dayMeta: Object.keys(dayMeta).length, countdowns: countdowns.length,
    };
}

export function restoreBackup(storage, backup) {
    validateBackup(backup);
    const before = Object.fromEntries(Object.values(DATA_KEYS).map(key => [key, storage.getItem(key)]));
    // Save a recoverable copy before writing any user data. Fail closed if storage is full.
    storage.setItem(RECOVERY_KEY, JSON.stringify(createBackup(storage)));
    try {
        for (const [name, key] of Object.entries(DATA_KEYS)) storage.setItem(key, JSON.stringify(backup.data[name]));
    } catch (error) {
        // Remove partial writes first, to free space even after a quota failure.
        for (const key of Object.values(DATA_KEYS)) storage.removeItem(key);
        for (const [key, raw] of Object.entries(before)) if (raw !== null) storage.setItem(key, raw);
        throw error;
    }
}
