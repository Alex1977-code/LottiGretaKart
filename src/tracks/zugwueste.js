// Strecke: Zugwüste – Archetyp Wüste mit Eisenbahn aus Mario Kart 8 Deluxe (eigene Gestaltung): durch die rote
// Wüste im Abendlicht zwischen Tafelbergen und Kakteen; zweimal kreuzt die Strecke die Bahnlinie – blinken die
// Warnlichter, donnert gleich ein langer Güterzug über den Übergang. Steppenläufer rollen, Geier kreisen.
// Farben: Wüstenrot, Ocker, Kaktusgrün, Abendorange.

export default {
  id: 'zugwueste',
  name: 'Zugwüste',
  short: 'Zug',
  theme: 'western',
  music: 'course_arena',
  banner: 'ZUGWÜSTE',
  time: 'dusk',
  weather: 'sun',
  hw: 8.5,
  margin: 4,
  seed: 1409,
  ctrl: [
    [-160, 70], [-70, 95], [20, 90], [100, 60],
    [150, 10], [160, -50], [110, -100], [30, -110],
    [-40, -80], [-100, -100], [-160, -70], [-200, -10],
  ],
  heights: [3, 3, 3, 4, 6, 8, 7, 5, 4, 4, 3, 3],
  bumps: [[8.3, 10.2, 1.0, 24]],
  land: {
    hills: [[-20, -10, 80, 6], [-260, -150, 120, 34], [260, -140, 120, 38], [40, -280, 150, 44], [-230, 220, 120, 26], [230, 210, 120, 30]],
  },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.26, 0], [0.47, 0.3], [0.74, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.78, 0.82, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'train', u: 0.18, every: 10, cars: 6, speed: 24, span: 130, offset: 0.4, opts: { color: 0x8a5a32 } },
    { kind: 'train', u: 0.6, every: 11, cars: 5, speed: 26, span: 120, offset: 0.9, opts: { color: 0x3a6ae8 } },
    { kind: 'roller', u: 0.42, style: 'tumbleweed', size: 1.3, speed: 6 },
    { kind: 'roller', u: 0.82, style: 'tumbleweed', size: 1.2, speed: 7 },
  ],
  scenery(D) {
    D.scatter('mesa', 22, { dist0: 20, dist1: 70, s0: 0.8, s1: 1.6, colors: [0xc8584a, 0xb84a3a, 0xd8784a], size: 6 });
    D.scatter('cactus', 90, { dist0: 3, dist1: 45, s0: 1, s1: 1.8, colors: [0x4f9a3a, 0x5aa842], size: 1.5 });
    D.scatter('rock', 60, { dist0: 2, dist1: 35, s0: 0.8, s1: 2.5, colors: [0xc8584a, 0xa8483a], size: 2 });
    D.scatter('tuft', 140, { dist0: 1, dist1: 30, s0: 1, s1: 1.6, colors: [0xc8a048, 0xb89040], size: 0.4 });
    for (let k = 0; k < 6; k++) D.model('skull', { u: k / 6 + 0.05, side: k % 2 ? 1 : -1, dist: 20 }, { yaw: k, scale: 0.35 });
    for (let k = 0; k < 8; k++) D.model('barrel', { u: 0.16 + k * 0.006, side: k % 2 ? 1 : -1, dist: 5 }, { scale: 1.2 });
    for (const [uu, side] of [[0.12, 1], [0.5, -1], [0.84, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['krabbelkaefer', 'pilzling', 'fairy_spotter']);
  },
};
