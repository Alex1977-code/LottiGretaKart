// Strecke: Gipfelabfahrt – Archetyp Winterberg aus Mario Kart 8 Deluxe (eigene Gestaltung): eine Sektionsstrecke
// ohne Runden – drei Abschnitte in einer langen Spirale vom verschneiten Gipfel ins Tal: Slalomtore mit Turbo,
// Schneehügel als Trick-Buckel, Tannenwald, Hütten. Unten schießt die große Fass-Kanone die Karts zurück auf den
// Gipfel (mit dem Gleiter), wo das Ziel wartet. Tag mit leichtem Schneefall.
// Farben: Schneeweiß, Eisblau, Tannengrün, Holzbraun.

// Spirale um den Berg: vom Gipfel (Radius 50 m, 72 m hoch) in 520° hinunter ins Tal (Radius 230 m, 6 m hoch)
const SPIRAL = 13;
const ctrl = [], heights = [];
for (let k = 0; k <= SPIRAL; k++) {
  const th = (k * 40 * Math.PI) / 180, f = k / 13.5, r = 50 + 180 * f;
  ctrl.push([Math.round(Math.cos(th) * r), Math.round(Math.sin(th) * r)]);
  heights.push(+(72 - 66 * f).toFixed(1));
}
// unten: Kurve zur Kanone, Flug zurück auf den Gipfel (ohne Fahrbahn), Landung kurz vor dem Ziel
ctrl.push([-236, 10], [-212, -42], [-168, -48], [-80, -52], [0, -56], [44, -40]);
heights.push(6, 6, 6, 40, 70, 72);

export default {
  id: 'gipfelabfahrt',
  name: 'Gipfelabfahrt',
  short: 'Abfahrt',
  theme: 'snow',
  music: 'course_star',
  banner: 'GIPFELABFAHRT',
  time: 'day',
  weather: 'snow',
  sections: 3,
  hw: 8,
  margin: 4,
  seed: 996,
  ctrl,
  heights,
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [2, 5], side: -1, h: 20 }],
  tunnels: [{ c: [10.3, 11.2] }],
  bumps: [[3.3, 4.7, 1.2, 15], [8.3, 9.7, 1.4, 17]],
  flights: [[16.15, 18.85]],
  cannons: [{ c0: 16.05, c1: 19, h: 40 }],
  land: {
    hills: [[0, 0, 170, 75], [-330, -200, 140, 60], [320, -220, 150, 70], [300, 240, 140, 55], [-320, 230, 130, 50]],
  },
  items: [0.06, 0.25, 0.45, 0.65],
  boosts: [[0.12, -0.35], [0.14, 0.35], [0.33, 0], [0.52, -0.35], [0.54, 0.35], [0.72, 0]],
  coins: [[0.03, 0.06, -0.4, 0.4, 6], [0.2, 0.24, 0.3, -0.3, 5], [0.38, 0.42, 0, 0, 6], [0.58, 0.62, -0.3, 0.3, 6], [0.76, 0.8, 0, 0, 5]],
  hazards: [
    { kind: 'walker', u: 0.18, model: 'pilzling', speed: 3, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.4, model: 'pilzling', speed: 2.6, scale: 1.5, radius: 0.6 },
    { kind: 'roller', u: 0.3, style: 'snow', size: 1.6, speed: 6 },
    { kind: 'roller', u: 0.6, style: 'snow', size: 1.8, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    // Fass-Kanone unten, Slalomtore über der Fahrbahn
    D.model('barrel_cannon', { u: u(16.05), lat: 0 }, { face: 'along', always: true });
    for (const c of [1.5, 2.3, 6.4, 7.2, 11.3, 12.1]) D.model('slalom_gate', { u: u(c), lat: 0 }, { opts: { width: 2 * (tr.wallAt(Math.round(u(c) * tr.N)) - 0.5) }, face: 'along' });
    // Gipfelhütte am Start, Hütten am Hang, Schneemänner, Tannenwald
    D.model('canary_house', W(-10, 30), { opts: { color: 0x8a5a32, w: 10, d: 8, floors: 1, roof: 'tile' } });
    for (let k = 0; k < 6; k++) D.model('canary_house', { u: 0.1 + k * 0.12, side: k % 2 ? 1 : -1, dist: 10 }, { opts: { color: [0x8a5a32, 0x7a4a2a][k % 2], w: 7, d: 6, floors: 1, roof: 'tile' } });
    D.scatter('pineTree', 160, { u0: 0, u1: 0.85, dist0: 3, dist1: 45, s0: 1.2, s1: 2.2, colors: [0x2f6a3a, 0x3a7a42, 0xe8f0f6], size: 2.4 });
    D.scatter('snowman', 16, { u0: 0, u1: 0.8, dist0: 2, dist1: 20, s0: 1, s1: 1.4, colors: [0xffffff], size: 1.2 });
    D.scatter('rock', 40, { dist0: 3, dist1: 30, s0: 1, s1: 2.4, colors: [0x9aa4b8, 0x8a94a8], size: 2 });
    for (const [uu, side] of [[0.05, 1], [0.35, -1], [0.62, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.985, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
