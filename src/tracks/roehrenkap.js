// Strecke: Röhrenkap – Archetyp Kap mit Unterwasser-Röhre aus Mario Kart 8 Deluxe (eigene Gestaltung): bei Regen über
// die Klippenstraße am Leuchtturm vorbei, die Serpentine hinunter zum Fluss und in einer gläsernen Röhre quer unter
// dem Wasser hindurch – Fische ziehen vorbei –, auf der anderen Seite den Hang hinauf. Farben: Klippengrün, Felsgrau,
// Flussblau, Leuchtturm-Rot.

export default {
  id: 'roehrenkap',
  name: 'Röhrenkap',
  short: 'Kap',
  theme: 'cape',
  music: 'course_river',
  banner: 'RÖHRENKAP',
  time: 'day',
  weather: 'rain',
  hw: 8,
  margin: 4,
  seed: 1723,
  ctrl: [
    [-160, 80], [-70, 95], [20, 90], [100, 70],
    // Klippenstraße, hinunter zum Fluss
    [150, 20], [150, -40], [110, -90],
    // gläserne Röhre unter dem Wasser
    [40, -100], [-30, -80], [-90, -60],
    [-150, -70], [-200, -20], [-195, 40],
  ],
  heights: [3, 4, 6, 9, 12, 8, 2, -6, -8, -4, 2, 4, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [2, 5], side: 1, h: 18 }],
  land: {
    sea: true,
    island: { cx: -20, cz: 0, rx: 320, rz: 230 },
    lakes: [{ x: -20, z: -85, r: 82, depth: 11 }],
    hills: [[120, 20, 80, 14], [-260, -150, 100, 24], [60, -230, 100, 26]],
  },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.2, 0], [0.47, 0], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.55, 0.62, 0, 0, 7], [0.78, 0.82, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.15, model: 'crab', speed: 2.6, scale: 1.6, radius: 0.8 },
    { kind: 'walker', u: 0.35, model: 'panzerkroete', speed: 1.8, scale: 1.5, radius: 0.7 },
    { kind: 'walker', u: 0.82, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    // gläserne Röhre: Segmente entlang der Unterwasser-Fahrbahn
    const u0 = u(6.6), u1 = u(9.4);
    for (let k = 0; k <= 22; k++) { const uu = u0 + ((u1 - u0) * k) / 22; D.model('glass_tube', { u: uu, lat: 0 }, { opts: { width: 2 * (tr.wallAt(Math.round(uu * tr.N)) + 1), length: 8 }, face: 'along', always: true }); }
    for (const t of [0.25, 0.5, 0.75]) D.model('fish_school', { u: u0 + (u1 - u0) * t, side: 1, dist: 12 }, { y: 4, scale: 1.6 });
    D.model('sea_turtle', { u: u0 + (u1 - u0) * 0.4, side: -1, dist: 14 }, { y: 5, scale: 1.5 });
    D.model('manta', { u: u0 + (u1 - u0) * 0.6, side: 1, dist: 16 }, { y: 6, scale: 1.4 });
    for (let k = 0; k < 10; k++) D.model(['kelp', 'coral_branch', 'giant_clam', 'anemone'][k % 4], { u: u0 + ((u1 - u0) * (k + 0.5)) / 10, side: k % 2 ? 1 : -1, dist: 9 }, { scale: 1.4 });
    D.model('lighthouse', { u: u(4), side: 1, dist: 18 }, { always: true });
    D.model('waterfall', { u: u(5.4), side: -1, dist: 28 }, { opts: { h: 26, w: 20 }, face: 'track', always: true });
    D.scatter('pineTree', 80, { dist0: 5, dist1: 50, s0: 1.2, s1: 2, colors: [0x2f6a3a, 0x3a7a42], size: 2.4 });
    D.scatter('rock', 60, { dist0: 3, dist1: 40, s0: 1, s1: 3, colors: [0x8a8a92, 0x7a7a82], size: 2 });
    D.scatter('bush', 50, { dist0: 3, dist1: 30, s0: 0.8, s1: 1.3, colors: [0x4f9a3a, 0x5aaa42], size: 1.2 });
    for (const [uu, side] of [[0.12, 1], [0.44, -1], [0.84, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['crab', 'bunny_small', 'fairy_spotter']);
  },
};
