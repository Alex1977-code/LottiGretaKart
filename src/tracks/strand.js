// Strecke 6: Funkelstrand – Südküste der Blockinsel: Palmen, Sonnenschirme, Dünen-Schanzen und eine Lagune im
// Innenfeld. Rote Krabbelkäfer flitzen als Strandkrabben über die Fahrbahn.

export default {
  id: 'strand',
  name: 'Funkelstrand',
  short: 'Strand',
  theme: 'beach',
  music: 'course_diorama',
  hw: 7.5,
  margin: 6,
  seed: 67,
  ctrl: [
    [0, 0], [60, -4], [118, 0], [160, 16, 8], [184, 48], [176, 84], [146, 104], [108, 100, 7], [84, 80, 6.5],
    [60, 62, 6.5], [30, 66], [0, 88], [-36, 104], [-76, 96, 8], [-100, 64], [-98, 28], [-66, 4], [-30, 0],
  ],
  items: [0.08, 0.32, 0.58, 0.84],
  boosts: [[0.2, 0.35], [0.46, -0.3], [0.72, 0.3], [0.94, -0.35]],
  ramps: [[0.27, 0, 7], [0.64, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.15, 0.18, 0.4, 0.4, 5], [0.4, 0.43, -0.4, -0.4, 4], [0.52, 0.55, 0.3, -0.3, 5], [0.78, 0.8, 0, 0, 5]],
  hazards: [
    { kind: 'walker', u: 0.11, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3.4, scale: 1.8, radius: 0.6 },
    { kind: 'walker', u: 0.36, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 2.6, scale: 1.8, radius: 0.6 },
    { kind: 'walker', u: 0.37, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3.2, scale: 1.8, radius: 0.6 },
    { kind: 'walker', u: 0.88, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3.0, scale: 1.8, radius: 0.6 },
    { kind: 'snapper', u: 0.5, lat: 0.62 },
    { kind: 'snapper', u: 0.7, lat: -0.62 },
  ],
  scenery(D) {
    D.scatter('palm', 60, { dist0: 2, dist1: 50, s0: 0.9, s1: 1.5, colors: [0x4fb833, 0x5cc23c, 0x3fa02a], size: 1.2 });
    D.scatter('umbrella', 26, { dist0: 1.5, dist1: 18, s0: 1, s1: 1.3, colors: [0xe8392d, 0x2fb8c8, 0xffc21a, 0xff6fa8, 0x3b7cf0], size: 1.4 });
    D.scatter('bush', 30, { dist0: 2, dist1: 30, s0: 0.6, s1: 1.1, colors: [0x7ccf5a, 0x9ad65a], size: 1.2 });
    D.scatter('rock', 24, { dist0: 1, dist1: 30, s0: 0.6, s1: 1.4, colors: [0xd8c8a8, 0xc8b898, 0xe8dcc0], size: 1.2 });
    D.scatter('starfish', 50, { dist0: 0.5, dist1: 16, s0: 0.8, s1: 1.4, colors: [0xff8a5a, 0xffc21a, 0xff6fa8], size: 0.4 });
    for (const [u, side] of [[0.12, -1], [0.43, 1], [0.6, -1], [0.9, 1]]) D.model('river_rock', { u, side, dist: 3 }, { opts: { size: 1.6 }, state: 'idle' });
    for (const [u, side] of [[0.24, 1], [0.76, -1]]) D.model('item_tree', { u, side, dist: 5 }, { opts: { size: 5 }, state: { shake: 0 }, tick: (e, dt, t) => e.model.update(dt, { shake: 0.1 + 0.1 * Math.sin(t * 1.5 + e.t) }) });
    for (const [u, side] of [[0.07, 1], [0.33, -1], [0.55, 1], [0.82, -1]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
    D.model('trampoline', { u: 0.47, side: -1, dist: 3 }, { state: 'idle', scale: 1.4 });
    D.crowd(0.97, 1, ['bunny_small', 'fairy_spotter', 'krabbelkaefer', 'bunny_small', 'fairy_spotter', 'pilzling']);
    D.crowd(0.03, -1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
