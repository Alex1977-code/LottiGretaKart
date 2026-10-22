// Strecke 4: Kippfeld-Manege – im großen Zirkuszelt: Teppich-Fahrbahn, Sägespäne, Trampolin-Sprünge,
// Panzerkröten tapsen über die Bahn und ein Rammbock-Bulle stürmt quer durch die Manege.

export default {
  id: 'manege',
  name: 'Kippfeld-Manege',
  short: 'Manege',
  theme: 'circus',
  music: 'course_circus',
  hw: 7,
  margin: 5,
  seed: 47,
  enclosed: 0.12,
  terrainPad: 90,
  ctrl: [
    [0, 0], [55, -2], [100, 12], [122, 46, 7.5], [110, 82], [78, 94], [56, 76, 6.5], [46, 50, 6.5], [26, 40],
    [6, 56], [-6, 88], [-38, 104], [-74, 92, 7.5], [-92, 58], [-84, 22], [-46, 2],
  ],
  hills: [],
  items: [0.07, 0.3, 0.55, 0.8],
  boosts: [[0.18, 0.4], [0.42, -0.4], [0.68, 0], [0.92, 0.35]],
  ramps: [[0.25, -0.3, 5], [0.62, 0.3, 5], [0.86, 0, 6]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.34, 0.37, 0.3, 0.3, 4], [0.5, 0.52, -0.4, -0.4, 4], [0.74, 0.77, 0.4, -0.4, 5]],
  hazards: [
    { kind: 'walker', u: 0.12, model: 'panzerkroete', speed: 1.8, scale: 1.25, radius: 0.7 },
    { kind: 'walker', u: 0.46, model: 'panzerkroete', speed: 2.2, scale: 1.25, radius: 0.7 },
    { kind: 'walker', u: 0.71, model: 'rammbock_bulle', speed: 5.5, scale: 1.0, radius: 0.9, anim: 'charge' },
  ],
  tent: true,
  scenery(D) {
    D.tent = true;
    D.scatter('block', 40, { dist0: 1, dist1: 22, s0: 1, s1: 2.4, colors: [0xffc94a, 0xd23440, 0x3b7cf0, 0xfff4e0, 0xb47fe6], size: 1.6 });
    for (const [u, side] of [[0.1, 1], [0.27, -1], [0.4, 1], [0.58, -1], [0.66, 1], [0.83, -1]]) {
      D.model('switch_tile', { u, side, dist: 2 }, { scale: 1.4, tick: (e, dt, t) => e.model.update(dt, Math.sin(t * 0.8 + e.t * 3) > 0 ? 'on' : 'off') });
    }
    for (const [u, side] of [[0.22, 1], [0.5, 1], [0.78, -1]]) D.model('trampoline', { u, side, dist: 3 }, { state: 'idle', scale: 1.6 });
    D.model('pow_block', { u: 0.35, side: -1, dist: 3 }, { state: 'idle', scale: 1.8, y: 1 });
    D.model('warp_box', { u: 0.62, side: -1, dist: 4 }, { opts: { style: 'mystery' }, state: 'idle', scale: 1.4 });
    D.model('cloud_cannon', { u: 0.94, side: -1, dist: 4 }, { state: 'idle', scale: 1.2 });
    D.crowd(0.97, 1, ['fairy_spotter', 'pilzling', 'bunny_small', 'panzerkroete', 'fairy_spotter', 'pilzling', 'bunny_small'], { scale: 1.2 });
    D.crowd(0.5, -1, ['pilzling', 'fairy_spotter', 'bunny_small', 'fairy_spotter', 'pilzling'], { scale: 1.2 });
  },
};
