// Strecke: Retro-Rennbahn – Archetyp klassische Rennbahn der 16-Bit-Zeit aus Mario Kart 8 Deluxe (eigene Gestaltung):
// flach, eckig und ohne Leitplanken – rechtwinklige Kurven, Röhren und Blöcke am Rand, Stampfsteine über der Bahn und
// Pilzlinge auf der Fahrbahn; kräftige, flache Farben wie früher. Farben: Sandgelb, Rasengrün, Grau, Blockbraun.

export default {
  id: 'retrobahn',
  name: 'Retro-Rennbahn',
  short: 'Retro',
  theme: 'retro',
  music: 'course_grass',
  banner: 'RETRO-RENNBAHN',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1613,
  noWalls: true,
  ctrl: [
    [-150, 80], [0, 85], [110, 80], [150, 40], [150, -30], [110, -75], [50, -80],
    [25, -20], [-25, -20], [-50, -80], [-120, -95], [-180, -55], [-190, 30],
  ],
  heights: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  land: { flats: [{ x: -20, z: 0, r: 300, h: 3 }] },
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.06, 0], [0.3, 0], [0.56, 0], [0.8, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.24, 0.28, 0, 0, 5], [0.46, 0.5, 0.4, 0.4, 5], [0.7, 0.74, -0.4, -0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'stampfstein', u: 0.2, lat: 0 },
    { kind: 'stampfstein', u: 0.52, lat: -0.4 },
    { kind: 'stampfstein', u: 0.54, lat: 0.4 },
    { kind: 'walker', u: 0.35, model: 'pilzling', speed: 2.4, scale: 1.6, radius: 0.6 },
    { kind: 'walker', u: 0.75, model: 'panzerkroete', speed: 1.8, scale: 1.5, radius: 0.7 },
  ],
  scenery(D) {
    for (let k = 0; k < 40; k++) D.model(['pipe', 'brick_block', 'question_block', 'used_block'][k % 4], { u: k / 40 + 0.005, side: k % 2 ? 1 : -1, dist: 6 + (k % 3) * 4 }, { opts: { height: 3, radius: 1.4 }, y: k % 4 === 0 ? 0 : 1 + (k % 3), scale: 2 });
    D.scatter('block', 60, { dist0: 10, dist1: 50, s0: 1, s1: 2, colors: [0xc8783a, 0xffc21a, 0x3aa84a], size: 2 });
    D.scatter('bush', 50, { dist0: 4, dist1: 40, s0: 1, s1: 1.6, colors: [0x3aa84a, 0x5cc23c], size: 1.2 });
    D.scatter('roundTree', 40, { dist0: 15, dist1: 60, s0: 1.2, s1: 1.8, colors: [0x3aa84a, 0x2f8a2a], size: 2.2 });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'bunny_small', 'pilzling']);
  },
};
