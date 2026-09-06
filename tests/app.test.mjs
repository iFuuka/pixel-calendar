import test, { after, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'FileReader', 'localStorage']) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.fetch = async () => { throw new Error('Offline test'); };
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const cacheDir = resolve('node_modules/.cache/pixel-calendar-tests');
await mkdir(cacheDir, { recursive: true });
const built = await build({
    entryPoints: ['src/App.jsx'], bundle: true, write: false, format: 'esm', platform: 'browser',
    external: ['react', 'react-dom', 'react-dom/client'], loader: { '.css': 'empty', '.png': 'dataurl' },
    jsx: 'automatic',
});
const output = resolve(cacheDir, 'app.mjs');
await writeFile(output, built.outputFiles[0].text);
const { default: App } = await import(pathToFileURL(output));
let root;

beforeEach(() => {
    globalThis.fetch = async () => { throw new Error('Offline test'); };
    delete window.electronWeather;
    localStorage.clear();
    localStorage.setItem('pixel-calendar-settings', JSON.stringify({ language: 'en', decorationsEnabled: false, updateAlertsEnabled: false, weatherAlertsEnabled: false }));
    root = createRoot(document.getElementById('root'));
});
afterEach(async () => { await act(async () => root.unmount()); });
after(() => dom.window.close());

const find = selector => {
    // jsdom's selector engine does not match quoted astral emoji attribute values.
    const unicodeAttribute = selector.match(/^\[([\w-]+)="([^"]*[\uD800-\uDBFF][\uDC00-\uDFFF][^"]*)"\]$/);
    const element = unicodeAttribute
        ? [...document.querySelectorAll(`[${unicodeAttribute[1]}]`)].find(item => item.getAttribute(unicodeAttribute[1]) === unicodeAttribute[2])
        : document.querySelector(selector);
    assert.ok(element, `Missing element: ${selector}`);
    return element;
};
async function click(selector) {
    await act(async () => find(selector).dispatchEvent(new MouseEvent('click', { bubbles: true })));
}
async function fill(selector, value) {
    await act(async () => {
        const element = find(selector);
        const prototype = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
        element.dispatchEvent(new Event('input', { bubbles: true }));
    });
}
async function select(selector, value) {
    await act(async () => {
        find(selector).value = value;
        find(selector).dispatchEvent(new Event('change', { bubbles: true }));
    });
}
async function openSceneAdmin() {
    for (let i = 0; i < 10; i++) await click('.author-name');
    await click('#admin-tab-scenery');
}
function backgroundScene() {
    const { season, weather, phase } = find('#root > .pixel-window').dataset;
    return { season, weather, phase };
}
function storedNotes() { return JSON.parse(localStorage.getItem('pixel-calendar-notes')); }
function todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function savePreview(name) {
    const files = (await readdir('src/components')).filter(file => file.endsWith('.css'));
    const css = (await Promise.all(['src/index.css', 'src/App.css', ...files.map(file => `src/components/${file}`)].map(file => readFile(file, 'utf8')))).join('\n');
    await mkdir('dist/review', { recursive: true });
    await writeFile(`dist/review/${name}.html`, `<!doctype html><html data-theme="vanilla-sky" data-font="pixel"><head><meta charset="utf-8"><title>Pixel Calendar — ${name}</title><style>${css}</style></head><body>${document.getElementById('root').outerHTML}</body></html>`);
}

test('window background defaults on for old settings and its toggle survives an App restart', async () => {
    assert.equal(JSON.parse(localStorage.getItem('pixel-calendar-settings')).windowBackgroundEnabled, undefined);
    await act(async () => root.render(React.createElement(App)));
    assert.equal(find('.pixel-window').getAttribute('aria-hidden'), 'true');
    await click('#btn-open-settings');
    assert.equal(find('#setting-window-background').checked, true);
    await click('#setting-window-background');
    assert.equal(document.querySelector('.pixel-window'), null);
    assert.equal(JSON.parse(localStorage.getItem('pixel-calendar-settings')).windowBackgroundEnabled, false);

    await act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(React.createElement(App)));
    assert.equal(document.querySelector('.pixel-window'), null);
    await click('#btn-open-settings');
    assert.equal(find('#setting-window-background').checked, false);
    await click('#setting-window-background');
    await click('#btn-settings-close');
    assert.ok(find('.pixel-window'));
    assert.equal(JSON.parse(localStorage.getItem('pixel-calendar-settings')).windowBackgroundEnabled, true);

    await act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(React.createElement(App)));
    assert.ok(find('.pixel-window'));
});

test('browsing a different season keeps the window on today and its weather', async () => {
    const day = todayKey();
    globalThis.fetch = async () => ({ ok: true, json: async () => ({
        daily: { time: [day], weather_code: [61], temperature_2m_max: [18], temperature_2m_min: [12] },
        hourly: { time: [`${day}T12:00`], temperature_2m: [16], precipitation_probability: [85] },
    }) });
    await act(async () => root.render(React.createElement(App)));
    const season = find('.pixel-window').dataset.season;
    const initialMonth = find('.header-month-year').textContent;
    assert.ok(season);
    assert.equal(find('.pixel-window').dataset.weather, 'rain');
    for (let month = 0; month < 3; month++) await click('#btn-next-month');
    assert.notEqual(find('.header-month-year').textContent, initialMonth);
    assert.equal(document.getElementById(`day-${day}`), null);
    assert.equal(find('.pixel-window').dataset.season, season);
    assert.equal(find('.pixel-window').dataset.weather, 'rain');
});

test('focus shortcut hides and restores the window without changing the saved preference', async () => {
    await act(async () => root.render(React.createElement(App)));
    const season = find('.pixel-window').dataset.season;
    const shortcut = () => act(async () => document.body.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'F', bubbles: true })));
    await shortcut();
    assert.equal(document.querySelector('.pixel-window'), null);
    assert.ok(find(`#day-${todayKey()}`));
    assert.equal(JSON.parse(localStorage.getItem('pixel-calendar-settings')).windowBackgroundEnabled, true);
    await shortcut();
    assert.equal(find('.pixel-window').dataset.season, season);
    assert.equal(JSON.parse(localStorage.getItem('pixel-calendar-settings')).windowBackgroundEnabled, true);
});

test('admin scene controls change only the decorative background and restore live weather on reset', async () => {
    const day = todayKey();
    globalThis.fetch = async () => ({ ok: true, json: async () => ({
        daily: { time: [day], weather_code: [61], temperature_2m_max: [18], temperature_2m_min: [12] },
        hourly: { time: [`${day}T12:00`], temperature_2m: [16], precipitation_probability: [85] },
    }) });
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: [{ id: 'kept', text: 'Real rainy-day plan', time: '12:00' }] }));
    await act(async () => root.render(React.createElement(App)));
    const live = backgroundScene();
    assert.equal(live.weather, 'rain');
    const dayBefore = find(`#day-${day}`).textContent;
    const storageKeys = ['pixel-calendar-settings', 'pixel-calendar-notes', 'pixel-calendar-weather-cache'];
    const saved = storageKeys.map(key => localStorage.getItem(key));
    assert.ok(saved[2], 'The real forecast must have been cached before previewing');
    await openSceneAdmin();
    await select('#admin-scene-season', 'winter');
    await select('#admin-scene-weather', 'snow');
    await select('#admin-scene-phase', 'night');
    assert.deepEqual(backgroundScene(), { season: 'winter', weather: 'snow', phase: 'night' });
    assert.equal(find(`#day-${day}`).textContent, dayBefore);
    assert.deepEqual(storageKeys.map(key => localStorage.getItem(key)), saved);
    await click('#admin-scene-play');
    assert.equal(find('#admin-scene-play').getAttribute('aria-pressed'), 'true');
    await click('[data-scene-preset="summer-storm"]');
    assert.deepEqual(backgroundScene(), { season: 'summer', weather: 'storm', phase: 'dusk' });
    assert.equal(find('#admin-scene-play').getAttribute('aria-pressed'), 'false', 'Choosing a scene must stop the slideshow');
    await click('#admin-scene-reset');
    assert.deepEqual(backgroundScene(), live);
    assert.equal(find('#admin-scene-reset').disabled, true);
    assert.deepEqual(storageKeys.map(key => localStorage.getItem(key)), saved);
    await click('[data-scene-preset="winter-snow"]');
    await click('.admin-close-btn');
    assert.deepEqual(backgroundScene(), live);
});

test('full scenery preview preserves an unfinished event form and Escape returns to it', async () => {
    await act(async () => root.render(React.createElement(App)));
    const live = backgroundScene();
    await click(`#day-${todayKey()}`);
    await fill('#new-note-input', 'An unfinished plan');
    await fill('.notes-add input[type=time]', '18:45');
    const input = find('#new-note-input');
    const calendarDay = find(`#day-${todayKey()}`);
    await openSceneAdmin();
    await click('[data-scene-preset="summer-night"]');
    await click('#admin-scene-showcase');
    assert.equal(find('#admin-scene-showcase').getAttribute('aria-pressed'), 'true');
    assert.equal(find('#new-note-input'), input, 'Showcase must preserve the mounted editor');
    assert.equal(find(`#day-${todayKey()}`), calendarDay);
    assert.equal(input.value, 'An unfinished plan');
    await act(async () => document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
    assert.equal(document.querySelector('.admin-panel'), null);
    assert.deepEqual(backgroundScene(), live);
    assert.equal(find('#new-note-input'), input);
    assert.equal(input.value, 'An unfinished plan');
    assert.equal(find('.notes-add input[type=time]').value, '18:45');
    assert.deepEqual(storedNotes(), {}, 'Previewing must not save an unfinished event');
});

test('admin previews remain temporary when the user has disabled the window background', async () => {
    const settings = JSON.parse(localStorage.getItem('pixel-calendar-settings'));
    localStorage.setItem('pixel-calendar-settings', JSON.stringify({ ...settings, windowBackgroundEnabled: false }));
    await act(async () => root.render(React.createElement(App)));
    assert.equal(document.querySelector('#root > .pixel-window'), null);
    const savedSettings = localStorage.getItem('pixel-calendar-settings');
    await openSceneAdmin();
    assert.ok(find('.admin-scene-preview .pixel-window'));
    assert.equal(document.querySelector('#root > .pixel-window'), null);
    await click('[data-scene-preset="spring-fog"]');
    assert.deepEqual(backgroundScene(), { season: 'spring', weather: 'fog', phase: 'day' });
    await click('#admin-scene-reset');
    assert.equal(document.querySelector('#root > .pixel-window'), null);
    await click('#admin-scene-showcase');
    assert.ok(find('#root > .pixel-window'));
    await click('.admin-close-btn');
    assert.equal(document.querySelector('#root > .pixel-window'), null);
    assert.equal(localStorage.getItem('pixel-calendar-settings'), savedSettings);
    await openSceneAdmin();
    assert.equal(find('#admin-scene-showcase').getAttribute('aria-pressed'), 'false');
    assert.equal(find('#admin-scene-reset').disabled, true);
    await click('[data-scene-preset="winter-snow"]');
    await click('#admin-tab-overview');
    assert.equal(document.querySelector('#root > .pixel-window'), null, 'Leaving the scenery tab must restore the saved background preference');
    assert.equal(localStorage.getItem('pixel-calendar-settings'), savedSettings);
});

test('outdoor event preview, hourly choices and a same-day recurrence change work through App', async () => {
    const date = new Date(); date.setDate(date.getDate() + 1);
    const day = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const data = { daily: { time: [day], weather_code: [3], temperature_2m_max: [21], temperature_2m_min: [15] },
        hourly: { time: Array.from({ length: 24 }, (_, hour) => `${day}T${String(hour).padStart(2, '0')}:00`),
            temperature_2m: Array(24).fill(20), precipitation_probability: Array.from({ length: 24 }, (_, hour) => hour === 19 ? 80 : 10) } };
    globalThis.fetch = async () => ({ ok: true, json: async () => data });
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: [{ id: 'busy', text: 'Other event', time: '17:30' }] }));
    await act(async () => root.render(React.createElement(App)));
    if (!document.getElementById(`day-${day}`)) await click('#btn-next-month');
    await click(`#day-${day}`);
    assert.equal(document.querySelector('.quick-add'), null);
    assert.equal(find('.weather-section').closest('details'), null);
    await fill('#new-note-input', 'Outdoor walk');
    await fill('.notes-add input[type=time]', '18:30');
    await select('.notes-add select', 'weekly');
    await click('.notes-add .event-all-day:last-of-type input');
    assert.match(find('.notes-add .event-weather').textContent, /80%/);
    assert.equal(document.querySelectorAll('.notes-add .event-weather-options button').length, 3);
    await click('#btn-add-note');
    const original = storedNotes()[day].find(n => n.text === 'Outdoor walk');
    assert.equal(original.outdoor, true);
    assert.equal(original.time, '18:30'); // Suggestions never move automatically.
    await savePreview('outdoor-weather');
    await click('.notes-list .event-weather-options button');
    const saved = storedNotes()[day];
    const series = saved.find(n => n.id === original.id);
    const detached = saved.find(n => n.id !== original.id && n.text === 'Outdoor walk');
    assert.equal(series.time, '18:30'); assert.deepEqual(series.excludedDates, [day]);
    assert.equal(detached.time, '19:00'); assert.equal(detached.repeat, 'none'); assert.equal(detached.outdoor, true);
    assert.match(find('.notes-list').textContent, /No adverse temperature/);
    await click('#btn-close-modal'); await click(`#day-${day}`);
    assert.match(find('.notes-list').textContent, /19:00/);
});

test('weather refreshes on online and desktop resume and unsubscribes on unmount', async () => {
    let requests = 0, resume, removed = false;
    window.electronWeather = { onResume(fn) { resume = fn; return () => { removed = true; }; } };
    globalThis.fetch = async () => { requests++; throw new Error('offline'); };
    await act(async () => root.render(React.createElement(App)));
    const initial = requests;
    await act(async () => window.dispatchEvent(new Event('online')));
    assert.equal(requests, initial + 1);
    await act(async () => resume());
    assert.equal(requests, initial + 2);
    await act(async () => root.unmount());
    assert.equal(removed, true);
    root = createRoot(document.getElementById('root'));
});

test('create a timed weekly event through the real App, persist and show next occurrence', async () => {
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${todayKey()}`);
    assert.ok(find('#new-note-input'));
    await fill('#new-note-input', 'Japanese lesson');
    await fill('.notes-add input[type=time]', '18:30');
    await select('.notes-add select', 'weekly');
    await act(async () => find('.notes-add select').dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
    assert.ok(document.getElementById(`day-${todayKey()}`), 'Schedule keyboard input must not navigate the calendar');
    await click('#btn-add-note');
    const note = storedNotes()[todayKey()][0];
    assert.equal(note.text, 'Japanese lesson');
    assert.equal(note.time, '18:30');
    assert.equal(note.repeat, 'weekly');
    assert.match(find(`#day-${todayKey()} .day-event`).textContent, /18:30.*Japanese lesson/);
    await savePreview('event');
    await click('#btn-close-modal');
    await savePreview('calendar');
    const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate() + 7);
    const key = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
    if (!document.getElementById(`day-${key}`)) await click('#btn-next-month');
    await click(`#day-${key}`);
    assert.match(find('.notes-list').textContent, /Japanese lesson/);
    // Deleting an occurrence requires explicit confirmation for the whole series.
    await click('.notes-list .icon-btn--danger');
    assert.match(find('#confirm-desc').textContent, /all its repetitions/);
    await click('.confirm-btn-cancel');
    assert.equal(storedNotes()[todayKey()].length, 1);
});

test('old notes remain editable and a long list has two previews and overflow count', async () => {
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [todayKey()]: [1, 2, 3].map(i => ({ id: `old-${i}`, text: `Old note ${i}` })) }));
    await act(async () => root.render(React.createElement(App)));
    assert.equal(document.querySelectorAll(`#day-${todayKey()} .day-event`).length, 2);
    assert.match(find(`#day-${todayKey()} .day-event-more`).textContent, /\+1/);
    await click(`#day-${todayKey()}`);
    await click('#edit-note-old-1');
    await fill('.note-textarea--edit', 'Updated old note');
    await click('.note-edit-actions .btn-primary');
    assert.equal(storedNotes()[todayKey()][0].text, 'Updated old note');
    await click('.notes-list .note-actions .icon-btn');
    await fill('.note-details-panel input[type=time]', '10:45');
    assert.equal(storedNotes()[todayKey()][0].time, '10:45');
});

test('full backup preview validates the file and cancellation leaves current data intact', async () => {
    const { createBackup } = await import('../src/utils/backup.js');
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [todayKey()]: [{ id: 'kept', text: 'Keep this note' }] }));
    await act(async () => root.render(React.createElement(App)));
    await click('#btn-open-settings');
    const backup = createBackup(localStorage);
    backup.data.notes = {};
    const before = localStorage.getItem('pixel-calendar-notes');
    const input = find('#backup-file-input');
    Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'backup.json', size: 1000, text: async () => JSON.stringify(backup) }] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
    assert.match(find('.backup-preview').textContent, /Review backup/);
    assert.match(find('.backup-counts').textContent, /Notes \/ event series0/);
    await savePreview('backup');
    await click('.backup-preview .btn-ghost');
    assert.equal(document.querySelector('.backup-preview'), null);
    assert.equal(localStorage.getItem('pixel-calendar-notes'), before);
    Object.defineProperty(input, 'files', { configurable: true, value: [{ name: 'bad.json', size: 20, text: async () => '{"version":999}' }] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
    assert.match(find('.backup-panel [role=alert]').textContent, /Invalid or unsupported/);
    assert.equal(localStorage.getItem('pixel-calendar-notes'), before);
});

test('series remains editable and deletable from sidebar after moving its first occurrence', async () => {
    const day = todayKey();
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: [{ id: 'series', text: 'Moved first occurrence', repeat: 'weekly', excludedDates: [day] }] }));
    await act(async () => root.render(React.createElement(App)));
    await click('#btn-notes-sidebar-toggle');
    await click('.sidebar-note-actions .icon-btn');
    assert.equal(find('.note-textarea--edit').value, 'Moved first occurrence');
    await fill('.note-textarea--edit', 'Edited series');
    await click('.note-edit-actions .btn-primary');
    assert.equal(storedNotes()[day][0].text, 'Edited series');
    await click('.notes-list .icon-btn--danger');
    assert.match(find('#confirm-desc').textContent, /all its repetitions/);
    await click('.confirm-btn-delete');
    assert.equal(storedNotes()[day], undefined);
});

test('simultaneous reminders are queued and persisted once in StrictMode', async () => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const day = todayKey();
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: ['First reminder', 'Second reminder'].map((text, i) => ({ id: `r${i}`, text, time, reminder: { enabled: true, intervals: ['same-day'], notified: [] } })) }));
    await act(async () => root.render(React.createElement(React.StrictMode, null, React.createElement(App))));
    assert.match(find('.toast-text').textContent, /First reminder/);
    await click('.toast-close');
    await act(async () => new Promise(resolve => setTimeout(resolve, 400)));
    assert.match(find('.toast-text').textContent, /Second reminder/);
    for (const note of storedNotes()[day]) assert.deepEqual(note.reminder.notified, [`${day}:same-day`]);
});

test('legacy import preserves event fields and avoids duplicating an event moved to another date', async () => {
    const day = todayKey();
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: [{ id: 'already-moved', text: 'Current date' }] }));
    await act(async () => root.render(React.createElement(App)));
    await click('#btn-open-settings');
    const imported = { '2025-01-01': [
        { id: 'already-moved', text: 'Old date' },
        { id: 'new-event', text: 'Imported event', time: '11:15', repeat: 'yearly' },
    ] };
    const input = find('#settings-modal input[type=file]:not(#backup-file-input)');
    Object.defineProperty(input, 'files', { configurable: true, value: [new dom.window.File([JSON.stringify(imported)], 'notes.json', { type: 'application/json' })] });
    await act(async () => {
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(resolve => setTimeout(resolve, 50));
    });
    assert.equal(storedNotes()[day][0].text, 'Current date');
    assert.equal(storedNotes()['2025-01-01'].length, 1);
    assert.equal(storedNotes()['2025-01-01'][0].time, '11:15');
    assert.equal(storedNotes()['2025-01-01'][0].repeat, 'yearly');
});

test('day panel keeps events first and day marks directly available', async () => {
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${todayKey()}`);
    assert.ok(find('.modal-content').firstElementChild.querySelector('.notes-panel'));
    assert.equal(find('.day-decorations').closest('details'), null);
    assert.equal(document.querySelector('details.meta-block'), null);
    assert.ok(find('#day-marks-tab-mood'));
    assert.ok(find('#day-marks-tab-color'));
    assert.ok(find('#day-marks-tab-stickers'));
    assert.equal(find('.weather-section').closest('details'), null);
});

test('day mark tabs move focus with arrows and Home/End while keeping the active panel in sync', async () => {
    const day = todayKey();
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${day}`);
    find('#day-marks-tab-mood').focus();
    const press = key => act(async () => document.activeElement.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })));
    const assertTab = name => {
        const tab = find(`#day-marks-tab-${name}`);
        assert.equal(document.activeElement, tab);
        assert.equal(tab.getAttribute('aria-selected'), 'true');
        assert.equal(tab.tabIndex, 0);
        assert.equal(find('.day-decorations [role="tabpanel"]').id, `day-marks-panel-${name}`);
        for (const otherTab of document.querySelectorAll('.day-marks-tabs [role="tab"]')) {
            if (otherTab !== tab) {
                assert.equal(otherTab.getAttribute('aria-selected'), 'false');
                assert.equal(otherTab.tabIndex, -1);
            }
        }
    };
    await press('ArrowRight');
    assertTab('color');
    await click('[data-day-color="#64b5f6"]');
    assert.equal(JSON.parse(localStorage.getItem('pixel-calendar-day-meta'))[day].color, '#64b5f6');
    find('#day-marks-tab-color').focus();
    await press('ArrowRight');
    assertTab('stickers');
    await press('ArrowRight');
    assertTab('mood');
    await press('ArrowLeft');
    assertTab('stickers');
    await press('Home');
    assertTab('mood');
    await press('End');
    assertTab('stickers');
    assert.ok(find(`#day-${day}`), 'Tab navigation must not navigate the calendar month');
});

test('day mood and color toggles persist through restart without changing another date', async () => {
    const day = todayKey();
    const otherDay = `${day.slice(0, 8)}${day.endsWith('-01') ? '02' : '01'}`;
    const readMoods = () => JSON.parse(localStorage.getItem('pixel-calendar-moods'));
    const readMeta = () => JSON.parse(localStorage.getItem('pixel-calendar-day-meta'));
    const otherMeta = { color: '#81c784', stickers: ['⭐'] };
    localStorage.setItem('pixel-calendar-moods', JSON.stringify({ [otherDay]: '😢' }));
    localStorage.setItem('pixel-calendar-day-meta', JSON.stringify({ [otherDay]: otherMeta }));
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${day}`);
    await click('#day-marks-tab-mood');
    await click('[data-mood="😊"]');
    assert.equal(find('[data-mood="😊"]').getAttribute('aria-pressed'), 'true');
    assert.equal(readMoods()[day], '😊');
    await click('[data-mood="😊"]');
    assert.equal(readMoods()[day], undefined);
    assert.equal(find('[data-mood="😊"]').getAttribute('aria-pressed'), 'false');
    await click('[data-mood="😌"]');
    await click('#day-marks-tab-color');
    await click('[data-day-color="#e57373"]');
    assert.equal(find('[data-day-color="#e57373"]').getAttribute('aria-pressed'), 'true');
    assert.equal(readMeta()[day].color, '#e57373');
    await click('[data-day-color="#e57373"]');
    assert.equal(readMeta()[day], undefined);
    await click('[data-day-color="#64b5f6"]');
    assert.equal(readMoods()[otherDay], '😢');
    assert.deepEqual(readMeta()[otherDay], otherMeta);

    await act(async () => root.unmount());
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(React.createElement(App)));
    assert.match(find(`#day-${day} .day-mood`).getAttribute('aria-label'), /😌/);
    assert.equal(find(`#day-${day}`).style.getPropertyValue('--day-label-clr'), '#64b5f6');
    await click(`#day-${day}`);
    await click('#day-marks-tab-mood');
    assert.equal(find('[data-mood="😌"]').getAttribute('aria-pressed'), 'true');
    await click('[data-mood=""]');
    await click('#day-marks-tab-color');
    assert.equal(find('[data-day-color="#64b5f6"]').getAttribute('aria-pressed'), 'true');
    await click('[data-day-color=""]');
    assert.deepEqual(readMoods(), { [otherDay]: '😢' });
    assert.deepEqual(readMeta(), { [otherDay]: otherMeta });
});

test('day stickers expose the three-sticker limit and let a selected sticker free a slot', async () => {
    const day = todayKey();
    const otherDay = `${day.slice(0, 8)}${day.endsWith('-01') ? '02' : '01'}`;
    const readMeta = () => JSON.parse(localStorage.getItem('pixel-calendar-day-meta'));
    const otherMeta = { stickers: ['🎁'] };
    localStorage.setItem('pixel-calendar-day-meta', JSON.stringify({
        [day]: { color: '#e57373', stickers: ['⭐'] }, [otherDay]: otherMeta,
    }));
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${day}`);
    await click('#day-marks-tab-stickers');
    assert.equal(find('[data-sticker="⭐"]').getAttribute('aria-pressed'), 'true');
    await click('[data-sticker="❤️"]');
    await click('[data-sticker="☕"]');
    assert.deepEqual(readMeta()[day].stickers, ['⭐', '❤️', '☕']);
    for (const button of document.querySelectorAll('[data-sticker]')) {
        const selected = button.getAttribute('aria-pressed') === 'true';
        assert.equal(button.disabled, !selected, 'Selected stickers must still be removable at the limit');
    }
    await click('[data-sticker="🎁"]');
    assert.deepEqual(readMeta()[day].stickers, ['⭐', '❤️', '☕']);
    await click('[data-sticker="⭐"]');
    assert.equal(find('[data-sticker="🎁"]').disabled, false);
    await click('[data-sticker="🎁"]');
    assert.deepEqual(readMeta()[day], { color: '#e57373', stickers: ['❤️', '☕', '🎁'] });
    assert.deepEqual(readMeta()[otherDay], otherMeta);
    await click('#btn-close-modal');
    await click(`#day-${day}`);
    await click('#day-marks-tab-stickers');
    assert.equal(find('[data-sticker="🎁"]').getAttribute('aria-pressed'), 'true');
    assert.equal(find('[data-sticker="⭐"]').getAttribute('aria-pressed'), 'false');
});

test('day countdowns add by button or form submit, trim input and remove only the chosen item', async () => {
    const day = todayKey();
    const otherDay = `${day.slice(0, 8)}${day.endsWith('-01') ? '02' : '01'}`;
    const otherCountdown = { id: 'other-date', dateKey: otherDay, label: 'Keep another day', emoji: '⭐' };
    const readCountdowns = () => JSON.parse(localStorage.getItem('pixel-calendar-countdowns'));
    localStorage.setItem('pixel-calendar-countdowns', JSON.stringify([otherCountdown]));
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${day}`);
    assert.equal(document.querySelector('[data-remove-countdown="other-date"]'), null);
    await click('#day-countdown-toggle');
    await fill('#day-countdown-label', '   ');
    await act(async () => find('.day-countdown-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    assert.deepEqual(readCountdowns(), [otherCountdown]);
    await fill('#day-countdown-label', '  Birthday trip  ');
    await click('#day-countdown-add');
    const addedByButton = readCountdowns().find(countdown => countdown.dateKey === day);
    assert.ok(addedByButton);
    assert.equal(addedByButton.label, 'Birthday trip');
    assert.equal(find('#day-countdown-label').value, '');
    await fill('#day-countdown-label', '  Release day  ');
    // Browsers submit this form for Enter as well as its submit button.
    await act(async () => find('.day-countdown-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    const dayCountdowns = readCountdowns().filter(countdown => countdown.dateKey === day);
    assert.deepEqual(dayCountdowns.map(countdown => countdown.label), ['Birthday trip', 'Release day']);
    assert.equal(find('#day-countdown-label').value, '');
    await click(`[data-remove-countdown="${addedByButton.id}"]`);
    assert.deepEqual(readCountdowns().filter(countdown => countdown.dateKey === day).map(countdown => countdown.label), ['Release day']);
    assert.deepEqual(readCountdowns().find(countdown => countdown.id === otherCountdown.id), otherCountdown);
});

test('an unfinished countdown is not carried into another date or saved on closing the panel', async () => {
    const day = todayKey();
    const otherDay = `${day.slice(0, 8)}${day.endsWith('-01') ? '02' : '01'}`;
    await act(async () => root.render(React.createElement(App)));
    await click(`#day-${day}`);
    await click('#day-countdown-toggle');
    await fill('#day-countdown-label', 'Unfinished trip');
    await click('#btn-close-modal');
    await click(`#day-${otherDay}`);
    await click('#day-countdown-toggle');
    assert.equal(find('#day-countdown-label').value, '');
    await fill('#day-countdown-label', 'Different unfinished plan');
    await click('#btn-close-modal');
    await click(`#day-${day}`);
    await click('#day-countdown-toggle');
    assert.equal(find('#day-countdown-label').value, '');
    assert.deepEqual(JSON.parse(localStorage.getItem('pixel-calendar-countdowns')), []);
});

test('snooze action is stored before notification dismissal and opening reveals the event day', async () => {
    const day = todayKey();
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: [{ id: 'n', text: 'Actionable reminder', time, reminder: { enabled: true, intervals: ['same-day'], notified: [] } }] }));
    await act(async () => root.render(React.createElement(App)));
    const before = Date.now();
    await click('.toast-reminder-actions button:last-child');
    const at = storedNotes()[day][0].reminder.snoozes[day];
    assert.ok(at >= before + 900000 && at <= Date.now() + 900000);
    await act(async () => new Promise(resolve => setTimeout(resolve, 400)));
    assert.equal(document.querySelector('.toast-notification'), null);
    await act(async () => root.unmount());
    // Simulate a restart after the postponed time has elapsed.
    const saved = storedNotes(); saved[day][0].reminder.snoozes[day] = Date.now() - 1;
    localStorage.setItem('pixel-calendar-notes', JSON.stringify(saved));
    root = createRoot(document.getElementById('root'));
    await act(async () => root.render(React.createElement(App)));
    assert.match(find('.toast-text').textContent, /Actionable reminder/);
    await click('.toast-reminder-actions button:first-child');
    assert.match(find('#day-modal .notes-list').textContent, /Actionable reminder/);
    assert.deepEqual(storedNotes()[day][0].reminder.snoozes, {});
});

test('snooze storage error leaves notification visible and offers retry', async () => {
    const day = todayKey(), now = new Date();
    const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    localStorage.setItem('pixel-calendar-notes', JSON.stringify({ [day]: [{ id: 'n', text: 'Keep visible', time, reminder: { enabled: true, intervals: ['same-day'], notified: [] } }] }));
    await act(async () => root.render(React.createElement(App)));
    const prototype = Object.getPrototypeOf(localStorage), original = prototype.setItem;
    prototype.setItem = () => { throw new Error('Quota'); };
    try {
        await click('.toast-reminder-actions button:last-child');
        assert.match(find('.toast-error').textContent, /Could not save/);
        assert.equal(find('.toast-reminder-actions button:last-child').disabled, false);
        assert.match(find('.toast-text').textContent, /Keep visible/);
    } finally { prototype.setItem = original; }
});
