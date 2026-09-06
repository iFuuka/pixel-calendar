import test from 'node:test';
import assert from 'node:assert/strict';
import { dateKeyOf, dueReminders, isDateKey, localDate, moveOccurrence, notesForDate } from '../src/utils/events.js';

const event = (extra = {}) => ({ id: 'lesson', text: 'Japanese', createdAt: 1, time: '18:30', repeat: 'weekly', ...extra });
const reminder = { enabled: true, intervals: ['same-day'], notified: [] };

test('old notes stay on their date; timed events sort chronologically', () => {
    const notes = { '2026-09-07': [event({ id: 'late' }), event({ id: 'early', time: '08:00' }), { id: 'old', text: 'Old note' }] };
    assert.deepEqual(notesForDate(notes, '2026-09-07').map(n => n.id), ['old', 'early', 'late']);
    assert.equal(notesForDate(notes, '2026-09-08').length, 0);
    assert.equal(notesForDate(notes, '2026-09-14').length, 2);
    assert.equal(notesForDate(notes, '2026-08-31').length, 0);
});

test('daily and weekly series respect inclusive end date and exclusions', () => {
    const notes = { '2026-09-07': [event({ repeat: 'daily', repeatUntil: '2026-09-10', excludedDates: ['2026-09-08'] })] };
    assert.equal(notesForDate(notes, '2026-09-08').length, 0);
    assert.equal(notesForDate(notes, '2026-09-10').length, 1);
    assert.equal(notesForDate(notes, '2026-09-11').length, 0);
});

test('monthly and yearly recurrences skip missing dates without drifting', () => {
    const monthly = { '2026-01-31': [event({ repeat: 'monthly' })] };
    assert.equal(notesForDate(monthly, '2026-02-28').length, 0);
    assert.equal(notesForDate(monthly, '2026-03-31').length, 1);
    const yearly = { '2024-02-29': [event({ repeat: 'yearly' })] };
    assert.equal(notesForDate(yearly, '2025-02-28').length, 0);
    assert.equal(notesForDate(yearly, '2028-02-29').length, 1);
});

test('moving one recurrence detaches only that occurrence, including the first', () => {
    for (const from of ['2026-09-07', '2026-09-14']) {
        const original = { '2026-09-07': [event({ reminder })] };
        const moved = moveOccurrence(original, from, '2026-09-15', 'lesson', 'detached');
        assert.equal(notesForDate(moved, from).length, 0);
        assert.equal(notesForDate(moved, '2026-09-21').length, 1);
        assert.equal(notesForDate(moved, '2026-09-15')[0].repeat, 'none');
        assert.equal(original['2026-09-07'][0].excludedDates, undefined);
        assert.equal(notesForDate(moved, '2026-09-22').length, 0);
    }
});

test('moving a one-off keeps its id and resets reminder receipts', () => {
    const moved = moveOccurrence({ '2026-09-07': [event({ repeat: 'none', reminder: { ...reminder, notified: ['same-day'] } })] }, '2026-09-07', '2026-09-08', 'lesson');
    assert.equal(moved['2026-09-07'], undefined);
    assert.equal(moved['2026-09-08'][0].id, 'lesson');
    assert.deepEqual(moved['2026-09-08'][0].reminder.notified, []);
});

test('reminders use exact event time and catch up for less than 24 hours', () => {
    const notes = { '2026-09-07': [event({ repeat: 'none', reminder })] };
    assert.equal(dueReminders(notes, localDate('2026-09-07', '18:29')).length, 0);
    assert.equal(dueReminders(notes, localDate('2026-09-07', '18:30')).length, 1);
    assert.equal(dueReminders(notes, localDate('2026-09-08', '18:29')).length, 1);
    assert.equal(dueReminders(notes, localDate('2026-09-08', '18:30')).length, 0);
});

test('legacy receipt suppresses only original occurrence; new receipts survive restart', () => {
    const notes = { '2026-09-07': [event({ reminder: { ...reminder, notified: ['same-day'] } })] };
    assert.equal(dueReminders(notes, localDate('2026-09-07', '19:00')).length, 0);
    const next = dueReminders(notes, localDate('2026-09-14', '19:00'));
    assert.equal(next.length, 1);
    notes['2026-09-07'][0].reminder.notified.push(next[0].notificationKey);
    assert.equal(dueReminders(JSON.parse(JSON.stringify(notes)), localDate('2026-09-14', '19:00')).length, 0);
});

test('all-day reminders preserve 09:00; advance reminders cross month/year boundaries', () => {
    const notes = { '2027-01-04': [event({ time: '', reminder: { ...reminder, intervals: ['1-week'] } })] };
    assert.equal(dueReminders(notes, localDate('2026-12-28', '08:59')).length, 0);
    assert.equal(dueReminders(notes, localDate('2026-12-28', '09:00'))[0].dateKey, '2027-01-04');
});

test('advance reminders retain wall-clock time across daylight saving transitions', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
        const notes = { '2026-03-09': [event({ reminder: { ...reminder, intervals: ['1-week'] } })] };
        const result = dueReminders(notes, localDate('2026-03-02', '18:30'));
        assert.equal(result.length, 1);
        assert.equal(new Date(result[0].fireAt).getHours(), 18);
    } finally {
        if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
    }
});

test('date validation rejects impossible dates and handles years below 100', () => {
    for (const key of ['2026-02-29', '2026-13-01', '2026-04-31', '__proto__', '0000-01-01']) assert.equal(isDateKey(key), false);
    assert.equal(isDateKey('2028-02-29'), true);
    assert.equal(dateKeyOf(localDate('0099-01-02')), '0099-01-02');
});

test('catch-up includes a late Saturday event after a short DST Sunday', () => {
    const previous = process.env.TZ;
    process.env.TZ = 'America/New_York';
    try {
        const notes = { '2026-03-07': [event({ repeat: 'none', time: '23:30', reminder })] };
        assert.equal(dueReminders(notes, localDate('2026-03-09', '00:00')).length, 1);
    } finally {
        if (previous === undefined) delete process.env.TZ; else process.env.TZ = previous;
    }
});
