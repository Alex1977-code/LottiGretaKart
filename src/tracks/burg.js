// Strecke 8: Brummbär-Burg – die Festung des Barons auf der Nordklippe, im Mondlicht. Durch den Burghof mit
// Fackeln, an Schnappblumen und Bombenkanonen vorbei; ein Pilzlingsturm wankt über die Zugbrücke.

export default {
  id: 'burg',
  name: 'Brummbär-Burg',
  short: 'Burg',
  theme: 'castle',
  music: 'course_arena',
  banner: 'BRUMMBÄR-BURG',
  hw: 7,
  margin: 5,
  seed: 83,
  ctrl: [
    [0, 0], [50, 0], [92, 8, 7.5], [112, 36], [102, 66], [70, 74, 6.5], [46, 56], [20, 40], [-6, 50], [-22, 72],
    [-56, 80], [-92, 64, 7.5], [-106, 30], [-98, -6], [-108, -38], [-84, -64], [-50, -62], [-30, -44, 7], [-26, -22],
  ],
  items: [0.1, 0.34, 0.6, 0.85],
  boosts: [[0.2, -0.35], [0.48, 0.3], [0.74, 0]],
  ramps: [[0.3, 0, 6]],
  coins: [[0.04, 0.07, 0, 0, 5], [0.24, 0.27, 0.4, -0.4, 4], [0.42, 0.45, -0.4, -0.4, 5], [0.66, 0.69, 0.4, 0.4, 4], [0.9, 0.93, 0, 0, 5]],
  hazards: [
    { kind: 'cannon', u: 0.15, side: 1, every: 3.8 },
    { kind: 'cannon', u: 0.56, side: -1, every: 4.2 },
    { kind: 'walker', u: 0.38, model: 'pilzlingsturm', speed: 1.6, scale: 1.3, radius: 0.9 },
    { kind: 'walker', u: 0.8, model: 'rammbock_bulle', speed: 5, scale: 1.0, radius: 0.9, anim: 'charge' },
    { kind: 'snapper', u: 0.25, lat: -0.6 },
    { kind: 'snapper', u: 0.66, lat: 0.6 },
    { kind: 'snapper', u: 0.67, lat: -0.6 },
  ],
  scenery(D) {
    D.castle();
    D.scatter('pineTree', 40, { dist0: 6, dist1: 60, s0: 1, s1: 1.7, colors: [0x2a4a3a, 0x324e40, 0x22402e], size: 2 });
    D.scatter('rock', 40, { dist0: 1, dist1: 30, s0: 0.8, s1: 2, colors: [0x6a6478, 0x5a5468, 0x787088], size: 1.4 });
    D.scatter('bush', 30, { dist0: 1, dist1: 20, s0: 0.7, s1: 1.2, colors: [0x3a5a3a, 0x4a3a5a], size: 1.2 });
    // Laternen ohne echte Lichter (die Höhle hat schon welche; jedes Licht kostet überall Leistung)
    [0.02, 0.16, 0.3, 0.44, 0.58, 0.72, 0.86].forEach((u, k) => D.model('lantern', { u, side: k % 2 ? 1 : -1, dist: 0.8 }, { state: 'on', scale: 1.4 }));
    D.model('baron_brummbaer', { u: 0.985, side: 1, dist: 6 }, { state: { anim: 'idle' }, scale: 2.2 });
    D.model('bomb_cannon', { u: 0.02, side: -1, dist: 5 }, { state: 'idle', scale: 1.4 });
    D.model('mega_block', { u: 0.5, side: 1, dist: 4 }, { state: 'idle', scale: 1.2 });
    D.model('claw_wheel', { u: 0.62, side: -1, dist: 5 }, { state: 'idle', scale: 1.2 });
    D.model('chest', { u: 0.9, side: -1, dist: 3 }, { state: 'open', scale: 1.5 });
    D.crowd(0.95, -1, ['kickbombe', 'pilzling', 'krallen_pilzling', 'kickbombe', 'pilzling'], { scale: 1.2 });
  },
};
