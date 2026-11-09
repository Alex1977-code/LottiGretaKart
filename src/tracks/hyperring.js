// Strecke: Hyperring – Archetyp Zukunfts-Rennring über dem Ozean aus Mario Kart 8 Deluxe (eigene Gestaltung): eine
// leuchtende Hochbahn auf schlanken Stelzen über dem Meer, mit vielen Turbo-Feldern, Leuchtbögen und zwei großen
// Anti-Gravitations-Abschnitten; mit dem Gleiter über die Lücke und in voller Fahrt auf die Zielgerade.
// Farben: Weiß, Cyan, Magenta, Ozeanblau.

const L = 14;   // Höhe der Hochbahn über dem Meer
const pts = [
  [-170, 80], [-70, 95], [30, 90], [110, 65],
  [160, 15], [170, -45], [130, -95],
  [60, -115], [-10, -100],
  [-70, -120], [-140, -100], [-190, -50], [-205, 20],
];

export default {
  id: 'hyperring',
  name: 'Hyperring',
  short: 'Hyper',
  theme: 'hyper',
  music: 'course_star',
  banner: 'HYPERRING',
  time: 'day',
  weather: 'sun',
  hw: 9,
  margin: 3,
  seed: 1733,
  ctrl: pts.map(([x, z]) => [x, z, 9, L]),
  heights: [2, 2, 2, 3, 5, 7, 6, 5, 2, 2, 3, 3, 2],
  antigrav: [[3.6, 6.4, 40], [9.2, 11.6, 30]],
  glides: [{ c: 7.2, w: 14 }],
  flights: [[7.4, 7.9]],
  land: { sea: true, island: { cx: 0, cz: 500, rx: 30, rz: 30 } },
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.05, -0.3], [0.08, 0.3], [0.18, 0], [0.3, -0.3], [0.33, 0.3], [0.5, 0], [0.66, -0.3], [0.69, 0.3], [0.8, 0], [0.92, 0], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.24, 0.28, 0.3, -0.3, 5], [0.44, 0.48, 0, 0, 6], [0.74, 0.78, 0, 0, 6], [0.88, 0.91, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.36, lat: 0.4 },
    { kind: 'spinpost', u: 0.42, lat: -0.4 },
    { kind: 'spinpost', u: 0.76, lat: 0.35 },
    { kind: 'spinpost', u: 0.82, lat: -0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    for (let k = 0; k < 14; k++) { const uu = k / 14 + 0.02; D.model('holo_ring', { u: uu, lat: 0 }, { opts: { width: 2 * (tr.wallAt(Math.round(uu * tr.N)) + 2), color: [0x3ad8ff, 0xff3ab8][k % 2] }, face: 'along', always: true }); }
    for (const [x, z, h, c] of [[-30, 0, 90, 0x3ad8ff], [80, -30, 70, 0xff3ab8], [-120, -20, 60, 0x3ad8ff], [260, 60, 110, 0xff3ab8], [-280, -160, 100, 0x3ad8ff]]) D.model('sky_tower', W(x, z), { opts: { h, color: c }, always: true });
    for (let k = 0; k < 6; k++) D.model('airship', W(-200 + k * 80, 180 - (k % 2) * 330), { y: 40 + k * 4, opts: { color: [0xfaf8f4, 0x3ad8ff][k % 2] }, always: true });
    D.model('dolphin', W(0, -30), { always: true, tick: (e, dt, t) => { const p = (t * 0.4 + e.t) % 3; e.model.root.position.y = p < 1 ? Math.sin(p * Math.PI) * 8 - 1 : -6; e.model.root.rotation.z = p < 1 ? (0.5 - p) * 2 : 0; e.model.root.rotation.y = 0.8; } });
  },
};
