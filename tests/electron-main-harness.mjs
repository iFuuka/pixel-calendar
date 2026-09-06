import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
import { createRequire } from 'node:module';
import { EventEmitter } from 'node:events';

const require = createRequire(import.meta.url);
const windowState = require('../electron/window-state.js');
const trayIcon = require('../electron/tray-icon.js');

export async function mainHarness({ launch = false, hidden = false, badIcon = false, trayFailure = false, saved = null } = {}) {
    const windows = [], trays = [], timers = new Set(), writes = [];
    const displays = [{ id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1040 }, workAreaSize: { width: 1920, height: 1040 } }];
    class BrowserWindow extends EventEmitter {
        constructor(options) {
            super(); windows.push(this); this.options = options; this.messages = [];
            this.bounds = { x: options.x || 0, y: options.y || 0, width: options.width, height: options.height };
            this.webContents = { send: (channel, data) => this.messages.push({ channel, data }) };
        }
        loadFile() {} loadURL() {} removeMenu() {} showInactive() {}
        isDestroyed() { return !!this.closed; }
        isMinimized() { return !!this.minimized; }
        isMaximized() { return !!this.maximized && !this.minimized; }
        isVisible() { return !!this.visible; }
        getNormalBounds() { return { ...this.bounds }; }
        setBounds(bounds) { this.bounds = { ...bounds }; this.emit('move'); this.emit('resize'); }
        setMinimumSize(width, height) { this.minimumSize = { width, height }; }
        show() { this.shown = true; this.visible = true; }
        hide() { this.visible = false; }
        focus() { this.focused = true; }
        maximize() { this.maximized = true; this.emit('maximize'); }
        unmaximize() { this.maximized = false; this.emit('unmaximize'); }
        restore() { this.minimized = false; }
        close() {
            const event = { defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } };
            this.emit('close', event);
            if (!event.defaultPrevented) { this.closed = true; this.visible = false; this.emit('closed'); }
            return event;
        }
        destroy() { this.closed = true; this.emit('closed'); }
    }
    class Tray extends EventEmitter {
        constructor(icon) { super(); if (trayFailure) throw new Error('Tray unavailable'); this.icon = icon; trays.push(this); }
        setToolTip() {} setContextMenu(menu) { this.menu = menu; }
        isDestroyed() { return !!this.destroyed; }
        destroy() { this.destroyed = true; }
    }
    const app = new EventEmitter();
    let ready;
    app.whenReady = () => ({ then(callback) { ready = callback; } });
    app.getPath = name => path.join('isolated-test-profile', name);
    app.requestSingleInstanceLock = () => true;
    app.quitCalls = 0;
    app.quit = () => {
        app.quitCalls++;
        app.emit('before-quit');
        windows.filter(window => !window.closed).forEach(window => window.close());
        app.emit('will-quit');
    };
    const ipcMain = new EventEmitter(); ipcMain.handle = () => {};
    const screen = new EventEmitter();
    screen.getPrimaryDisplay = () => displays[0];
    screen.getAllDisplays = () => displays;
    const powerMonitor = new EventEmitter();
    const nativeImage = {
        createFromPath: () => ({ resize() { return this; }, isEmpty: () => badIcon }),
        createFromBitmap: (pixels, dimensions) => ({ pixels, dimensions, isEmpty: () => false }),
    };
    const electron = { app, BrowserWindow, Tray, Menu: { buildFromTemplate: menu => menu }, nativeImage, ipcMain, screen, powerMonitor };
    const context = vm.createContext({
        require: name => {
            if (name === 'electron') return electron;
            if (name === 'path') return path;
            if (name === './tray-icon') return trayIcon;
            if (name === './window-state') return { ...windowState, readWindowState: () => saved, writeWindowState: (_file, state) => { writes.push(state); saved = state; return true; } };
            throw new Error(`Unexpected module: ${name}`);
        },
        process: { argv: hidden ? ['--hidden'] : [], env: {}, platform: 'win32' },
        __dirname: path.resolve('electron'), console: { ...console, warn() {} },
        setTimeout: callback => { const timer = { callback, unref() {} }; timers.add(timer); return timer; },
        clearTimeout: timer => timers.delete(timer),
    });
    vm.runInContext(await readFile('electron/main.js', 'utf8'), context);
    if (launch) ready();
    return { windows, trays, timers, writes, app, ipcMain, screen, displays, powerMonitor, context,
        createWindow: () => vm.runInContext('createWindow()', context),
        flushTimers: () => { for (const timer of [...timers]) { timers.delete(timer); timer.callback(); } },
    };
}
