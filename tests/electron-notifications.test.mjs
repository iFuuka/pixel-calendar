import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { mainHarness } from './electron-main-harness.mjs';

test('desktop popup routes actions, prevents double clicks and allows retry after failure', async () => {
    let onData, onError;
    const actions = [];
    const dom = new JSDOM(await readFile('electron/notification.html', 'utf8'), {
        runScripts: 'dangerously', beforeParse(window) {
            window.notificationApi = {
                onData: fn => { onData = fn; }, onActionError: fn => { onError = fn; },
                action: action => actions.push(action), close() {},
            };
        },
    });
    try {
        const doc = dom.window.document;
        onData({ kind: 'reminder', dateKey: '2026-09-07', noteText: '18:30 · Японский', tags: 'учёба', openLabel: 'Открыть событие', snoozeLabel: 'Напомнить через 15 минут' });
        assert.equal(doc.querySelector('#actions').hidden, false);
        doc.querySelector('#snoozeEvent').click();
        doc.querySelector('#snoozeEvent').click();
        assert.deepEqual(actions, ['snooze']);
        assert.equal(doc.querySelector('#closeBtn').disabled, true);
        onError('Не удалось сохранить. Повторите попытку.');
        assert.equal(doc.querySelector('#closeBtn').disabled, false);
        assert.equal(doc.querySelector('#actionError').hidden, false);
        doc.querySelectorAll('script').forEach(script => script.remove());
        await mkdir('dist/review', { recursive: true });
        await writeFile('dist/review/notification.html', dom.serialize());
        doc.querySelector('#openEvent').click();
        assert.deepEqual(actions, ['snooze', 'open']);
    } finally { dom.window.close(); }
});

async function actionHarness() {
    const { windows, timers, ipcMain, createWindow } = await mainHarness();
    createWindow();
    ipcMain.emit('show-reminder', {}, { kind: 'reminder', noteId: 'event-1', noteText: 'Study', dateKey: '2026-09-07' });
    return { main: windows[0], popup: windows[1], ipcMain, timers };
}

test('Electron actions require the owning sender and a successful save acknowledgement', async () => {
    const { main, popup, ipcMain, timers } = await actionHarness();
    ipcMain.emit('notification-action', { sender: main.webContents }, 'snooze');
    assert.equal(main.messages.length, 0);
    ipcMain.emit('notification-action', { sender: popup.webContents }, 'snooze');
    const request = main.messages.at(-1);
    assert.equal(request.channel, 'reminder-action');
    assert.equal(request.data.notification.noteId, 'event-1');
    ipcMain.emit('close-notification');
    assert.equal(popup.closed, undefined);
    ipcMain.emit('reminder-action-result', { sender: popup.webContents }, request.data.id, { ok: true });
    assert.equal(popup.closed, undefined);
    ipcMain.emit('reminder-action-result', { sender: main.webContents }, request.data.id, { ok: false, error: 'Storage full' });
    assert.equal(popup.messages.at(-1).data, 'Storage full');
    assert.equal(popup.closed, undefined);
    assert.equal(timers.size, 0);
    ipcMain.emit('notification-action', { sender: popup.webContents }, 'snooze');
    const retry = main.messages.at(-1).data;
    ipcMain.emit('reminder-action-result', { sender: main.webContents }, request.data.id, { ok: true });
    assert.equal(popup.closed, undefined);
    ipcMain.emit('reminder-action-result', { sender: main.webContents }, retry.id, { ok: true });
    assert.equal(popup.closed, true);
    assert.equal(main.shown, undefined);
    assert.equal(timers.size, 0);
});

test('Electron timeout leaves the reminder available; opening it restores the calendar after acknowledgement', async () => {
    const { main, popup, ipcMain, timers } = await actionHarness();
    ipcMain.emit('notification-action', { sender: popup.webContents }, 'open');
    const first = main.messages.at(-1).data;
    const timer = [...timers][0]; timers.delete(timer); timer.callback();
    assert.equal(popup.messages.at(-1).channel, 'notification-action-error');
    assert.equal(popup.closed, undefined);
    ipcMain.emit('reminder-action-result', { sender: main.webContents }, first.id, { ok: true });
    assert.equal(main.shown, undefined);
    ipcMain.emit('notification-action', { sender: popup.webContents }, 'open');
    ipcMain.emit('reminder-action-result', { sender: main.webContents }, main.messages.at(-1).data.id, { ok: true });
    assert.equal(main.shown, true);
    assert.equal(main.focused, true);
    assert.equal(popup.closed, true);
});

test('Electron queues simultaneous notifications and does not reopen them on quit', async () => {
    const { windows, app, ipcMain } = await mainHarness();
    ipcMain.emit('show-reminder', {}, { noteText: 'First', dateKey: '2026-09-07' });
    ipcMain.emit('show-reminder', {}, { noteText: 'Second', dateKey: '2026-09-07' });
    assert.equal(windows.length, 1);
    windows[0].emit('ready-to-show');
    assert.equal(windows[0].messages.at(-1).data.noteText, 'First');
    ipcMain.emit('close-notification');
    assert.equal(windows.length, 2);
    windows[1].emit('ready-to-show');
    assert.equal(windows[1].messages.at(-1).data.noteText, 'Second');
    ipcMain.emit('show-reminder', {}, { noteText: 'Third' });
    app.emit('before-quit');
    ipcMain.emit('close-notification');
    assert.equal(windows.length, 2);
});
