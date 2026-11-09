// Strecke: Weihnachtsberg – Archetyp Weihnachtsdorf am Berg aus Mario Kart 8 Deluxe (eigene Gestaltung): bei Nacht
// und Schneefall durch das Dorf mit Lebkuchenhäusern, Lichterketten und Geschenkbergen, am riesigen geschmückten
// Weihnachtsbaum vorbei den verschneiten Berg hinauf und wieder hinab; Rentiere stapfen über die Bahn.
// Farben: Schneeweiß, Weihnachtsrot, Tannengrün, Lichtergold.

export default {
  id: 'weihnachtsberg',
  name: 'Weihnachtsberg',
  short: 'Weihnacht',
  theme: 'snow',
  music: 'course_star',
  banner: 'WEIHNACHTSBERG',
  time: 'night',
  weather: 'snow',
  hw: 8,
  margin: 4,
  seed: 1447,
  ctrl: [
    // Weihnachtsdorf
    [-160, 70], [-70, 90], [20, 85], [100, 60],
    // den Berg hinauf
    [150, 10], [150, -50], [100, -100], [30, -110],
    // hinab zum Dorf
    [-40, -90], [-100, -60], [-160, -80], [-200, -20],
  ],
  heights: [4, 4, 5, 7, 10, 13, 15, 14, 12, 9, 6, 5],
  land: {
    hills: [[120, -110, 90, 18], [-260, -150, 120, 36], [260, -140, 120, 40], [40, -280, 150, 46], [-230, 220, 120, 28], [230, 210, 120, 30]],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.14, model: 'reindeer', speed: 2, scale: 1.4, radius: 1.0 },
    { kind: 'walker', u: 0.66, model: 'reindeer', speed: 2.2, scale: 1.4, radius: 1.0 },
    { kind: 'roller', u: 0.5, size: 1.8, speed: 5 },
    { kind: 'roller', u: 0.8, size: 1.6, speed: 6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    for (let k = 0; k < 12; k++) D.model('gingerbread', { u: 0.01 + k * 0.022, side: k % 2 ? 1 : -1, dist: 6 + (k % 2) * 3 }, { face: 'track' });
    D.model('xmas_tree', W(-40, 30), { scale: 1.6, always: true });
    D.model('xmas_tree', W(120, -150), { scale: 1.2, always: true });
    for (let k = 0; k < 24; k++) D.model('present', { u: k / 24 + 0.01, side: k % 2 ? -1 : 1, dist: 3 + (k % 3) * 2 }, { opts: { color: [0xe8392d, 0x3aa84a, 0x3a8ae8, 0xffd23a][k % 4] }, yaw: k, scale: 0.6 + (k % 3) * 0.3 });
    for (let k = 0; k < 6; k++) D.model('reindeer', { u: k / 6 + 0.08, side: 1, dist: 18 }, { yaw: k * 1.1, scale: 1.4 });
    for (let k = 0; k < 20; k++) D.model('street_lamp', { u: k / 20 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    D.scatter('pineTree', 180, { dist0: 4, dist1: 60, s0: 1.2, s1: 2.2, colors: [0xe8f0f8, 0x2f6a3a, 0x2a5e34], size: 2.4 });
    D.scatter('snowman', 20, { dist0: 4, dist1: 25, s0: 1.2, s1: 1.6, colors: [0xffffff], size: 1 });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['penguin', 'bunny_small', 'fairy_spotter']);
  },
};
