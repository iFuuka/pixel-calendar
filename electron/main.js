'use strict';

const { app, BrowserWindow, Tray, Menu, nativeImage, shell, ipcMain, screen } = require('electron');
const path = require('path');

// ─── Constants ──────────────────────────────────────────────────────────────
const DEV_SERVER_URL = 'http://localhost:5173';
const isDev = !app.isPackaged;

// ─── State ───────────────────────────────────────────────────────────────────
let win = null;
let tray = null;
let notifWin = null;
let startMinimized = false;

// ─── Create Window ────────────────────────────────────────────────────────────
function createWindow() {
    win = new BrowserWindow({
        width: 1280,
        height: 860,
        minWidth: 900,
        minHeight: 600,
        title: 'Pixel Calendar ✨',
        icon: getIconPath(),
        autoHideMenuBar: true,        // Hides the traditional File/Edit menu
        backgroundColor: '#fdf6f0',   // Vanilla Sky bg — prevents white flash on startup
        show: false,                  // show only after load to avoid blank startup
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            webSecurity: true,
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    // Completely remove the default default menu bar (File/Edit/View/Window/Help)
    win.removeMenu();

    // Load the app
    if (isDev) {
        win.loadURL(DEV_SERVER_URL);
        // Optionally open DevTools in dev mode
        // win.webContents.openDevTools();
    } else {
        win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
    }

    // Show window once ready (unless silent/minimized start)
    win.once('ready-to-show', () => {
        if (startMinimized) {
            // Stay hidden in tray on silent start
            startMinimized = false; // Only applies once (on app launch)
        } else {
            win.show();
            win.focus();
        }
    });

    // ── Key behaviour: HIDE on close, don't quit ──────────────────────────────
    win.on('close', (event) => {
        if (!app.isQuitting) {
            event.preventDefault();
            win.hide();
            // On macOS also hide from Dock
            if (process.platform === 'darwin') app.dock?.hide();
        }
    });

    win.on('closed', () => {
        win = null;
    });
}

// ─── System Tray ─────────────────────────────────────────────────────────────
function createTray() {
    const iconPath = getIconPath();
    let icon;
    try {
        icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
        if (icon.isEmpty()) throw new Error('Empty icon');
    } catch {
        // Fallback: use an empty image so the tray still appears (shows blank)
        icon = nativeImage.createEmpty();
        console.warn('[Electron] Tray icon not found at', iconPath, '— using blank icon');
    }
    tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: '🌸 Show Calendar',
            click: () => showWindow(),
        },
        { type: 'separator' },
        {
            label: '✕ Quit App',
            click: () => quitApp(),
        },
    ]);

    tray.setToolTip('Pixel Calendar ✨');
    tray.setContextMenu(contextMenu);

    // Double-click to restore the window
    tray.on('double-click', () => showWindow());

    // Single-click on Windows also shows the window (optional — nice UX)
    tray.on('click', () => showWindow());
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function showWindow() {
    if (!win) {
        createWindow();
        return;
    }
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
    if (process.platform === 'darwin') app.dock?.show();
}

function quitApp() {
    app.isQuitting = true;
    app.quit();
}

function getIconPath() {
    if (isDev) {
        // Look in public/ for dev mode so it's always found before build
        return path.join(__dirname, '..', 'public', 'icon.png');
    }
    return path.join(process.resourcesPath, 'icon.png');
}

// ─── Detect silent/hidden launch ─────────────────────────────────────────────
if (process.argv.includes('--hidden')) {
    startMinimized = true;
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
    // Single instance lock — prevents multiple copies running
    const gotLock = app.requestSingleInstanceLock();
    if (!gotLock) {
        app.quit();
        return;
    }

    app.on('second-instance', () => {
        // Focus the existing window if a second instance is launched
        if (win) showWindow();
    });

    createWindow();
    createTray();
});

app.on('window-all-closed', (e) => {
    // Keep running in background (tray), only quit explicitly
    e.preventDefault();
});

app.on('activate', () => {
    // macOS: re-create window when clicking Dock icon
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    else showWindow();
});

app.on('before-quit', () => {
    app.isQuitting = true;
});

// ─── Custom Notification Window ──────────────────────────────────────────────
function showNotificationWindow(data) {
    // Close any existing notification
    if (notifWin && !notifWin.isDestroyed()) {
        notifWin.close();
        notifWin = null;
    }

    const display = screen.getPrimaryDisplay();
    const { width: screenW, height: screenH } = display.workAreaSize;
    const notifW = 360;
    const notifH = 200;

    notifWin = new BrowserWindow({
        width: notifW,
        height: notifH,
        x: screenW - notifW - 16,
        y: screenH - notifH - 16,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        focusable: false,
        show: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    notifWin.loadFile(path.join(__dirname, 'notification.html'));

    notifWin.once('ready-to-show', () => {
        notifWin.showInactive();
        notifWin.webContents.send('notification-data', data);
    });

    notifWin.on('closed', () => {
        notifWin = null;
    });

    // Auto-close after 9 seconds (slightly longer than the progress bar)
    setTimeout(() => {
        if (notifWin && !notifWin.isDestroyed()) {
            notifWin.close();
        }
    }, 9000);
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.on('show-reminder', (event, data) => {
    showNotificationWindow(data);
});

ipcMain.on('close-notification', () => {
    if (notifWin && !notifWin.isDestroyed()) {
        notifWin.close();
    }
});

// ─── Auto-start (login item) settings ───────────────────────────────────────

/** Get the real exe path — for portable builds, use the original exe, not the temp-extracted one */
function getAutoStartPath() {
    // electron-builder sets PORTABLE_EXECUTABLE_FILE for portable apps
    return process.env.PORTABLE_EXECUTABLE_FILE || app.getPath('exe');
}

ipcMain.handle('set-auto-start', (event, enabled, minimized) => {
    const appPath = getAutoStartPath();
    if (enabled) {
        app.setLoginItemSettings({
            openAtLogin: true,
            path: appPath,
            args: minimized ? ['--hidden'] : [],
        });
    } else {
        app.setLoginItemSettings({
            openAtLogin: false,
            path: appPath,
            args: [],
        });
    }
    return { ok: true };
});

ipcMain.handle('get-auto-start', () => {
    const loginSettings = app.getLoginItemSettings({ path: getAutoStartPath() });
    return {
        enabled: loginSettings.openAtLogin,
        minimized: (loginSettings.openAtLogin && loginSettings.launchItems?.[0]?.args?.includes?.('--hidden'))
            || process.argv.includes('--hidden'),
    };
});
