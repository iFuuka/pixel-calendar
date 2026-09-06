import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeatherClient, parseWeather, WEATHER_REFRESH_MS, WEATHER_STALE_MS } from '../src/utils/weather.js';
import { eventWeather } from '../src/utils/eventWeather.js';
import { localDate, moveOccurrence, notesForDate } from '../src/utils/events.js';
import { createBackup, parseBackup, validateNotes } from '../src/utils/backup.js';

const fixture = (temp = 18) => ({ daily: { time: ['2026-09-10'], temperature_2m_max: [temp] },
    hourly: { time: ['2026-09-10T18:00'], temperature_2m: [temp], precipitation_probability: [70] } });
const response = data => ({ ok: true, json: async () => data });
const storage = () => { const values = new Map(); return { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) }; };

test('missing weather fields remain unknown instead of becoming zero', () => {
    const data = fixture(); data.hourly.temperature_2m[0] = null; delete data.hourly.precipitation_probability;
    const parsed = parseWeather(data)['2026-09-10'];
    assert.equal(parsed.hourly[0].temp, null); assert.equal(parsed.hourly[0].precipProb, null);
    assert.throws(() => parseWeather({ daily: {} }), /Incomplete/);
});

test('current conditions belong only to their own forecast date and retain daily values', () => {
    const data = fixture();
    data.daily.time.push('2026-09-11');
    data.daily.weather_code = [61, 3];
    data.current = { time: '2026-09-10T18:00', weather_code: 0, is_day: 1, wind_speed_10m: 13.7 };
    const parsed = parseWeather(data);
    assert.equal(parsed['2026-09-10'].code, 61);
    assert.equal(parsed['2026-09-10'].currentCode, 0);
    assert.equal(parsed['2026-09-10'].currentIsDay, 1);
    assert.equal(parsed['2026-09-10'].currentTime, '2026-09-10T18:00');
    assert.equal(parsed['2026-09-10'].currentWindSpeed, 14);
    assert.equal(parsed['2026-09-11'].code, 3);
    assert.equal(Object.hasOwn(parsed['2026-09-11'], 'currentTime'), false);
    data.current.weather_code = null; data.current.is_day = '1';
    const missing = parseWeather(data)['2026-09-10'];
    assert.equal(missing.currentCode, null); assert.equal(missing.currentIsDay, null);
    data.current.time = 0;
    assert.equal(Object.hasOwn(parseWeather(data)['2026-09-10'], 'currentTime'), false);
});

test('deduplicates refreshes and ignores a previous location response even if abort is ignored', async () => {
    const requests = [];
    const client = createWeatherClient({ storage: storage(), timezone: 'Europe/Moscow', request: (url, options) => new Promise(resolve => requests.push({ url, options, resolve })) });
    const first = client.select(1, 2); const duplicate = client.refresh(true);
    assert.equal(first, duplicate); assert.equal(requests.length, 1);
    assert.match(requests[0].url, /timezone=Europe%2FMoscow/);
    assert.deepEqual(new URL(requests[0].url).searchParams.get('current').split(','), ['wind_speed_10m', 'weather_code', 'is_day']);
    const second = client.select(3, 4);
    assert.equal(requests[0].options.signal.aborted, true);
    requests[1].resolve(response(fixture(25))); await second;
    requests[0].resolve(response(fixture(-10))); await first;
    assert.equal(client.snapshot().weatherMap['2026-09-10'].tempMax, 25);
    assert.equal(client.snapshot().loading, false);
});

test('refresh cadence, retry after offline failure, cache retention and stale cache after restart', async () => {
    let clock = 100000000, calls = 0, offline = false;
    const disk = storage();
    const request = async () => { calls++; if (offline) throw new Error('offline'); return response(fixture()); };
    const client = createWeatherClient({ request, storage: disk, now: () => clock, timezone: 'UTC' });
    await client.select(1, 2); const savedAt = client.snapshot().lastUpdated;
    clock += WEATHER_REFRESH_MS - 1; await client.refresh(); assert.equal(calls, 1);
    clock++; offline = true; await client.refresh();
    assert.equal(calls, 2); assert.equal(client.snapshot().lastUpdated, savedAt);
    assert.equal(client.snapshot().usingCache, true); assert.ok(client.snapshot().weatherMap['2026-09-10']);
    clock += 4 * 60000; await client.refresh(); assert.equal(calls, 2);
    clock += 60000; await client.refresh(); assert.equal(calls, 3);
    clock += WEATHER_STALE_MS;
    const restarted = createWeatherClient({ request, storage: disk, now: () => clock, timezone: 'UTC' });
    await restarted.select(1, 2); assert.equal(restarted.snapshot().lastUpdated, savedAt);
    assert.ok(restarted.snapshot().weatherMap['2026-09-10']);
    offline = false; await restarted.refresh(true);
    assert.equal(restarted.snapshot().lastUpdated, clock); assert.equal(restarted.snapshot().error, null);
});

test('different timezone cache is rejected; storage errors do not discard a live response', async () => {
    const disk = storage();
    const client = createWeatherClient({ storage: disk, timezone: 'UTC', request: async () => response(fixture()) });
    await client.select(1, 2);
    const other = createWeatherClient({ storage: disk, timezone: 'Asia/Tokyo', request: async () => { throw new Error('offline'); } });
    await other.select(1, 2); assert.deepEqual(other.snapshot().weatherMap, {});
    const full = createWeatherClient({ storage: { getItem() { throw Error('denied'); }, setItem() { throw Error('full'); } }, request: async () => response(fixture()) });
    await full.select(1, 2); assert.ok(full.snapshot().lastUpdated); assert.equal(full.snapshot().error, null);
});

test('cancelled request cannot publish after unmount', async () => {
    let resolve;
    const client = createWeatherClient({ storage: storage(), request: () => new Promise(done => { resolve = done; }) });
    const pending = client.select(1, 2); client.cancel(); resolve(response(fixture())); await pending;
    assert.equal(client.snapshot().lastUpdated, null);
});

test('resume retires a pre-sleep hung request and starts a fresh one', async () => {
    let clock = 1000000;
    const requests = [];
    const client = createWeatherClient({ storage: storage(), now: () => clock,
        request: (_url, options) => new Promise(resolve => requests.push({ resolve, options })) });
    const first = client.select(1, 2); clock += 3600000;
    const fresh = client.refresh(true);
    assert.equal(requests.length, 2); assert.equal(requests[0].options.signal.aborted, true);
    requests[1].resolve(response(fixture(30))); await fresh;
    requests[0].resolve(response(fixture(10))); await first;
    assert.equal(client.snapshot().weatherMap['2026-09-10'].tempMax, 30);
});

test('event precipitation uses the following API sample across midnight; final hour stays unknown', () => {
    const parsed = parseWeather({ daily: { time: ['2026-09-10', '2026-09-11'] }, hourly: {
        time: ['2026-09-10T23:00', '2026-09-11T00:00'], temperature_2m: [18, 17], precipitation_probability: [1, 85],
    } });
    const result = eventWeather({ ...args, note: { ...note, time: '23:30' }, weather: parsed[day] });
    assert.equal(result.sample.precipProb, 85); assert.equal(result.status, 'adverse');
    assert.equal(parsed['2026-09-11'].hourly[0].intervalPrecipProb, null);
});

const day = '2026-09-10', now = localDate(day, '06:00').getTime();
const note = { id: 'walk', text: 'Walk', outdoor: true, time: '18:30', repeat: 'daily' };
const weather = { hourly: Array.from({ length: 24 }, (_, hour) => ({ hour, temp: 20, precipProb: hour === 19 ? 80 : 10 })) };
const args = { note, dateKey: day, now, lastUpdated: now, weather };

test('hour selection and candidate ranking respect starts, daytime, future time and thresholds', () => {
    const result = eventWeather({ ...args, notes: [note, { id: 'busy', time: '17:30' }, { id: 'all-day', time: '' }] });
    assert.equal(result.sample.hour, 18); assert.equal(result.status, 'adverse'); assert.equal(result.untimed, true);
    assert.equal(result.suggestions.length, 3);
    assert.ok(result.suggestions.every(item => item.hour >= 7 && item.hour <= 21 && item.hour !== 17 && item.hour !== 18));
    const late = eventWeather({ ...args, now: localDate(day, '18:15').getTime(), lastUpdated: localDate(day, '18:15').getTime() });
    assert.ok(late.suggestions.every(item => item.hour >= 19));
    assert.equal(eventWeather({ ...args, weather: { hourly: weather.hourly.map(h => ({ ...h, temp: 35 })) } }).suggestions.length, 0);
});

test('honest states suppress suggestions for stale, absent, incomplete and past data', () => {
    for (const [patch, status] of [
        [{ note: { ...note, outdoor: false } }, 'indoor'], [{ note: { ...note, time: '' } }, 'needsTime'],
        [{ lastUpdated: null, weather: null }, 'missing'], [{ weather: null }, 'outsideRange'],
        [{ lastUpdated: now - WEATHER_STALE_MS - 1 }, 'stale'],
        [{ weather: { hourly: [{ hour: 18, temp: 20, precipProb: null }] } }, 'incomplete'],
        [{ now: localDate(day, '19:00').getTime() }, 'past'],
    ]) { const result = eventWeather({ ...args, ...patch }); assert.equal(result.status, status); assert.deepEqual(result.suggestions, []); }
});

test('same-day time change detaches only selected recurrence and survives notes/full backup', () => {
    for (const from of [day, '2026-09-11']) {
        const original = { [day]: [{ ...note, reminder: { enabled: true, intervals: ['same-day'], notified: ['old'], snoozes: { [from]: now } } }] };
        const moved = moveOccurrence(original, from, from, 'walk', 'detached', '15:00');
        const chosen = notesForDate(moved, from);
        assert.equal(chosen.length, 1); assert.equal(chosen[0].time, '15:00'); assert.equal(chosen[0].outdoor, true);
        assert.equal(chosen[0].repeat, 'none'); assert.deepEqual(chosen[0].reminder.notified, []); assert.deepEqual(chosen[0].reminder.snoozes, {});
        assert.equal(notesForDate(moved, '2026-09-12')[0].time, '18:30');
        assert.equal(original[day][0].excludedDates, undefined);
        assert.deepEqual(validateNotes(JSON.parse(JSON.stringify(moved))), moved);
        const backup = createBackup(storage()); backup.data.notes = moved;
        assert.deepEqual(parseBackup(JSON.stringify(backup)).data.notes, moved);
    }
    assert.throws(() => validateNotes({ [day]: [{ ...note, outdoor: 'yes' }] }));
});

test('one-off same-day time change preserves ID and rejects invalid/no-op times', () => {
    const original = { [day]: [{ ...note, repeat: 'none' }] };
    assert.equal(moveOccurrence(original, day, day, 'walk', 'unused', '15:00')[day][0].id, 'walk');
    for (const time of ['25:00', '', '18:30']) assert.equal(moveOccurrence(original, day, day, 'walk', 'unused', time), original);
});
