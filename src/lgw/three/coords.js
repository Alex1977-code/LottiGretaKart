// Ersatz für View3D (Phaser-frei): Weltpixel → 3D-Einheiten (1 Einheit = 1 Tile = 16 px).
// Wird nur vom Avatar-Grundgerüst im Klassik-Modus gebraucht; das Kartspiel nutzt den Kurs-Modus.
export const U = 1 / 16;
export const toX = (px) => px * U;
export const toY = (py) => -py * U;
