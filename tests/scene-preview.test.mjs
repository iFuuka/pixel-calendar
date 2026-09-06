import test, { after, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { SCENE_PRESETS, SCENE_DEMO_INTERVAL_MS } from '../src/utils/scenePresets.js';

const dom = new JSDOM('<div id="root"></div>', { pretendToBeVisual: true });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'Event']) {
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value: dom.window[key] });
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const React = await import('react');
const { act } = React;
const { createRoot } = await import('react-dom/client');
const cacheDir = resolve('node_modules/.cache/pixel-calendar-tests');
await mkdir(cacheDir, { recursive: true });
const result = await build({
    stdin: { contents: "export { useScenePreview } from './src/hooks/useScenePreview.js'; export { default as PixelWindow } from './src/components/PixelWindow.jsx';", resolveDir: process.cwd() },
    bundle: true, write: false, format: 'esm', platform: 'browser', jsx: 'automatic',
    external: ['react', 'react-dom', 'react-dom/client'], loader: { '.css': 'empty' },
});
const output = resolve(cacheDir, 'scene-preview.mjs');
await writeFile(output, result.outputFiles[0].text);
const { useScenePreview, PixelWindow } = await import(pathToFileURL(output));
let root, preview;
function Harness({ isOpen }) {
    preview = useScenePreview(isOpen);
    return null;
}
const render = isOpen => act(async () => root.render(React.createElement(Harness, { isOpen })));
async function visibility(value) {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value });
    await act(async () => document.dispatchEvent(new Event('visibilitychange')));
}
beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
    root = createRoot(document.getElementById('root'));
});
afterEach(async () => { await act(async () => root.unmount()); });
after(() => dom.window.close());

test('scene slideshow visits every preset, wraps, pauses and resumes a manual selection', async t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    await render(true);
    assert.equal(preview.scenePreview, null);
    await act(async () => preview.setScenePlaying(true));
    assert.deepEqual(preview.scenePreview, SCENE_PRESETS[0].scene);
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS - 1));
    assert.deepEqual(preview.scenePreview, SCENE_PRESETS[0].scene);
    await act(async () => t.mock.timers.tick(1));
    assert.deepEqual(preview.scenePreview, SCENE_PRESETS[1].scene);
    for (let i = 2; i <= SCENE_PRESETS.length; i++) {
        await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS));
        assert.deepEqual(preview.scenePreview, SCENE_PRESETS[i % SCENE_PRESETS.length].scene);
    }
    await act(async () => preview.setScenePlaying(false));
    await act(async () => preview.setScenePreview(SCENE_PRESETS[3].scene));
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 3));
    assert.deepEqual(preview.scenePreview, SCENE_PRESETS[3].scene);
    await act(async () => preview.setScenePlaying(true));
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS));
    assert.deepEqual(preview.scenePreview, SCENE_PRESETS[4].scene);
});

test('slideshow runs only in a visible open admin panel and disposes its timer and visibility subscription', async t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    let ticks = 0;
    const originalInterval = globalThis.setInterval;
    t.mock.method(globalThis, 'setInterval', (callback, ...args) => originalInterval(() => { ticks++; callback(); }, ...args));
    const listeners = new Set();
    const addEventListener = document.addEventListener.bind(document);
    const removeEventListener = document.removeEventListener.bind(document);
    t.mock.method(document, 'addEventListener', (type, fn, ...args) => {
        if (type === 'visibilitychange') listeners.add(fn);
        return addEventListener(type, fn, ...args);
    });
    t.mock.method(document, 'removeEventListener', (type, fn, ...args) => {
        if (type === 'visibilitychange') listeners.delete(fn);
        return removeEventListener(type, fn, ...args);
    });
    await render(false);
    await act(async () => preview.setScenePlaying(true));
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 2));
    assert.equal(ticks, 0);
    await visibility('hidden');
    await render(true);
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 2));
    assert.equal(ticks, 0);
    await visibility('visible');
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS));
    assert.equal(ticks, 1);
    const beforeHidden = preview.scenePreview;
    await visibility('hidden');
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 5));
    assert.equal(ticks, 1);
    assert.equal(preview.scenePreview, beforeHidden);
    await visibility('visible');
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS - 1));
    assert.equal(ticks, 1, 'Returning to the app gives the displayed scene a full interval');
    await act(async () => t.mock.timers.tick(1));
    assert.equal(ticks, 2);
    await render(false);
    assert.equal(listeners.size, 0);
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 2));
    assert.equal(ticks, 2);
    await render(true);
    assert.equal(listeners.size, 1);
    await act(async () => root.unmount());
    assert.equal(listeners.size, 0);
    await visibility('visible');
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 2));
    assert.equal(ticks, 2, 'Unmounting removes the active interval');
    root = createRoot(document.getElementById('root'));
});

test('reset leaves neither a selected scene nor an active showcase or slideshow', async t => {
    t.mock.timers.enable({ apis: ['setInterval'] });
    await render(true);
    await act(async () => {
        preview.setScenePreview({ season: 'winter', weather: 'rain', phase: 'night' });
        preview.setSceneShowcase(true);
        preview.setScenePlaying(true);
    });
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS));
    assert.deepEqual(preview.scenePreview, SCENE_PRESETS[0].scene, 'A custom combination starts the preset sequence at its beginning');
    await act(async () => preview.resetScenePreview());
    assert.equal(preview.scenePreview, null);
    assert.equal(preview.sceneShowcase, false);
    assert.equal(preview.scenePlaying, false);
    await act(async () => t.mock.timers.tick(SCENE_DEMO_INTERVAL_MS * 2));
    assert.equal(preview.scenePreview, null);
});

test('ambient window motion pauses while hidden and respects the animation preference after resuming', async () => {
    const renderWindow = animated => act(async () => root.render(React.createElement(PixelWindow, {
        scene: { season: 'summer', weather: 'clear', phase: 'night' }, animated,
    })));
    const enabled = () => document.querySelector('.pixel-window').dataset.animated;
    await renderWindow(true);
    assert.equal(enabled(), 'true');
    await visibility('hidden');
    assert.equal(enabled(), 'false');
    await visibility('visible');
    assert.equal(enabled(), 'true');
    await renderWindow(false);
    assert.equal(enabled(), 'false');
    await visibility('hidden');
    await visibility('visible');
    assert.equal(enabled(), 'false');
});
