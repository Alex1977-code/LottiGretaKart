// Strecke: Regenbogen-Ring – Archetyp großes Regenbogen-Finale im All aus Mario Kart 8 Deluxe (eigene Gestaltung):
// eine weite Regenbogenbahn ohne Leitplanken hoch über dem Planeten, mit Wellen, auf denen man abhebt, der großen
// Anti-Gravitations-Schleife um die Raumstation, einem langen Gleitflug zwischen zwei Ringen und einer Sternen-
// Spirale hinab zum Ziel; Sternschnuppen rollen über die Bahn. Farben: Regenbogen-Neon auf Tiefblau, Sternengold.

const L = 110;
const pts = [
  [-180, 100], [-80, 110], [20, 100], [110, 80],
  [170, 30], [200, -40], [170, -110], [100, -150],
  [20, -160],
  [-60, -150], [-140, -120], [-200, -60], [-225, 10], [-210, 70],
];

export default {
  id: 'regenbogenring',
  name: 'Regenbogen-Ring',
  short: 'Regenbogen',
  theme: 'space',
  music: 'course_star',
  banner: 'REGENBOGEN-RING',
  time: 'night',
  weather: 'sun',
  night: true,
  rainbow: true,
  hw: 8.5,
  margin: 2,
  seed: 1747,
  bridgePillars: false,
  noWalls: true,
  ctrl: pts.map(([x, z]) => [x, z, 8.5, L]),
  heights: [0, 0, 4, 10, 14, 10, 6, 10, 0, -16, -12, -8, -4, 0],
  bumps: [[0.6, 2.6, 1.4, 22]],
  antigrav: [[3.6, 7.2, 35]],
  glides: [{ c: 7.3, w: 14 }],
  flights: [[7.5, 8.7]],
  land: { sea: true, island: { cx: 0, cz: 900, rx: 10, rz: 10 }, noWater: true, backdrop: false },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.07, 0], [0.3, -0.3], [0.33, 0.3], [0.7, 0], [0.8, 0], [0.92, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.22, 0.26, 0.3, -0.3, 5], [0.4, 0.46, 0, 0, 6], [0.72, 0.78, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.32, lat: 0.4 },
    { kind: 'spinpost', u: 0.38, lat: -0.4 },
    { kind: 'spinpost', u: 0.44, lat: 0.3 },
    { kind: 'roller', u: 0.62, style: 'gum', color: 0xffd23a, size: 1.6, speed: 6 },
    { kind: 'roller', u: 0.85, style: 'gum', color: 0xffd23a, size: 1.4, speed: 7 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const put = (name, x, z, y, o = {}) => { const e = D.model(name, W(x, z), { ...o, always: true }); e.model.root.position.y = y; return e; };
    put('planet', 0, -20, 20, { opts: { r: 70, color: 0x3a8ae8, ring: true } });
    put('planet', 380, -300, 160, { opts: { r: 40, color: 0xff8a3a, ring: false } });
    put('planet', -400, 250, 190, { opts: { r: 30, color: 0xb06aff, ring: true } });
    put('space_station', 190, -40, L + 30, { scale: 1.4 });
    for (const [x, z] of [[60, -175], [-20, -175]]) put('holo_ring', x, z, L - 2, { opts: { width: 40, color: 0xffd23a }, yaw: 0 });
    for (let k = 0; k < 40; k++) { const a = k * 2.399, r = 150 + (k % 7) * 40; put('star_ring', Math.cos(a) * r, Math.sin(a) * r, L - 30 + (k % 9) * 12, { scale: 2 + (k % 3) }); }
  },
};
