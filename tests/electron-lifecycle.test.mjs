import test from 'node:test';
import assert from 'node:assert/strict';
import { mainHarness } from './electron-main-harness.mjs';

test('closing the main window keeps the renderer alive and tray clicks restore it', async () => {
    const { windows, trays, app, powerMonitor } = await mainHarness({ launch: true });
    const main = windows[0]; main.emit('ready-to-show');
    assert.equal(main.close().defaultPrevented, true);
    assert.equal(main.isVisible(), false);
    assert.equal(main.isDestroyed(), false);
    assert.equal(app.quitCalls, 0);
    powerMonitor.emit('resume');
    assert.equal(main.messages.at(-1).channel, 'weather-resume');
    assert.equal(main.options.webPreferences.backgroundThrottling, false);
    main.minimized = true;
    trays[0].emit('click');
    assert.equal(main.isVisible(), true);
    assert.equal(main.isMinimized(), false);
    assert.equal(main.focused, true);
    main.close(); trays[0].emit('double-click');
    assert.equal(main.isVisible(), true);
});

test('missing icon uses opaque pixel artwork; a destroyed tray is recreated on close', async () => {
    const { windows, trays } = await mainHarness({ launch: true, badIcon: true });
    const bitmap = trays[0].icon;
    assert.equal(bitmap.dimensions.width, 16);
    assert.equal(bitmap.pixels.length, 16 * 16 * 4);
    assert.equal(bitmap.pixels.filter((_value, index) => index % 4 === 3).every(value => value === 255), true);
    trays[0].destroy();
    windows[0].close();
    assert.equal(trays.length, 2);
    assert.equal(windows[0].isDestroyed(), false);
});

test('failed tray creation cannot make normal or hidden startup inaccessible', async () => {
    const { windows, app } = await mainHarness({ launch: true, hidden: true, trayFailure: true });
    const main = windows[0]; main.emit('ready-to-show');
    assert.equal(main.isVisible(), true);
    assert.equal(main.close().defaultPrevented, true);
    assert.equal(main.isVisible(), true);
    assert.equal(app.quitCalls, 0);
});

test('hidden startup stays in tray and a second launch opens or recreates its main window', async () => {
    const { windows, app } = await mainHarness({ launch: true, hidden: true });
    const main = windows[0]; main.emit('ready-to-show');
    assert.equal(main.isVisible(), false);
    app.emit('second-instance');
    assert.equal(main.isVisible(), true);
    main.destroy();
    app.emit('second-instance');
    assert.equal(windows.length, 2);
    windows[1].emit('ready-to-show');
    assert.equal(windows[1].isVisible(), true);
});

test('window-all-closed needs no argument and explicit tray Quit closes windows and removes the icon', async () => {
    const { windows, trays, app, writes } = await mainHarness({ launch: true });
    assert.doesNotThrow(() => app.emit('window-all-closed'));
    assert.equal(app.quitCalls, 0);
    trays[0].menu.find(item => item.label?.includes('Quit')).click();
    assert.equal(app.quitCalls, 1);
    assert.equal(windows[0].isDestroyed(), true);
    assert.equal(trays[0].isDestroyed(), true);
    assert.ok(writes.length > 0);
    app.emit('window-all-closed');
    assert.equal(windows.length, 1);
});

test('moves and resizes debounce normal bounds; closing flushes maximized placement even while minimized', async () => {
    const { windows, writes, timers, flushTimers } = await mainHarness({ launch: true });
    const main = windows[0]; main.emit('ready-to-show');
    const bounds = { x: 100, y: 80, width: 1080, height: 720 };
    main.setBounds(bounds); main.emit('move'); main.emit('resize');
    assert.equal(timers.size, 1);
    assert.equal(writes.length, 0);
    flushTimers();
    assert.deepEqual(writes.at(-1).bounds, bounds);
    main.maximize(); main.minimized = true; main.close();
    assert.equal(timers.size, 0);
    assert.equal(writes.at(-1).maximized, true);
    assert.deepEqual(writes.at(-1).bounds, bounds);
    assert.equal('minimized' in writes.at(-1), false);
});

test('saved maximization restores on opening and disconnected displays cannot strand the window', async () => {
    const saved = { version: 1, bounds: { x: 200, y: 80, width: 1100, height: 720 }, maximized: true };
    const { windows, displays, screen, trays } = await mainHarness({ launch: true, hidden: true, saved });
    const main = windows[0]; main.emit('ready-to-show');
    assert.equal(main.isVisible(), false);
    assert.equal(main.isMaximized(), false);
    trays[0].emit('click');
    assert.equal(main.isMaximized(), true);
    assert.deepEqual(main.bounds, saved.bounds);
    displays.push({ id: 2, workArea: { x: 1920, y: 0, width: 1600, height: 900 } });
    main.setBounds({ x: 2100, y: 90, width: 1100, height: 720 });
    displays.pop(); screen.emit('display-removed');
    assert.ok(main.bounds.x + main.bounds.width <= displays[0].workArea.width);
    assert.equal(main.isMaximized(), true);
    main.close();
    main.bounds = { x: -3000, y: 0, width: 1100, height: 720 };
    screen.emit('display-removed');
    assert.equal(main.isVisible(), false);
    trays[0].emit('click');
    assert.ok(main.bounds.x >= 0);
    assert.equal(main.isVisible(), true);
});
