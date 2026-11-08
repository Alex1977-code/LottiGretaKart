// Strecke: Blumenring – Archetyp Rennstrecke in der Wiese aus Mario Kart 8 Deluxe (eigene Gestaltung): klassische
// Rennstrecke zwischen Blumenwiesen und Hügeln, im Hintergrund das Märchenschloss. Die Strecke ist eine Acht und
// führt über eine Anti-Gravitations-Brücke über sich selbst; auf dem Hügel im Osten die Gleiter-Schanze. Pilzlinge
// laufen über die Fahrbahn. Heller Tag. Farben: Grün, rot-weiße Curbs, Himmelblau, Schlossweiß und Rosa.

export default {
  id: 'blumenring',
  name: 'Blumenring',
  short: 'Blumen',
  theme: 'royal',
  music: 'course_grass',
  banner: 'BLUMENRING',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 952,
  // [x, z, halbe Breite?, Brückenhöhe?] – Acht: bei (0, 0) unten durch, später oben über die Brücke
  ctrl: [
    [-80, -64], [0, 0], [80, 64], [150, 92],
    [196, 64], [212, 0], [196, -64],
    [150, -92, 7.5, 3.5], [80, -64, 7.5, 7], [0, 0, 7.5, 8], [-80, 64, 7.5, 7], [-150, 92, 7.5, 3.5],
    [-196, 64], [-212, 0], [-196, -64], [-150, -92],
  ],
  heights: [
    3, 3, 3.5, 6,
    10, 4, 3,
    3, 3, 3, 3, 3,
    3, 3, 3, 3,
  ],
  antigrav: [[7.3, 11.7, 0]],
  glides: [{ c: 4.05, w: 12 }],
  flights: [[4.25, 4.85]],
  land: {
    flats: [{ x: 0, z: 0, r: 230, h: 3 }],
    hills: [[200, 70, 50, 9], [0, -260, 150, 34], [-280, 160, 120, 28], [300, -150, 120, 30], [260, 220, 110, 24]],
    lakes: [{ x: 214, z: 32, r: 22, depth: 2 }],
  },
  items: [0.1, 0.38, 0.62, 0.86],
  boosts: [[0.04, 0], [0.33, 0.35], [0.58, 0], [0.84, -0.35]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.24, 0.4, -0.4, 5], [0.5, 0.56, 0, 0, 6], [0.72, 0.75, -0.3, 0.3, 4], [0.92, 0.95, 0.3, -0.3, 4]],
  hazards: [
    { kind: 'walker', u: 0.08, model: 'pilzling', speed: 2.6, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.16, model: 'pilzling', speed: 2.2, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.9, model: 'pilzling', speed: 2.8, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.95, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
    { kind: 'spinpost', u: 0.52, lat: 0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Märchenschloss auf dem Hügel im Hintergrund, Zuschauer, Fahnen
    D.model('palace', W(0, -235), { yaw: Math.PI / 2, scale: 1.5, always: true });
    for (const [u, side, len] of [[0.02, 1, 40], [0.08, 1, 34]]) D.model('grandstand', { u, side, dist: 4.5 }, { opts: { length: len, rows: 6 }, face: 'track', always: true });
    for (let k = 0; k < 12; k++) D.model('checkpoint_flag', { u: k / 12 + 0.03, side: k % 2 ? 1 : -1, dist: 1.6 }, { scale: 1.1, face: 'track' });
    for (const [x, z] of [[-120, 0], [120, 0], [0, 120], [0, -120]]) D.model('balloons', W(x, z), { scale: 1.4 });
    // Blumenwiesen, Hecken, runde Bäume
    D.scatter('flower', 260, { dist0: 1, dist1: 40, s0: 1, s1: 1.5, colors: [0xff6aa8, 0xffd21f, 0xffffff, 0xe8392d, 0xb47fe6], size: 0.3 });
    D.scatter('daisy', 120, { dist0: 1, dist1: 30, s0: 1, s1: 1.3, colors: [0xffffff], size: 0.3 });
    D.scatter('roundTree', 70, { dist0: 6, dist1: 45, s0: 1.1, s1: 1.8, colors: [0x4fb833, 0x5cc23c, 0x3fa02a], size: 2.2 });
    D.scatter('bush', 50, { dist0: 2, dist1: 25, s0: 0.7, s1: 1.2, colors: [0x5aae3a, 0x4a9e32], size: 1.2 });
    D.scatter('mushroom', 20, { dist0: 3, dist1: 30, s0: 0.8, s1: 1.4, colors: [0xe8392d, 0xff8a1a], size: 1 });
    for (const [u, side] of [[0.12, -1], [0.4, 1], [0.9, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
