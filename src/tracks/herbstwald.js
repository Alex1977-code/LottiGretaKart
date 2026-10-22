// Strecke 2: Herbstwald-Runde – Laubwald in Orange und Gold, Hügel mit Sprungschanze, Haarnadelkurve,
// Krabbelkäfer krabbeln über die Fahrbahn, eine dicke Hummel brummt quer über die Strecke.

export default {
  id: 'herbstwald',
  name: 'Herbstwald-Runde',
  short: 'Herbstwald',
  theme: 'autumn',
  music: 'course_river',
  hw: 7,
  margin: 6,
  seed: 23,
  ctrl: [
    [0, 0], [70, 0], [122, -14, 8], [152, -50], [142, -96], [102, -114, 7.5], [64, -96], [44, -64, 6.5],
    [6, -56, 6.5], [-28, -82], [-70, -112], [-122, -104, 8], [-152, -62], [-142, -16], [-92, 10, 7.5], [-45, 8],
  ],
  hills: [[95, 110, 34, 7], [-100, 150, 40, 6], [140, 40, 28, 3], [-30, 70, 30, 4], [200, 160, 60, 14], [-200, -20, 70, 16], [40, -80, 50, 10]],
  items: [0.08, 0.3, 0.52, 0.74, 0.9],
  boosts: [[0.2, 0], [0.46, 0.4], [0.84, -0.35]],
  ramps: [[0.36, 0, 7], [0.66, 0.25, 5]],
  coins: [[0.03, 0.06, 0.4, -0.4, 5], [0.24, 0.27, 0.5, 0.5, 5], [0.42, 0.44, -0.3, 0.3, 4], [0.58, 0.62, 0, 0, 6], [0.8, 0.82, -0.5, -0.5, 4]],
  hazards: [
    { kind: 'walker', u: 0.16, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 2.8, scale: 1.7, radius: 0.6 },
    { kind: 'walker', u: 0.55, model: 'krabbelkaefer', opts: { color: 'green' }, speed: 2.2, scale: 1.7, radius: 0.6 },
    { kind: 'walker', u: 0.56, model: 'krabbelkaefer', opts: { color: 'pink' }, speed: 3.0, scale: 1.7, radius: 0.6 },
    { kind: 'brummer', u: 0.79, speed: 4.5 },
  ],
  scenery(D) {
    const th = D.theme;
    D.hillsRing(th.hills, th.hills2, 260, 30, 35, 85);
    const autumn = [0xe8702a, 0xf0a020, 0xd84a2a, 0xffc040, 0xc9862e, 0x9cc83a];
    D.scatter('roundTree', 110, { dist0: 3, dist1: 80, s0: 0.9, s1: 1.6, colors: autumn, size: 2.5 });
    D.scatter('pineTree', 50, { dist0: 6, dist1: 90, s0: 1, s1: 1.8, colors: [0x2f7a3a, 0x3a8a40, 0x2a6a34], size: 2.2 });
    D.scatter('bush', 60, { dist0: 1.5, dist1: 30, s0: 0.7, s1: 1.3, colors: [0xd8802a, 0xb8a03a, 0xe0a040], size: 1.2 });
    D.scatter('mushroom', 16, { dist0: 3, dist1: 30, s0: 0.5, s1: 1.2, colors: [0xff8a1a, 0xe8392d, 0xc9702a], size: 2.5 });
    D.scatter('rock', 30, { dist0: 2, dist1: 40, s0: 0.8, s1: 1.8, colors: [0x9a8a8a, 0x8a7e86, 0xa89a90], size: 1.4 });
    D.scatter('flower', 80, { dist0: 0.5, dist1: 20, colors: [0xffc040, 0xff8a1a, 0xffffff], size: 0.3 });
    for (const [u, side] of [[0.12, 1], [0.28, -1], [0.5, 1], [0.7, -1], [0.93, 1]]) {
      D.model('item_tree', { u, side, dist: 4 }, { opts: { size: 6, color: 'autumn' }, state: { shake: 0 }, tick: (e, dt, t) => e.model.update(dt, { shake: 0.15 + 0.15 * Math.sin(t * 1.3 + e.t) }) });
    }
    D.model('lantern', { u: 0.98, side: 1, dist: 1.2 }, { state: 'on', scale: 1.2 });
    D.model('lantern', { u: 0.02, side: -1, dist: 1.2 }, { state: 'on', scale: 1.2 });
    D.crowd(0.96, -1, ['bunny_small', 'fairy_spotter', 'krabbelkaefer', 'bunny_small', 'fairy_spotter', 'bunny_small']);
    D.model('wuehler', { u: 0.4, side: 1, dist: 3 }, { opts: { ground: 'earth' }, state: 'idle', scale: 1.5 });
    D.model('wuehler', { u: 0.62, side: -1, dist: 2.5 }, { opts: { ground: 'earth' }, state: 'idle', scale: 1.5 });
    D.model('checkpoint_flag', { u: 0.5, side: -1, dist: 1.2 }, { state: 'on', scale: 1.3 });
  },
};
