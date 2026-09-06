'use strict';

const fs = require('fs');
const path = require('path');

const DEFAULT_BOUNDS = { width: 1280, height: 860 };
const MIN_WIDTH = 900;
const MIN_HEIGHT = 600;

function validState(value) {
    const bounds = value?.bounds;
    return value?.version === 1 && typeof value.maximized === 'boolean' && bounds
        && ['x', 'y', 'width', 'height'].every(key => Number.isSafeInteger(bounds[key]))
        && bounds.width > 0 && bounds.height > 0;
}

function intersectionArea(a, b) {
    return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x))
        * Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
}

/** All coordinates are Electron DIP, including displays to the left of the primary. */
function restoreWindowState(saved, displays, primaryId) {
    const available = displays.filter(display => display.workArea?.width > 0 && display.workArea?.height > 0);
    const primary = available.find(display => display.id === primaryId) || available[0];
    if (!primary) throw new Error('No display work area is available');
    const hasSaved = validState(saved);
    const original = hasSaved ? saved.bounds : DEFAULT_BOUNDS;
    const target = hasSaved ? available.reduce((best, display) =>
        intersectionArea(original, display.workArea) > intersectionArea(original, best.workArea) ? display : best,
    primary) : primary;
    const area = target.workArea;
    const minWidth = Math.min(MIN_WIDTH, area.width);
    const minHeight = Math.min(MIN_HEIGHT, area.height);
    const width = Math.min(area.width, Math.max(minWidth, original.width));
    const height = Math.min(area.height, Math.max(minHeight, original.height));
    const hasOverlap = hasSaved && intersectionArea(original, area) > 0;
    const x = hasOverlap ? Math.min(area.x + area.width - width, Math.max(area.x, original.x))
        : area.x + Math.round((area.width - width) / 2);
    const y = hasOverlap ? Math.min(area.y + area.height - height, Math.max(area.y, original.y))
        : area.y + Math.round((area.height - height) / 2);
    return { bounds: { x, y, width, height }, minWidth, minHeight, maximized: hasSaved && saved.maximized };
}

function readStateFile(filePath, fileSystem) {
    try {
        const state = JSON.parse(fileSystem.readFileSync(filePath, 'utf8'));
        return validState(state) ? state : null;
    } catch { return null; }
}

function readWindowState(filePath, fileSystem = fs) {
    return readStateFile(filePath, fileSystem) || readStateFile(`${filePath}.bak`, fileSystem);
}

/** Write beside the target and replace it only after the complete JSON is on disk. */
function writeWindowState(filePath, state, fileSystem = fs) {
    if (!validState(state)) return false;
    const temporary = `${filePath}.tmp`;
    let descriptor;
    try {
        fileSystem.mkdirSync(path.dirname(filePath), { recursive: true });
        descriptor = fileSystem.openSync(temporary, 'w');
        fileSystem.writeFileSync(descriptor, JSON.stringify(state), 'utf8');
        fileSystem.fsyncSync(descriptor);
        fileSystem.closeSync(descriptor);
        descriptor = undefined;
        // A damaged primary must never replace the last valid backup.
        if (readStateFile(filePath, fileSystem)) fileSystem.copyFileSync(filePath, `${filePath}.bak`);
        fileSystem.renameSync(temporary, filePath);
        return true;
    } catch {
        if (descriptor !== undefined) { try { fileSystem.closeSync(descriptor); } catch { /* Already closed. */ } }
        try { fileSystem.unlinkSync(temporary); } catch { /* No temporary file was created. */ }
        return false;
    }
}

module.exports = { restoreWindowState, readWindowState, writeWindowState };
