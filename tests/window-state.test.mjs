import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { restoreWindowState, readWindowState, writeWindowState } = require('../electron/window-state.js');
const primary = { id: 1, workArea: { x: 0, y: 0, width: 1920, height: 1040 } };
const state = bounds => ({ version: 1, bounds, maximized: false });

test('placement preserves a connected monitor at negative coordinates and clamps oversized windows', () => {
    const left = { id: 2, workArea: { x: -1600, y: 0, width: 1600, height: 900 } };
    const bounds = { x: -1520, y: 50, width: 1100, height: 720 };
    assert.deepEqual(restoreWindowState(state(bounds), [primary, left], 1).bounds, bounds);
    const recovered = restoreWindowState(state(bounds), [primary], 1).bounds;
    assert.ok(recovered.x >= 0 && recovered.x + recovered.width <= primary.workArea.width);
    const small = { id: 3, workArea: { x: 0, y: 40, width: 800, height: 540 } };
    const fitted = restoreWindowState(state({ x: 0, y: 0, width: 2000, height: 1200 }), [small], 3);
    assert.deepEqual(fitted.bounds, small.workArea);
    assert.equal(fitted.minWidth, 800);
    assert.equal(fitted.minHeight, 540);
});

test('invalid placement uses visible defaults and never restores a minimized flag', () => {
    for (const input of [null, {}, state({ x: 0, y: 0, width: -1, height: 720 }), state({ x: Infinity, y: 0, width: 900, height: 600 })]) {
        const result = restoreWindowState(input, [primary], 1);
        assert.deepEqual(result.bounds, { x: 320, y: 90, width: 1280, height: 860 });
        assert.equal(result.maximized, false);
    }
});

test('window-state saves atomically, recovers a corrupt JSON from backup and retains valid files on failure', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'pixel-window-state-'));
    const filename = path.join(directory, 'window-state.json');
    try {
        const first = state({ x: 30, y: 40, width: 1000, height: 700 });
        const second = { ...first, maximized: true };
        assert.equal(writeWindowState(filename, first), true);
        assert.equal(writeWindowState(filename, second), true);
        assert.deepEqual(readWindowState(filename), second);
        fs.writeFileSync(filename, '{broken');
        assert.deepEqual(readWindowState(filename), first);
        assert.equal(writeWindowState(filename, second), true);
        assert.deepEqual(JSON.parse(fs.readFileSync(`${filename}.bak`, 'utf8')), first);
        const failedFs = { ...fs, renameSync() { throw new Error('disk unavailable'); } };
        assert.equal(writeWindowState(filename, first, failedFs), false);
        assert.deepEqual(readWindowState(filename), second);
        assert.equal(fs.existsSync(`${filename}.tmp`), false);
        fs.writeFileSync(filename, '{broken again'); fs.writeFileSync(`${filename}.bak`, '{also broken');
        assert.equal(readWindowState(filename), null);
    } finally { fs.rmSync(directory, { recursive: true, force: true }); }
});
