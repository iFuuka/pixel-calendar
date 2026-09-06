import test from 'node:test';
import assert from 'node:assert/strict';
import { backupCounts, createBackup, DATA_KEYS, parseBackup, RECOVERY_KEY, restoreBackup, validateNotes } from '../src/utils/backup.js';

class MemoryStorage {
    data = new Map();
    failOn = null;
    getItem(key) { return this.data.get(key) ?? null; }
    removeItem(key) { this.data.delete(key); }
    setItem(key, value) {
        if (this.failOn === key) { this.failOn = null; throw new Error('Quota exceeded'); }
        this.data.set(key, String(value));
    }
}

function fixture() {
    const backup = createBackup(new MemoryStorage());
    backup.data = {
        notes: { '2026-09-07': [{ id: 'n1', text: 'Japanese', time: '18:30', repeat: 'weekly', repeatUntil: '2026-12-31', excludedDates: ['2026-09-14'], tags: ['study'], reminder: { enabled: true, intervals: ['same-day'], notified: ['2026-09-07:same-day'] } }] },
        settings: { language: 'ru', theme: 'matcha-box', lat: 35, lon: 139, customColors: { bg: '#ffffff', surface: '#eeeeee', accent: '#abcdef', text: '#000000' } },
        habits: { habits: [{ id: 'h1', name: 'Read', icon: 'Book' }], checks: { '2026-09-07': ['h1'] } },
        moods: { '2026-09-07': 'happy' }, dayMeta: { '2026-09-07': { color: '#123456', stickers: ['star'] } },
        countdowns: [{ id: 'cd1', dateKey: '2026-12-31', label: 'Holiday', emoji: 'star' }],
    };
    return backup;
}

test('full backup round trip restores every category and preserves a recovery copy', () => {
    const storage = new MemoryStorage();
    storage.setItem(DATA_KEYS.notes, JSON.stringify({ '2026-01-01': [{ id: 'old', text: 'Before restore' }] }));
    storage.setItem('unrelated-data', 'untouched');
    const before = createBackup(storage);
    const backup = parseBackup(JSON.stringify(fixture()));
    restoreBackup(storage, backup);
    assert.deepEqual(createBackup(storage).data, backup.data);
    assert.deepEqual(parseBackup(storage.getItem(RECOVERY_KEY)).data, before.data);
    assert.equal(storage.getItem('unrelated-data'), 'untouched');
    assert.deepEqual(backupCounts(backup), { notes: 1, habits: 1, moods: 1, dayMeta: 1, countdowns: 1 });
});

test('window background preference round trips while backups made before it remain valid', () => {
    for (const windowBackgroundEnabled of [false, true]) {
        const original = new MemoryStorage();
        original.setItem(DATA_KEYS.settings, JSON.stringify({ language: 'ru', windowBackgroundEnabled }));
        const backup = parseBackup(JSON.stringify(createBackup(original)));
        const restored = new MemoryStorage();
        restoreBackup(restored, backup);
        assert.equal(JSON.parse(restored.getItem(DATA_KEYS.settings)).windowBackgroundEnabled, windowBackgroundEnabled);
        assert.deepEqual(createBackup(restored).data, backup.data);
    }

    const legacy = parseBackup(JSON.stringify(fixture()));
    const restored = new MemoryStorage();
    restoreBackup(restored, legacy);
    assert.deepEqual(createBackup(restored).data, legacy.data);
    assert.equal(Object.hasOwn(JSON.parse(restored.getItem(DATA_KEYS.settings)), 'windowBackgroundEnabled'), false);

    for (const invalid of ['false', 0, null, {}]) {
        const backup = fixture();
        backup.data.settings.windowBackgroundEnabled = invalid;
        assert.throws(() => parseBackup(JSON.stringify(backup)), /Invalid backup data/);
    }
});

test('invalid, incomplete, future-version and prototype-bearing files are rejected before writes', () => {
    const variants = [null, [], {}, { ...fixture(), version: 999 }];
    const missing = fixture(); delete missing.data.moods; variants.push(missing);
    const invalidTime = fixture(); invalidTime.data.notes['2026-09-07'][0].time = '29:99'; variants.push(invalidTime);
    const invalidDate = fixture(); invalidDate.data.notes['2026-02-30'] = []; variants.push(invalidDate);
    const invalidReminder = fixture(); invalidReminder.data.notes['2026-09-07'][0].reminder.intervals = ['constructor']; variants.push(invalidReminder);
    const invalidTheme = fixture(); invalidTheme.data.settings.theme = {}; variants.push(invalidTheme);
    const invalidChecks = fixture(); invalidChecks.data.habits.checks['2026-09-07'] = {}; variants.push(invalidChecks);
    for (const value of variants) assert.throws(() => parseBackup(JSON.stringify(value)));
    assert.throws(() => parseBackup('{"__proto__":{}}'));
    const storage = new MemoryStorage();
    storage.setItem(DATA_KEYS.moods, '{"2026-01-01":"calm"}');
    const before = [...storage.data];
    assert.throws(() => restoreBackup(storage, missing));
    assert.deepEqual([...storage.data], before);
});

test('storage failure during restore rolls back all user data', () => {
    const storage = new MemoryStorage();
    storage.setItem(DATA_KEYS.notes, '{"2026-01-01":[{"id":"old","text":"Keep me"}]}');
    const before = createBackup(storage);
    storage.failOn = DATA_KEYS.habits;
    assert.throws(() => restoreBackup(storage, fixture()), /Quota/);
    assert.deepEqual(createBackup(storage).data, before.data);
    assert.equal(storage.getItem(DATA_KEYS.settings), null);
});

test('cannot start restore when the recovery copy cannot be saved', () => {
    const storage = new MemoryStorage();
    const before = [...storage.data];
    storage.failOn = RECOVERY_KEY;
    assert.throws(() => restoreBackup(storage, fixture()), /Quota/);
    assert.deepEqual([...storage.data], before);
});

test('legacy note exports remain supported but malformed and duplicate notes are rejected', () => {
    assert.doesNotThrow(() => validateNotes({ '2026-09-07': [{ id: 'old', text: 'Old note' }] }));
    assert.throws(() => validateNotes({ '2026-09-07': [null] }));
    assert.throws(() => validateNotes({ '2026-09-07': [{ id: 'a', text: {} }] }));
    assert.throws(() => validateNotes({ '2026-09-07': [{ id: 'a', text: 'a' }, { id: 'a', text: 'b' }] }));
});
