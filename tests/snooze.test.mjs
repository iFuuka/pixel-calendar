import test from 'node:test';
import assert from 'node:assert/strict';
import { localDate, dueReminders } from '../src/utils/events.js';
import { createBackup, parseBackup } from '../src/utils/backup.js';

test('snoozed occurrence survives JSON round trip, fires once due, and can be postponed again', () => {
    const at = localDate('2026-09-07', '18:45').getTime();
    const notes = { '2026-09-07': [{ id: 'n', text: 'Lesson', repeat: 'weekly', reminder: { enabled: true, intervals: ['same-day'], notified: ['2026-09-07:same-day'], snoozes: { '2026-09-07': at } } }] };
    assert.equal(dueReminders(notes, new Date(at - 1)).length, 0);
    const restored = JSON.parse(JSON.stringify(notes));
    const due = dueReminders(restored, new Date(at));
    assert.equal(due.length, 1);
    assert.equal(due[0].interval, 'snooze');
    restored['2026-09-07'][0].reminder.notified.push(due[0].notificationKey);
    assert.equal(dueReminders(restored, new Date(at)).length, 0);
    restored['2026-09-07'][0].reminder.snoozes['2026-09-07'] = at + 900000;
    assert.equal(dueReminders(restored, new Date(at + 900000)).length, 1);
    restored['2026-09-07'][0].excludedDates = ['2026-09-07'];
    assert.equal(dueReminders(restored, new Date(at + 900000)).length, 0);
});

test('full backup preserves pending snoozes and rejects malformed deadlines', () => {
    const backup = createBackup({ getItem: () => null });
    const snoozes = { '2026-09-07': 1788800000000 };
    backup.data.notes = { '2026-09-07': [{ id: 'n', text: 'Test', reminder: { enabled: true, intervals: [], snoozes } }] };
    assert.deepEqual(parseBackup(JSON.stringify(backup)).data.notes['2026-09-07'][0].reminder.snoozes, snoozes);
    snoozes['2026-09-07'] = 'bad';
    assert.throws(() => parseBackup(JSON.stringify(backup)));
});
