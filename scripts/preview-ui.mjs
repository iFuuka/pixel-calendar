// Development-only visual fixtures. Never reads or writes the user's app profile.
import { build } from 'esbuild';
import { JSDOM } from 'jsdom';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost/', pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLTextAreaElement', 'Event', 'MouseEvent', 'localStorage']) {
    Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const cache = resolve('node_modules/.cache/visual-preview');
await mkdir(cache, { recursive: true });
const bundle = await build({
    stdin: { contents: "import './src/index.css'; export { default } from './src/App.jsx'; export { default as PixelWindow } from './src/components/PixelWindow.jsx';", resolveDir: resolve('.'), loader: 'jsx' },
    bundle: true, write: false, outdir: cache, format: 'esm', platform: 'browser',
    external: ['react', 'react-dom', 'react-dom/client'], loader: { '.png': 'dataurl', '.svg': 'dataurl' }, jsx: 'automatic',
});
const js = bundle.outputFiles.find(file => file.path.endsWith('.js'));
const css = bundle.outputFiles.find(file => file.path.endsWith('.css')).text;
await writeFile(resolve(cache, 'app.mjs'), js.text);
const React = await import('react');
const { createRoot } = await import('react-dom/client');
const { default: App, PixelWindow } = await import(pathToFileURL(resolve(cache, 'app.mjs')));
const { renderToStaticMarkup } = await import('react-dom/server');
const { act } = React;
const dateKey = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateAt = offset => { const date = new Date(); date.setDate(date.getDate() + offset); return date; };
const dates = Array.from({ length: 19 }, (_, i) => dateKey(dateAt(i - 3)));
const hourly = dates.flatMap(date => Array.from({ length: 24 }, (_, h) => `${date}T${String(h).padStart(2, '0')}:00`));
const weather = {
    current: { wind_speed_10m: 12, weather_code: 2, time: `${dateKey(new Date())}T${String(new Date().getHours()).padStart(2, '0')}:00` },
    daily: { time: dates, weather_code: dates.map((_, i) => [2, 0, 3, 2, 61][i % 5]),
        temperature_2m_max: dates.map((_, i) => 18 + i % 6), temperature_2m_min: dates.map((_, i) => 12 + i % 4),
        precipitation_probability_max: dates.map((_, i) => [20, 5, 40, 25, 75][i % 5]), wind_speed_10m_max: dates.map(() => 16),
        sunrise: dates.map(d => `${d}T06:25`), sunset: dates.map(d => `${d}T19:42`) },
    hourly: { time: hourly, temperature_2m: hourly.map((_, i) => Math.round(17 + 5 * Math.sin((i % 24 - 7) / 24 * Math.PI * 2))),
        precipitation_probability: hourly.map((_, i) => i % 24 === 19 ? 80 : 15) },
};
globalThis.fetch = async () => ({ ok: true, json: async () => weather });
await mkdir('dist/review', { recursive: true });
// Isolated storm scenes show the actual window art without the calendar hiding it.
// Freeze the actual CSS timeline to inspect growth as well as the completed strike.
const stormFrameCss = seconds => `
    .storm-preview--frame .pixel-window__motion { animation-play-state: paused; }
    .storm-preview--frame .pixel-window__storm-flash {
        --strike-offset: -${seconds}s;
    }
    .storm-preview--frame .pixel-window__storm-flash--far { visibility: hidden; }
`;
for (const { name, phase, animated, seconds } of [
    { name: 'storm-live-night', phase: 'night', animated: true },
    { name: 'storm-seed-night', phase: 'night', animated: true, seconds: 3.08 },
    { name: 'storm-growing-night', phase: 'night', animated: true, seconds: 3.42 },
    { name: 'storm-peak-night', phase: 'night', animated: true, seconds: 4.03 },
    { name: 'storm-peak-day', phase: 'day', animated: true, seconds: 4.03 },
    { name: 'storm-fading-night', phase: 'night', animated: true, seconds: 4.4 },
    { name: 'storm-ended-night', phase: 'night', animated: true, seconds: 5 },
    { name: 'storm-paused', phase: 'night', animated: false },
]) {
    const artwork = renderToStaticMarkup(React.createElement(PixelWindow, {
        scene: { season: 'summer', weather: 'storm', phase }, animated,
    }));
    await writeFile(`dist/review/${name}.html`, `<!doctype html><html lang="ru" data-theme="vanilla-sky" data-font="pixel"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Calendar preview — ${name}</title><style>${css}\n${seconds !== undefined ? stormFrameCss(seconds) : ''}</style></head><body class="${seconds !== undefined ? 'storm-preview--frame' : 'storm-preview'}"><div id="root">${artwork}</div></body></html>`);
}
for (const [name, season, phase, closeup] of [
    ['cat-autumn-day', 'autumn', 'day', false],
    ['cat-winter-night', 'winter', 'night', false],
    ['cat-closeup', 'autumn', 'day', true],
]) {
    const artwork = renderToStaticMarkup(React.createElement(PixelWindow, {
        scene: { season, weather: 'clear', phase }, animated: false,
    }));
    const detailCss = closeup ? '.pixel-window{inset:auto;left:0;bottom:0;width:1280px;height:720px;transform:scale(4);transform-origin:0 100%;}' : '';
    await writeFile(`dist/review/${name}.html`, `<!doctype html><html lang="ru" data-theme="vanilla-sky"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Calendar preview — ${name}</title><style>${css}\n${detailCss}</style></head><body><div id="root">${artwork}</div></body></html>`);
}
// Inspect the moving sill details at their real scene scale and in pixel closeups.
// Frame fixtures pause the CSS animations, without changing the component markup.
for (const { name, season = 'autumn', phase = 'day', detail, animated = true, seconds } of [
    { name: 'sill-live-autumn-day' },
    { name: 'sill-live-winter-night', season: 'winter', phase: 'night' },
    { name: 'sill-cat-live', detail: 'cat' },
    { name: 'sill-cup-live', detail: 'cup' },
    { name: 'sill-paused', animated: false },
    { name: 'sill-cat-frame-0', detail: 'cat', seconds: 0 },
    { name: 'sill-cat-frame-3', detail: 'cat', seconds: 3 },
    { name: 'sill-cat-frame-tail', detail: 'cat', seconds: 8.8 },
    { name: 'sill-cup-frame-0', detail: 'cup', seconds: 0 },
    { name: 'sill-cup-frame-2-6', detail: 'cup', seconds: 2.6 },
]) {
    const artwork = renderToStaticMarkup(React.createElement(PixelWindow, {
        scene: { season, weather: 'clear', phase }, animated,
    }));
    const detailCss = detail ? `.pixel-window{inset:auto;${detail === 'cup' ? 'right' : 'left'}:0;bottom:0;width:1280px;height:720px;transform:scale(4);transform-origin:${detail === 'cup' ? '100%' : '0'} 100%;}` : '';
    const frameCss = seconds !== undefined ? `
        .pixel-window__motion { animation-play-state: paused !important; }
        .pixel-window__cat-breath,
        .pixel-window__cat-tail,
        .pixel-window__cup-steam { animation-delay: -${seconds}s !important; }
        .pixel-window__cup-steam:nth-child(2) { animation-delay: -${seconds + 2.6}s !important; }
    ` : '';
    await writeFile(`dist/review/${name}.html`, `<!doctype html><html lang="ru" data-theme="vanilla-sky"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Calendar preview — ${name}</title><style>${css}\n${detailCss}\n${frameCss}</style></head><body><div id="root">${artwork}</div></body></html>`);
}
for (const theme of ['vanilla-sky', 'lavender-night', 'matcha-box', 'autumn-sunset', 'terraria-forest']) {
    localStorage.clear();
    localStorage.setItem('pixel-calendar-settings', JSON.stringify({ language: 'ru', theme, firstDayOfWeek: 1,
        locationName: 'Москва', decorationsEnabled: true, updateAlertsEnabled: false, weatherAlertsEnabled: false }));
    const notes = {};
    for (const [offset, text, time, repeat, outdoor] of [
        [0, 'Японский: разговорная практика', '17:30', 'weekly', false],
        [0, 'Вечерняя прогулка', '18:30', 'none', true],
        [1, 'Забрать посылку', '12:00', 'none', false],
        [3, 'Почитать новую книгу', '', 'none', false],
        [4, 'Встреча с друзьями', '19:00', 'weekly', false],
        [6, 'Поездка за город', '10:00', 'none', true],
    ]) {
        const day = dateKey(dateAt(offset));
        (notes[day] ||= []).push({ id: `demo-${offset}-${time}`, text, time, repeat, outdoor, createdAt: Date.now(), tags: [] });
    }
    localStorage.setItem('pixel-calendar-notes', JSON.stringify(notes));
    localStorage.setItem('pixel-calendar-habits', JSON.stringify({ habits: [
        { id: 'reading', name: 'Чтение', icon: '📖' }, { id: 'water', name: 'Вода', icon: '💧' },
        { id: 'japanese', name: 'Японский', icon: '🌸' }], checks: { [dateKey(new Date())]: ['reading'] } }));
    const root = createRoot(document.getElementById('root'));
    await act(async () => root.render(React.createElement(App)));
    const save = async (suffix, scene) => {
        // Match the packaged app's public asset URLs without using real user data.
        const original = document.getElementById('root');
        const snapshot = original.cloneNode(true);
        const selects = snapshot.querySelectorAll('select');
        original.querySelectorAll('select').forEach((select, index) => {
            [...select.options].forEach((option, optionIndex) => {
                selects[index].options[optionIndex].toggleAttribute('selected', option.selected);
            });
        });
        let html = snapshot.outerHTML.replace('src="./me_chibi.png"', 'src="/me_chibi.png"');
        if (scene) {
            html = html.replace(document.querySelector('.pixel-window').outerHTML,
                renderToStaticMarkup(React.createElement(PixelWindow, { scene, animated: true })));
        }
        await writeFile(`dist/review/${theme}${suffix}.html`, `<!doctype html><html lang="ru" data-theme="${theme}" data-font="pixel"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pixel Calendar preview — ${theme}</title><style>${css}</style></head><body>${html}</body></html>`);
    };
    await save('');
    if (theme === 'vanilla-sky') {
        for (const [name, season, weather, phase] of [
            ['spring', 'spring', 'clear', 'day'], ['summer', 'summer', 'clear', 'day'],
            ['autumn-rain', 'autumn', 'rain', 'day'], ['winter-snow', 'winter', 'snow', 'day'],
            ['night', 'summer', 'clear', 'night'], ['sunset', 'autumn', 'clear', 'dusk'],
            ['fog', 'autumn', 'fog', 'day'], ['storm', 'summer', 'storm', 'day'],
        ]) await save(`-window-${name}`, { season, weather, phase });
        const clickSceneControl = async selector => act(async () => document.querySelector(selector).dispatchEvent(new MouseEvent('click', { bubbles: true })));
        for (let i = 0; i < 10; i++) await clickSceneControl('.author-name');
        await clickSceneControl('#admin-tab-scenery');
        await save('-admin-scenes');
        await clickSceneControl('[data-scene-preset="winter-snow"]');
        await clickSceneControl('#admin-scene-showcase');
        await save('-admin-showcase');
        await clickSceneControl('.admin-close-btn');
    }
    await act(async () => document.getElementById(`day-${dateKey(new Date())}`).dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await save('-day');
    const clickMark = async selector => act(async () => document.querySelector(selector).click());
    const saveMarks = async name => {
        const html = document.querySelector('.day-decorations').outerHTML + document.querySelector('.day-countdown').outerHTML;
        await writeFile(`dist/review/${theme}-marks-${name}.html`, `<!doctype html><html lang="ru" data-theme="${theme}" data-font="pixel"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Day marks — ${name}</title><style>${css}\nbody{overflow:auto;} .marks-preview{width:min(340px,calc(100vw - 36px));margin:32px auto;display:flex;flex-direction:column;gap:20px;}</style></head><body><div class="marks-preview">${html}</div></body></html>`);
    };
    await saveMarks('mood');
    await act(async () => [...document.querySelectorAll('[data-mood]')].find(element => element.dataset.mood === '😌').click());
    await clickMark('#day-marks-tab-color');
    await clickMark('[data-day-color="#64b5f6"]');
    await saveMarks('color');
    await clickMark('#day-marks-tab-stickers');
    for (const sticker of ['❤️', '☕', '⭐']) {
        await act(async () => [...document.querySelectorAll('[data-sticker]')].find(element => element.dataset.sticker === sticker).click());
    }
    await saveMarks('stickers');
    await clickMark('#day-countdown-toggle');
    await saveMarks('countdown');
    await clickMark('#btn-close-modal');
    await save('-marked-calendar');
    await act(async () => document.getElementById(`day-${dateKey(new Date())}`).click());
    if (theme === 'vanilla-sky') {
        const click = async element => act(async () => element.dispatchEvent(new MouseEvent('click', { bubbles: true })));
        await click(document.getElementById('btn-close-modal'));
        await click(document.getElementById('btn-notes-sidebar-toggle'));
        await save('-sidebar');
        await click(document.getElementById('btn-notes-sidebar-toggle'));
        await click(document.querySelectorAll('.calendar-view-toggle button')[1]);
        await save('-week');
        await click(document.getElementById('btn-open-settings'));
        await save('-settings');
    }
    await act(async () => root.unmount());
}
dom.window.close();
console.log('Created calendar previews for all five themes and isolated storm previews in dist/review/.');
