'use strict';

// Optional Windows smoke: electron tests/electron-native-smoke.cjs <isolated-profile>.
// Exercises our own Electron window lifecycle without loading personal calendar data.
const { app, BrowserWindow, nativeImage } = require('electron');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');

const profile = process.argv[2];
if (!profile || !path.basename(profile).startsWith('pixel-calendar-smoke-')) throw new Error('An isolated smoke profile is required');
fs.mkdirSync(profile, { recursive: true });
app.setPath('userData', profile);
app.setPath('sessionData', path.join(profile, 'session'));
app.disableHardwareAcceleration();
process.argv.push('--hidden');

const originalLoadURL = BrowserWindow.prototype.loadURL;
BrowserWindow.prototype.loadURL = function () {
    return originalLoadURL.call(this, 'data:text/html,<title>Pixel Calendar lifecycle test</title>');
};

const filename = path.resolve(__dirname, '../electron/main.js');
const main = new Module(filename, module);
main.filename = filename;
main.paths = Module._nodeModulePaths(path.dirname(filename));
main._compile(fs.readFileSync(filename, 'utf8') + '\nmodule.exports = { window: () => win, tray: () => tray, quitApp, showWindow };', filename);
const lifecycle = main.exports;
const resultFile = path.join(profile, 'smoke-result.json');
const checks = [];
const pause = () => new Promise(resolve => setTimeout(resolve, 100));
const ready = window => new Promise(resolve => window.once('ready-to-show', resolve));
const watchdog = setTimeout(() => {
    fs.writeFileSync(resultFile, JSON.stringify({ ok: false, error: 'Native smoke timed out', checks }));
    app.exit(1);
}, 15000);
watchdog.unref();

app.whenReady().then(async () => {
    try {
        let window = lifecycle.window();
        await ready(window);
        assert.equal(window.isVisible(), false);
        assert.equal(lifecycle.tray().isDestroyed(), false);
        checks.push('hidden startup has a live native tray');
        const fallback = require('../electron/tray-icon').createFallbackTrayIcon(nativeImage);
        assert.equal(fallback.isEmpty(), false);
        assert.equal(fallback.getSize().width, 16);
        checks.push('fallback bitmap is accepted by nativeImage');

        lifecycle.tray().emit('click');
        await pause();
        // STARTUPINFO SW_HIDE can suppress the first native ShowWindow in a hidden test process.
        if (!window.isVisible()) { window.hide(); lifecycle.showWindow(); await pause(); }
        assert.equal(window.isVisible(), true);
        const bounds = { x: 70, y: 80, width: 1060, height: 720 };
        window.setBounds(bounds);
        window.close();
        await pause();
        assert.equal(window.isDestroyed(), false);
        assert.equal(window.isVisible(), false);
        assert.deepEqual(JSON.parse(fs.readFileSync(path.join(profile, 'window-state.json'))).bounds, bounds);
        checks.push('native close hides the live window and flushes normal bounds');

        app.emit('window-all-closed');
        app.emit('second-instance', {}, [], profile);
        await pause();
        assert.equal(window.isVisible(), true);
        window.maximize();
        await pause();
        window.close();
        assert.equal(JSON.parse(fs.readFileSync(path.join(profile, 'window-state.json'))).maximized, true);
        checks.push('second-instance restores the window; maximization persists');

        window.destroy();
        app.emit('second-instance', {}, [], profile);
        window = lifecycle.window();
        await ready(window);
        assert.equal(window.isVisible(), true);
        assert.equal(window.isMaximized(), true);
        assert.deepEqual(window.getNormalBounds(), bounds);
        checks.push('recreated native window restores normal bounds and maximization');

        const tray = lifecycle.tray();
        app.once('will-quit', () => {
            assert.equal(window.isDestroyed(), true);
            assert.equal(tray.isDestroyed(), true);
            checks.push('explicit quit destroys the window and native tray');
            fs.writeFileSync(resultFile, JSON.stringify({ ok: true, checks }, null, 2));
        });
        lifecycle.quitApp();
    } catch (error) {
        fs.writeFileSync(resultFile, JSON.stringify({ ok: false, error: error.stack, checks }, null, 2));
        app.exit(1);
    }
});
