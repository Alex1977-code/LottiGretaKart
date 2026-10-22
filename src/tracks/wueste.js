// Strecke 9: Sonnenschlucht – Wüste im fernen Osten: lange Geraden durch rote Tafelberge, Kakteen, eine Oase.
// Steppenläufer rollen quer über die Bahn, Krabbelkäfer als Skorpione, eine dicke Hummel kreuzt die Schlucht.

export default {
  id: 'wueste',
  name: 'Sonnenschlucht',
  short: 'Wüste',
  theme: 'desert',
  music: 'course_arena',
  banner: 'SONNENSCHLUCHT',
  hw: 8,
  margin: 6,
  seed: 97,
  ctrl: [
    [0, 0], [80, 0], [150, -6, 9], [196, -34], [206, -82], [180, -118, 8], [132, -128], [96, -104, 7.5], [70, -76],
    [36, -70], [8, -96], [-26, -126, 8], [-76, -128], [-114, -100], [-122, -54, 8.5], [-100, -14], [-56, 0],
  ],
  items: [0.08, 0.3, 0.52, 0.76],
  boosts: [[0.04, 0.4], [0.2, -0.35], [0.62, 0], [0.9, 0.35]],
  ramps: [[0.42, 0, 8], [0.84, -0.2, 6]],
  coins: [[0.02, 0.06, -0.5, 0.5, 6], [0.24, 0.27, 0.4, 0.4, 5], [0.48, 0.5, -0.3, 0.3, 4], [0.68, 0.71, 0, 0, 5], [0.93, 0.96, 0.4, -0.4, 5]],
  hazards: [
    { kind: 'roller', u: 0.14, speed: 7, size: 1.4, style: 'tumbleweed' },
    { kind: 'roller', u: 0.58, speed: 6, size: 1.6, style: 'tumbleweed' },
    { kind: 'roller', u: 0.8, speed: 8, size: 1.3, style: 'tumbleweed' },
    { kind: 'walker', u: 0.35, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3.2, scale: 1.8, radius: 0.6 },
    { kind: 'walker', u: 0.36, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 2.6, scale: 1.8, radius: 0.6 },
    { kind: 'brummer', u: 0.7, speed: 5 },
  ],
  scenery(D) {
    D.scatter('mesa', 26, { dist0: 12, dist1: 90, s0: 0.8, s1: 1.8, colors: [0xd9733a, 0xc8602e, 0xe08848, 0xb85a30], size: 9 });
    D.scatter('cactus', 70, { dist0: 2, dist1: 50, s0: 0.8, s1: 1.6, colors: [0x4f9a3a, 0x5aa844, 0x3f8a30], size: 1.2 });
    D.scatter('rock', 40, { dist0: 1, dist1: 40, s0: 0.7, s1: 1.8, colors: [0xd08a50, 0xc07a48, 0xe0a070], size: 1.4 });
    D.scatter('palm', 10, { dist0: 4, dist1: 20, s0: 1, s1: 1.4, colors: [0x4fb833, 0x5cc23c], size: 1.2, u0: 0.44, u1: 0.56 });
    D.scatter('pebble', 60, { dist0: 0.5, dist1: 20, s0: 1, s1: 2, colors: [0xc8905a, 0xb88050], size: 0.4 });
    for (const [u, side] of [[0.18, 1], [0.66, -1]]) D.model('bomb_cannon', { u, side, dist: 6 }, { state: 'idle', scale: 1.2 });
    D.model('trampoline', { u: 0.5, side: 1, dist: 3 }, { state: 'idle', scale: 1.5 });
    for (const [u, side, h] of [[0.1, -1, 3.2], [0.46, 1, 3.6], [0.74, -1, 3.2]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: h, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
    D.crowd(0.97, 1, ['krabbelkaefer', 'fairy_spotter', 'pilzling', 'bunny_small', 'fairy_spotter']);
    D.signs = [[0.3, 'OASE 2 km', 0xd8862e], [0.62, 'VORSICHT STEPPENLÄUFER!', 0xd8262e]];
  },
};
