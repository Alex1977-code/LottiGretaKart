// Strecke: Babypark – Archetyp kleines Oval im Freizeitpark aus Mario Kart 8 Deluxe (eigene Gestaltung): ein
// kurzes, breites Oval um das Riesenrad, sieben Runden, viele Itemboxen und viel Gedränge; die beiden Kurven als
// Anti-Gravitations-Steilkurven. Ballons, Karussell, Zuschauer. Heller Tag. Farben: Bonbonrosa, Hellblau, Gelb.

export default {
  id: 'babypark',
  name: 'Babypark',
  short: 'Babypark',
  theme: 'park',
  music: 'course_diorama',
  banner: 'BABYPARK',
  time: 'day',
  weather: 'sun',
  hw: 10,
  margin: 4,
  seed: 1201,
  laps: 7,
  ctrl: [[-100, 0], [-75, -42], [0, -55], [75, -42], [100, 0], [75, 42], [0, 55], [-75, 42]],
  heights: [3, 3.5, 3, 3.5, 3, 3.5, 3, 3.5],
  antigrav: [[0.4, 1.6, 30], [4.4, 5.6, 30]],
  land: {
    flats: [{ x: 0, z: 0, r: 150, h: 3 }],
    hills: [[-260, -150, 120, 26], [260, -140, 120, 30], [40, -280, 150, 36], [-230, 220, 120, 24], [230, 210, 120, 26]],
  },
  items: [0.2, 0.45, 0.7, 0.95],
  boosts: [[0.08, 0], [0.58, 0]],
  coins: [[0.1, 0.16, -0.4, 0.4, 5], [0.6, 0.66, 0.4, -0.4, 5]],
  hazards: [
    { kind: 'spinpost', u: 0.12, lat: 0 },
    { kind: 'spinpost', u: 0.62, lat: 0 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.model('ferris_wheel', W(0, 0), { yaw: 0, scale: 1.2, always: true });
    D.model('carousel', W(-45, 0), { always: true });
    D.model('carousel', W(45, 0), { scale: 0.8, always: true });
    for (const [x, z] of [[-140, 60], [140, 60], [-140, -60], [140, -60], [0, 100], [0, -100]]) D.model('balloons', W(x, z), { scale: 1.8, always: true });
    for (const [u, side, len] of [[0.25, 1, 50], [0.75, 1, 50], [0, 1, 26], [0.5, 1, 26]]) D.model('grandstand', { u, side, dist: 5 }, { opts: { length: len, rows: 7 }, face: 'track', always: true });
    for (let k = 0; k < 16; k++) D.model('checkpoint_flag', { u: k / 16 + 0.02, side: -1, dist: 1.6 }, { scale: 1.1, face: 'track' });
    D.scatter('flower', 120, { side: -1, dist0: 2, dist1: 20, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0x5ab8ff], size: 0.3 });
    D.scatter('roundTree', 50, { side: 1, dist0: 30, dist1: 70, s0: 1.2, s1: 1.8, colors: [0x5cc23c, 0x4fb833], size: 2.2 });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
