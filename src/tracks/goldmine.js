// Strecke: Goldmine – Archetyp Bergwerk aus Mario Kart 8 Deluxe (eigene Gestaltung): tief im Berg unter der
// Felsdecke, zwischen Holzstollen und Laternen, Loren fahren auf der Strecke mit; über die Holzbrücke hoch über dem
// unterirdischen See, an glitzernden Goldhaufen und Kristallen vorbei. Warmes Laternenlicht im Dunkeln.
// Farben: Gold, Holzbraun, Felsgrau, Kristallblau.

export default {
  id: 'goldmine',
  name: 'Goldmine',
  short: 'Goldmine',
  theme: 'mine',
  music: 'course_cave',
  banner: 'GOLDMINE',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1189,
  ctrl: [
    [-150, 70], [-60, 85], [30, 80], [100, 55],
    [140, 5], [130, -55], [80, -95],
    // Holzbrücke über den unterirdischen See
    [10, -105, 7.5, 5], [-50, -85, 7.5, 5],
    [-100, -50], [-160, -60], [-200, -15], [-185, 40],
  ],
  heights: [3, 3, 3, 4, 6, 7, 6, 4, 4, 3, 3, 3, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [9.5, 12], side: 1, h: 18 }],
  tunnels: [{ c: [5.2, 6.2] }],
  shortcuts: [{ pts: [[-96, -44], [-138, -5], [-180, 35]], w: 4, kind: 'dirt' }],
  bumps: [[1.2, 2.8, 0.8, 9]],
  land: {
    flats: [{ x: -20, z: 0, r: 260, h: 3 }],
    lakes: [{ x: -20, z: -95, r: 45, depth: 6 }],
    noWater: false,
    backdrop: false,
  },
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.22, 0], [0.42, 0.3], [0.72, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.27, 0.31, 0.3, -0.3, 5], [0.55, 0.6, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'traffic', u: 0.12, lane: -3.5, speed: 9, model: 'mine_cart', length: 3.4 },
    { kind: 'traffic', u: 0.4, lane: 3.5, speed: 10, model: 'mine_cart', length: 3.4 },
    { kind: 'traffic', u: 0.68, lane: -3.5, speed: 9, model: 'mine_cart', length: 3.4 },
    { kind: 'stampfstein', u: 0.3, lat: 0 },
    { kind: 'stampfstein', u: 0.84, lat: -0.4 },
  ],
  scenery(D) {
    const tr = D.track;
    const gw = (uu) => 2 * (tr.wallAt(Math.round(uu * tr.N)) + 1);
    D.ceiling = true;
    D.ceilingY = 24;
    for (let k = 0; k < 22; k++) { const uu = k / 22 + 0.02; D.model('mine_frame', { u: uu, lat: 0 }, { opts: { width: gw(uu) }, face: 'along' }); }
    for (let k = 0; k < 16; k++) D.model('gold_pile', { u: k / 16 + 0.03, side: k % 2 ? 1 : -1, dist: 3 + (k % 3) * 3 }, { scale: 1.2 + (k % 2) * 0.6 });
    for (let k = 0; k < 10; k++) D.model('mine_cart', { u: k / 10 + 0.05, side: k % 2 ? -1 : 1, dist: 6 }, { face: 'along' });
    D.scatter('crystal', 70, { dist0: 1, dist1: 30, s0: 0.8, s1: 2.2, colors: [0x58b8ff, 0x3ae0d0, 0xffd23a], size: 1 });
    D.scatter('rock', 100, { dist0: 1, dist1: 35, s0: 1.2, s1: 3.2, colors: [0x5a4e48, 0x6a5e56, 0x4e4440], size: 1.5 });
    for (let i = 0; i < 80; i++) { const p = tr.pointAt(i / 80 + 0.004, (D.r() * 2 - 1) * (tr.hw[0] + 10)); D.add('stalactite', p.x, 20 + D.r() * 3, p.z, 0.9 + D.r() * 1.2, 0x5a4e48, D.r() * 6); }
    for (let k = 0; k < 12; k++) D.model('lantern', { u: k / 12 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { state: 'on', scale: 1.3 });
    for (const [uu, side] of [[0.15, -1], [0.5, 1], [0.8, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
