// Strecke: Zuckerschlucht – Archetyp Süßigkeiten-Canyon aus Mario Kart 8 Deluxe (eigene Gestaltung): Start auf der
// Zuckerguss-Hochebene zwischen Torten, Lutschern und Zuckerstangen, hinunter in die Keks-Schlucht, über die
// Waffelbrücke, dann die Anti-Gravitations-Steilwand hinauf zurück auf die Hochebene. Puderzucker neben der
// Fahrbahn bremst, Schnappblumen schnappen am Rand. Warmes Tageslicht. Farben: Rosa, Minze, Vanille, Schokobraun.

export default {
  id: 'zuckerschlucht',
  name: 'Zuckerschlucht',
  short: 'Zucker',
  theme: 'sweets',
  music: 'course_diorama',
  banner: 'ZUCKERSCHLUCHT',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 923,
  // [x, z, halbe Breite?, Brückenhöhe?]
  ctrl: [
    // Hochebene ostwärts
    [-160, 90], [-70, 95], [20, 90], [100, 70],
    // hinunter in die Keks-Schlucht
    [150, 25], [150, -35], [110, -85],
    // Waffelbrücke über den Kakao-Bach
    [40, -110, 7.5, 3.5], [-30, -100],
    // Anti-Gravitations-Steilwand hinauf
    [-90, -70], [-140, -92], [-190, -60], [-205, 0],
    [-190, 50], [-178, 78],
  ],
  heights: [
    12, 12, 12, 11,
    7, 3, 2,
    2, 4,
    8, 10.5, 12, 12.5,
    12, 12,
  ],
  antigrav: [[8.7, 12.3, 38]],
  land: {
    flats: [{ x: -20, z: -10, r: 230, h: 12 }],
    lakes: [{ x: 40, z: -112, r: 14, depth: 1.5 }],
    hills: [[60, -200, 120, 30], [-250, -160, 110, 26], [250, -80, 100, 30], [-60, 230, 130, 22], [200, 190, 110, 24]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.2, 0], [0.33, 0.3], [0.7, -0.3], [0.95, 0]],
  ramps: [{ c: 3.6, w: 6 }],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.27, 0.32, 0, 0, 5], [0.45, 0.5, 0.3, -0.3, 6], [0.66, 0.72, 0.4, 0.4, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'snapper', u: 0.22, lat: 0.7 },
    { kind: 'snapper', u: 0.4, lat: -0.7 },
    { kind: 'snapper', u: 0.88, lat: 0.7 },
    { kind: 'spinpost', u: 0.66, lat: 0.3 },
    { kind: 'spinpost', u: 0.7, lat: -0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Torten auf der Hochebene (Wahrzeichen), Lutscher, Zuckerstangen, Donuts und Gummibärchen-Hügel
    for (const [x, z, s, c] of [[-60, 20, 1.6, 0xffb8d8], [60, 10, 1.3, 0xfff2e0], [-120, -10, 1.1, 0xb8f0d8], [150, 130, 1.4, 0xffd8a0], [-200, 140, 1.2, 0xffb8d8]]) D.model('cake', W(x, z), { opts: { tiers: 3, color: c }, scale: s, always: true });
    D.scatter('lollipop', 50, { dist0: 3, dist1: 40, s0: 1.4, s1: 2.6, colors: [0xff5aa8, 0x5ab8ff, 0xffd21f, 0x8fe060], size: 1.5 });
    D.scatter('candycane', 40, { dist0: 2, dist1: 30, s0: 1.3, s1: 2.2, colors: [0xffffff], size: 1.2 });
    D.scatter('donut', 30, { dist0: 4, dist1: 40, s0: 1, s1: 1.8, colors: [0xff8ac8, 0x8a5a3a, 0xfff0f8], size: 2 });
    D.scatter('gumdrop', 70, { dist0: 1, dist1: 30, s0: 0.8, s1: 1.6, colors: [0xff5a5a, 0xffd21f, 0x5ad86a, 0xb47fe6], size: 1 });
    // Keksfelsen in der Schlucht
    D.scatter('rock', 50, { u0: 0.28, u1: 0.62, dist0: 2, dist1: 25, s0: 1, s1: 2.6, colors: [0xd8a070, 0xc89060, 0xe8b880], size: 2 });
    for (const [u, side] of [[0.08, 1], [0.5, -1], [0.78, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
