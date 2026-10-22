// Strecke 7: Glitzergipfel – verschneites Hochplateau im Nordosten: Serpentinen zwischen verschneiten Tannen,
// Eiskristallen und Bohnenranken, die bis in die Wolken wachsen. Riesige Schneebälle rollen quer über die Bahn.

export default {
  id: 'gipfel',
  name: 'Glitzergipfel',
  short: 'Gipfel',
  theme: 'snow',
  music: 'course_star',
  hw: 7,
  margin: 6,
  seed: 71,
  ctrl: [
    [0, 0], [56, 0], [100, -12, 7.5], [122, -44], [112, -80], [78, -96, 7], [48, -80, 6.5], [30, -52, 6.5], [2, -44],
    [-26, -62], [-50, -92], [-88, -100, 7.5], [-118, -74], [-120, -34], [-100, -4], [-104, 30, 7], [-80, 54],
    [-46, 46], [-24, 22, 7],
  ],
  items: [0.1, 0.34, 0.6, 0.84],
  boosts: [[0.22, 0], [0.5, 0.35], [0.76, -0.35]],
  ramps: [[0.44, 0, 7]],
  coins: [[0.04, 0.07, 0.4, -0.4, 5], [0.27, 0.3, -0.4, -0.4, 4], [0.55, 0.58, 0.4, 0.4, 5], [0.68, 0.71, 0, 0, 5], [0.92, 0.95, -0.3, 0.3, 4]],
  hazards: [
    { kind: 'roller', u: 0.16, speed: 6, size: 2.2 },
    { kind: 'roller', u: 0.63, speed: 5, size: 2.6 },
    { kind: 'roller', u: 0.88, speed: 6.5, size: 2 },
    { kind: 'brummer', u: 0.38, speed: 4, model: 'flatterkaefer', opts: { color: 'blue' } },
  ],
  scenery(D) {
    const snowy = [0xe8f0f6, 0xd4e4ee, 0x2f6a4a, 0x3a7a56, 0xdfeaf2];
    D.scatter('pineTree', 120, { dist0: 3, dist1: 70, s0: 0.9, s1: 1.8, colors: snowy, size: 2.2 });
    D.scatter('crystal', 50, { dist0: 1, dist1: 26, s0: 0.8, s1: 2.2, colors: [0x9ad8ff, 0xc8ecff, 0x7ab8f0, 0xe0f4ff], size: 1 });
    D.scatter('snowman', 14, { dist0: 2, dist1: 22, s0: 0.9, s1: 1.3, colors: [0xffffff], size: 1.2 });
    D.scatter('rock', 30, { dist0: 2, dist1: 40, s0: 0.8, s1: 2, colors: [0x9aa4b8, 0x8a94a8, 0xb0b8c8], size: 1.4 });
    for (const [u, side, h] of [[0.08, -1, 14], [0.31, 1, 18], [0.57, -1, 16], [0.8, 1, 20]]) D.model('beanstalk', { u, side, dist: 5 }, { opts: { height: h }, state: 'idle', scale: 1.4 });
    for (const [u, side] of [[0.2, 1], [0.47, -1], [0.72, 1]]) D.model('star_ring', { u, side, dist: 3 }, { state: 'idle', scale: 1.5, y: 3 });
    D.model('cloud_cannon', { u: 0.95, side: -1, dist: 4 }, { state: 'idle', scale: 1.3 });
    D.model('lantern', { u: 0.98, side: 1, dist: 1.2 }, { state: 'on', scale: 1.2 });
    D.crowd(0.96, -1, ['bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small', 'fairy_spotter']);
    D.model('checkpoint_flag', { u: 0.5, side: 1, dist: 1.2 }, { state: 'on', scale: 1.3 });
  },
};
