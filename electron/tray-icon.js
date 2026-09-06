'use strict';

/** A visible pixel calendar even when packaged icon resources cannot be read. */
function createFallbackTrayIcon(nativeImage) {
    const size = 16;
    const pixels = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            const border = x < 1 || x > 14 || y < 2 || y > 14;
            const header = y < 6;
            const date = y >= 8 && y <= 11 && ((x >= 4 && x <= 6) || (x >= 9 && x <= 11));
            const color = border ? [67, 42, 92, 255] : header || date ? [139, 91, 174, 255] : [255, 244, 219, 255];
            const offset = (y * size + x) * 4;
            pixels[offset] = color[2];
            pixels[offset + 1] = color[1];
            pixels[offset + 2] = color[0];
            pixels[offset + 3] = color[3];
        }
    }
    return nativeImage.createFromBitmap(pixels, { width: size, height: size, scaleFactor: 1 });
}

module.exports = { createFallbackTrayIcon };
