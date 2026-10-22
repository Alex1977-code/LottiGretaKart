// Strecke 11: Zuckerwatten-Allee – Bonbonland im Nordwesten: Schokoladen-Fahrbahn mit Zuckerstangen-Banden,
// Lutscher, Donuts und Gummibonbons. Riesige Kaugummikugeln rollen über die Bahn, Pilzlinge naschen am Rand.

export default {
  id: 'bonbon',
  name: 'Zuckerwatten-Allee',
  short: 'Bonbonland',
  theme: 'candy',
  music: 'course_circus',
  banner: 'ZUCKERWATTEN-ALLEE',
  hw: 7.5,
  margin: 5.5,
  seed: 109,
  ctrl: [
    [0, 0], [60, 0], [104, -14, 8], [118, -52], [96, -86, 7], [58, -92], [30, -70, 6.5], [6, -44], [-24, -40],
    [-50, -64], [-60, -100, 7], [-96, -116], [-126, -92], [-124, -50], [-100, -16], [-56, -2],
  ],
  items: [0.1, 0.34, 0.6, 0.84],
  boosts: [[0.18, 0.35], [0.44, -0.35], [0.7, 0], [0.94, 0.3]],
  ramps: [[0.28, 0, 6], [0.78, 0.2, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.22, 0.25, 0.4, 0.4, 4], [0.48, 0.51, -0.4, -0.4, 5], [0.73, 0.76, 0.3, -0.3, 5]],
  hazards: [
    { kind: 'roller', u: 0.15, speed: 6, size: 1.8, style: 'gum', color: 0xff5aa8 },
    { kind: 'roller', u: 0.53, speed: 5, size: 2.1, style: 'gum', color: 0x5ab8ff },
    { kind: 'roller', u: 0.88, speed: 6.5, size: 1.7, style: 'gum', color: 0x8fe060 },
    { kind: 'walker', u: 0.38, model: 'pilzling', speed: 2.4, scale: 1.4 },
    { kind: 'walker', u: 0.65, model: 'pilzling', speed: 2.8, scale: 1.4 },
  ],
  scenery(D) {
    D.scatter('lollipop', 50, { dist0: 2, dist1: 50, s0: 0.9, s1: 1.8, colors: [0xff5aa8, 0x5ab8ff, 0xffd21f, 0x8fe060, 0xb47fe6], size: 1.4 });
    D.scatter('candycane', 40, { dist0: 1.5, dist1: 35, s0: 0.9, s1: 1.6, colors: [0xffffff], size: 0.6 });
    D.scatter('donut', 26, { dist0: 3, dist1: 40, s0: 1, s1: 2.2, colors: [0xff8ac8, 0x8a5a3a, 0xfff0f8, 0xffd27a], size: 2.2 });
    D.scatter('gumdrop', 90, { dist0: 0.5, dist1: 30, s0: 0.7, s1: 1.6, colors: [0xff5a5a, 0xffd21f, 0x5ad86a, 0x5ab8ff, 0xb47fe6, 0xff8ac8], size: 0.7 });
    D.scatter('mushroom', 10, { dist0: 4, dist1: 30, s0: 0.8, s1: 1.4, colors: [0xff8ac8, 0xb47fe6, 0x5ab8ff], size: 3 });
    for (const [u, side] of [[0.12, 1], [0.4, -1], [0.62, 1], [0.86, -1]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
    D.model('pow_block', { u: 0.3, side: -1, dist: 3 }, { state: 'idle', scale: 1.8, y: 1 });
    D.model('cloud_cannon', { u: 0.95, side: 1, dist: 4 }, { state: 'idle', scale: 1.3 });
    D.crowd(0.97, -1, ['bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small', 'fairy_spotter', 'pilzling']);
  },
};
