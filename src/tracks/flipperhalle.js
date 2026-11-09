// Strecke: Flipperhalle – Archetyp Flipper-Tisch aus Mario Kart 8 Deluxe (eigene Gestaltung): Start ganz oben auf dem
// schrägen Flippertisch, dann in Kurven hinunter zwischen leuchtenden Bumpern (wer sie trifft, wird weggeschleudert),
// riesige Stahlkugeln rollen quer über die Bahn, unten schlagen die Flipperarme; durch die Abschussbahn mit
// Anti-Gravitation wieder hinauf. Dunkle Halle, Neonlicht. Farben: Nachtblau, Neonpink, Chrom, Gold.

export default {
  id: 'flipperhalle',
  name: 'Flipperhalle',
  short: 'Flipper',
  theme: 'pinball',
  music: 'course_star',
  banner: 'FLIPPERHALLE',
  time: 'night',
  weather: 'sun',
  hw: 8.5,
  margin: 4,
  seed: 1327,
  ctrl: [
    // oben auf dem Tisch
    [-150, 90], [-50, 95], [50, 90], [130, 60],
    // in Kurven hinunter durch das Bumperfeld
    [160, 0], [130, -60], [60, -40], [0, -90], [-60, -50], [-120, -100], [-180, -60],
    // Abschussbahn hinauf
    [-200, 0], [-185, 55],
  ],
  heights: [22, 22, 22, 21, 19, 15, 12, 9, 7, 5, 3, 10, 18],
  antigrav: [[10.6, 12.9, 0]],
  land: { flats: [{ x: -20, z: 0, r: 700, h: 2 }], backdrop: false, noWater: true },
  items: [0.1, 0.36, 0.62, 0.88],
  boosts: [[0.84, -0.3], [0.88, 0.3], [0.92, 0], [0.96, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0.3, -0.3, 5], [0.5, 0.54, 0, 0, 6], [0.7, 0.74, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'bumper', u: 0.4, lat: 0 },
    { kind: 'bumper', u: 0.44, lat: 0.5 },
    { kind: 'bumper', u: 0.44, lat: -0.5 },
    { kind: 'bumper', u: 0.55, lat: 0.3 },
    { kind: 'bumper', u: 0.58, lat: -0.35 },
    { kind: 'bumper', u: 0.68, lat: 0 },
    { kind: 'roller', u: 0.48, style: 'model', model: 'pinball', size: 1.8, speed: 7 },
    { kind: 'roller', u: 0.63, style: 'model', model: 'pinball', size: 1.8, speed: 8 },
    { kind: 'roller', u: 0.75, style: 'model', model: 'pinball', size: 2.0, speed: 6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    // Flipperarme unten, Bumper und Leuchtringe neben der Bahn
    D.model('flipper', { u: u(9.6), side: -1, dist: 6 }, { opts: { side: 1 }, face: 'track', scale: 1.4, always: true });
    D.model('flipper', { u: u(9.6), side: 1, dist: 6 }, { opts: { side: -1 }, face: 'track', scale: 1.4, always: true });
    for (let k = 0; k < 18; k++) D.model('pinball_bumper', { u: k / 18 + 0.02, side: k % 2 ? 1 : -1, dist: 6 + (k % 3) * 5 }, { scale: 1.4 + (k % 2) * 0.6 });
    for (let k = 0; k < 10; k++) D.model('pinball', { u: k / 10 + 0.05, side: k % 2 ? -1 : 1, dist: 14 }, { y: 2.5, scale: 2.5 });
    for (let k = 0; k < 10; k++) D.model('neon_sign', { u: (k + 0.3) / 10, side: k % 2 ? -1 : 1, dist: 5 }, { opts: { text: ['JACKPOT', 'BONUS', '1000', 'EXTRA', 'TILT', 'MULTI', '×2', 'COMBO', 'SUPER', 'HIGHSCORE'][k], color: ['#ff3ab8', '#3ad8ff', '#ffd23a', '#3aff8a'][k % 4] }, face: 'track', scale: 1.2 });
    D.model('room_walls', W(-20, 0), { opts: { size: 520, h: 90, c1: 0x1e1a4a, c2: 0x2a1e5a, band: 0xff3ab8, tile: 24 }, always: true });
    for (const [x, z, h, c] of [[-20, 10, 70, 0x3ad8ff], [80, 20, 60, 0xff3ab8], [-120, 20, 60, 0xffd23a], [0, -170, 80, 0xb06aff]]) D.model('sky_tower', W(x, z), { opts: { h, color: c }, always: true });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
