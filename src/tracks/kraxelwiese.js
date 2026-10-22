// Strecke 1: Kraxelwiesen-Ring – sonnige Wiese der Grünen Blockinsel. Breite Kurven, eine Schikane, Riesenpilze,
// Warp-Röhren, Funkel-Blöcke und Pilzlinge, die über die Fahrbahn watscheln.

export default {
  id: 'kraxelwiese',
  name: 'Kraxelwiesen-Ring',
  short: 'Kraxelwiese',
  theme: 'grass',
  music: 'course_grass',
  hw: 7.5,
  margin: 6,
  seed: 11,
  ctrl: [
    [0, 0], [55, 0], [105, 4], [140, 28, 8.5], [146, 68], [122, 98], [86, 102, 7], [62, 86, 6.5], [36, 78, 6.5],
    [12, 92, 7], [-26, 118], [-70, 112], [-100, 78, 8.5], [-104, 36], [-78, 6], [-40, -2],
  ],
  hills: [[40, 140, 40, 6], [-40, 60, 26, 3.5], [170, 130, 50, 10], [-150, -40, 60, 12], [80, -70, 45, 8], [-60, 190, 60, 14]],
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.24, 0.35], [0.5, -0.4], [0.78, 0.3]],
  ramps: [[0.69, 0, 7]],
  coins: [[0.03, 0.08, -0.4, -0.4, 6], [0.29, 0.33, 0.45, -0.45, 6], [0.44, 0.48, 0, 0, 5], [0.72, 0.75, -0.5, 0.5, 5], [0.92, 0.96, 0.4, 0.4, 5]],
  hazards: [
    { kind: 'walker', u: 0.41, model: 'pilzling', speed: 2.4, scale: 1.4 },
    { kind: 'walker', u: 0.55, model: 'pilzling', speed: 2.0, scale: 1.4 },
    { kind: 'walker', u: 0.565, model: 'pilzling', speed: 2.6, scale: 1.4 },
  ],
  scenery(D) {
    const th = D.theme;
    D.hillsRing(th.hills, th.hills2, 260, 30, 30, 75);
    D.scatter('roundTree', 70, { dist0: 4, dist1: 70, s0: 0.9, s1: 1.5, colors: [0x5cbf3a, 0x4fae34, 0x6fd04a, 0x3f9a2a], size: 2.5 });
    D.scatter('bush', 70, { dist0: 1.5, dist1: 30, s0: 0.7, s1: 1.4, colors: [0x5cbf3a, 0x72dd47, 0x4fae34], size: 1.2 });
    D.scatter('flower', 160, { dist0: 0.5, dist1: 25, s0: 0.8, s1: 1.4, colors: [0xff6fa8, 0xffffff, 0xffd21f, 0xb47fe6, 0xff8a2a], size: 0.3 });
    D.scatter('mushroom', 12, { dist0: 6, dist1: 40, s0: 0.8, s1: 1.6, colors: [0xe8392d, 0xff8a1a, 0x3b7cf0], size: 3 });
    D.scatter('block', 22, { dist0: 3, dist1: 30, s0: 1.2, s1: 2.6, colors: [0xffc21a, 0x3b7cf0, 0xe8392d, 0x4fb833, 0xf0609f], size: 1.6 });
    // Warp-Röhren und Funkel-Blöcke
    D.model('pipe', { u: 0.16, side: 1, dist: 3 }, { opts: { height: 2.6, radius: 1.1 }, state: null });
    D.model('pipe', { u: 0.18, side: 1, dist: 6 }, { opts: { height: 4, radius: 1.1, color: 0xe8392d }, state: null });
    D.model('pipe', { u: 0.58, side: -1, dist: 4 }, { opts: { height: 3, radius: 1.2 }, state: null });
    for (const [u, side, h] of [[0.08, 1, 3], [0.3, -1, 4], [0.46, 1, 3.5], [0.9, -1, 3.2]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: h, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
    // Zuschauer an der Start-Ziel-Geraden
    D.crowd(0.97, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter', 'bunny_small', 'krabbelkaefer', 'fairy_spotter']);
    D.crowd(0.04, -1, ['bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small', 'fairy_spotter']);
    D.model('item_tree', { u: 0.25, side: -1, dist: 5 }, { opts: { size: 5 }, state: { shake: 0 } });
    D.model('item_tree', { u: 0.7, side: 1, dist: 6 }, { opts: { size: 5.5 }, state: { shake: 0 } });
    D.model('checkpoint_flag', { u: 0.5, side: 1, dist: 1.2 }, { state: 'on', scale: 1.3 });
    D.model('trampoline', { u: 0.33, side: -1, dist: 3 }, { state: 'idle', scale: 1.4 });
  },
};
