/**
 * sounds.js — Procedural 8-bit sound effects via Web Audio API
 * No audio files needed — generates short square-wave beeps.
 */

let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function beep(freq, duration, volume = 0.08, type = 'square') {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch {
        // Audio not available
    }
}

const SOUNDS = {
    click: () => beep(800, 0.06, 0.06),
    noteAdd: () => {
        beep(523, 0.08, 0.06);
        setTimeout(() => beep(659, 0.08, 0.06), 80);
        setTimeout(() => beep(784, 0.1, 0.05), 160);
    },
    noteDelete: () => {
        beep(400, 0.1, 0.05);
        setTimeout(() => beep(300, 0.12, 0.04), 100);
    },
    modalOpen: () => beep(600, 0.05, 0.04),
    navigate: () => beep(500, 0.04, 0.04),
    toggle: () => beep(700, 0.04, 0.05),
};

/**
 * Play a named sound effect.
 * @param {'click'|'noteAdd'|'noteDelete'|'modalOpen'|'navigate'|'toggle'} name
 */
export function playSound(name) {
    const fn = SOUNDS[name];
    if (fn) fn();
}
