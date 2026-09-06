import test from 'node:test';
import assert from 'node:assert/strict';
import { getWindowScene, sceneWeather } from '../src/utils/windowScene.js';
import { WEATHER_STALE_MS } from '../src/utils/weather.js';

const sceneAt = (iso, patch = {}) => {
    const date = new Date(iso);
    return getWindowScene({ date, now: date.getTime(), lastUpdated: date.getTime(), lat: 45, ...patch });
};
const noon = '2026-09-10T12:00';

test('meteorological seasons change on month boundaries and invert in the southern hemisphere', () => {
    for (const [day, north, south] of [
        ['2026-02-28', 'winter', 'summer'], ['2026-03-01', 'spring', 'autumn'],
        ['2026-05-31', 'spring', 'autumn'], ['2026-06-01', 'summer', 'winter'],
        ['2026-08-31', 'summer', 'winter'], ['2026-09-01', 'autumn', 'spring'],
        ['2026-11-30', 'autumn', 'spring'], ['2026-12-01', 'winter', 'summer'],
        ['2027-01-01', 'winter', 'summer'],
    ]) {
        assert.equal(sceneAt(`${day}T12:00`).season, north, day);
        assert.equal(sceneAt(`${day}T12:00`, { lat: -33 }).season, south, day);
    }
    assert.equal(sceneAt(noon, { lat: 0 }).season, 'autumn');
    assert.equal(sceneAt(noon, { lat: undefined }).season, 'autumn');
});

test('weather scenes use the documented WMO groups without coercing missing values to clear', () => {
    for (const [condition, codes] of Object.entries({
        clear: [0, 1], cloudy: [2, 3], fog: [45, 48],
        rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
        snow: [71, 73, 75, 77, 85, 86], storm: [95, 96, 99],
        unknown: [null, undefined, NaN, '', '0', false, -1, 4, 100],
    })) for (const code of codes) assert.equal(sceneWeather(code), condition, String(code));
});

test('fresh current conditions take priority over the daily maximum severity forecast', () => {
    const weather = { code: 95, currentCode: 0, currentTime: '2026-09-10T11:45' };
    const current = sceneAt(noon, { weather });
    assert.equal(current.weather, 'clear'); assert.equal(current.weatherSource, 'current');
    for (const currentTime of [null, 'not a date', '2026-09-09T12:00', '2026-09-10T12:15', '2026-09-10T10:29']) {
        const daily = sceneAt(noon, { weather: { ...weather, currentTime } });
        assert.equal(daily.weather, 'storm', String(currentTime)); assert.equal(daily.weatherSource, 'forecast');
    }
    const boundary = sceneAt(noon, { weather: { ...weather, currentTime: '2026-09-10T10:30' } });
    assert.equal(boundary.weatherSource, 'current');
    assert.equal(sceneAt(noon, { weather: { ...weather, currentCode: null } }).weatherSource, 'forecast');
});

test('fresh legacy cache uses its daily forecast while missing, stale or future-dated cache stays neutral', () => {
    const now = new Date(noon).getTime();
    const weather = { code: 61, currentCode: 71, currentTime: noon };
    const legacy = sceneAt(noon, { weather: { code: 61 } });
    assert.equal(legacy.weather, 'rain'); assert.equal(legacy.weatherSource, 'forecast');
    for (const patch of [
        { weather: null }, { weather: {} }, { weather, lastUpdated: null },
        { weather, lastUpdated: now - WEATHER_STALE_MS - 1 }, { weather, lastUpdated: now + 1 },
    ]) {
        const result = sceneAt(noon, patch);
        assert.equal(result.weather, 'unknown'); assert.equal(result.weatherSource, 'unknown');
    }
    assert.equal(sceneAt(noon, { weather: { code: 61 }, lastUpdated: now - WEATHER_STALE_MS }).weather, 'rain');
});

test('sunrise and sunset control local day, warm twilight and night at their boundaries', () => {
    const weather = { sunrise: '2026-09-10T05:00', sunset: '2026-09-10T20:00' };
    for (const [time, phase] of [
        ['04:29:59', 'night'], ['04:30', 'dusk'], ['05:00', 'dusk'], ['05:30', 'day'],
        ['12:00', 'day'], ['19:29:59', 'day'], ['19:30', 'dusk'], ['20:00', 'dusk'],
        ['20:30', 'night'], ['23:59', 'night'],
    ]) assert.equal(sceneAt(`2026-09-10T${time}`, { weather }).phase, phase, time);
});

test('unusable sunrise/sunset values fall back to current daylight, including polar day and polar night', () => {
    for (const solar of [
        {}, { sunrise: null, sunset: null },
        { sunrise: '1970-01-01T00:00', sunset: '1970-01-01T00:00' },
        { sunrise: '2026-09-10T00:00', sunset: '2026-09-10T00:00' },
        { sunrise: '2026-09-10T22:00', sunset: '2026-09-10T02:00' },
        { sunrise: '2026-09-10T25:00', sunset: '2026-09-10T20:00' },
    ]) {
        assert.equal(sceneAt('2026-09-10T23:00', { lat: 80,
            weather: { ...solar, currentTime: '2026-09-10T23:00', currentIsDay: 1 } }).phase, 'day');
        assert.equal(sceneAt(noon, { lat: 80,
            weather: { ...solar, currentTime: noon, currentIsDay: 0 } }).phase, 'night');
    }
});

test('clock fallback works offline and ignores expired daylight flags', () => {
    for (const [time, phase] of [['05:59', 'night'], ['06:00', 'dusk'], ['07:00', 'day'], ['18:00', 'dusk'], ['19:00', 'night']]) {
        assert.equal(sceneAt(`2026-09-10T${time}`, { weather: null, lastUpdated: null }).phase, phase);
    }
    const weather = { currentIsDay: 0, currentTime: '2026-09-10T08:00' };
    assert.equal(sceneAt(noon, { weather }).phase, 'day');
    assert.equal(sceneAt(noon, { weather: { ...weather, currentTime: noon }, lastUpdated: null }).phase, 'day');
});
