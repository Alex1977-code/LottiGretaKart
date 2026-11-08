// Strecke: Disco-Halle – Archetyp Musikclub aus Mario Kart 8 Deluxe (eigene Gestaltung): bei Nacht fast komplett
// in der Anti-Gravitation: Wellenbahn über die Tanzfläche, steile Wandkurven, die Treppe hinauf zur Bühne mit
// Turbo-Feldern und über die Gleiter-Schanze zurück. Boxentürme pumpen im Takt, Scheinwerferkegel schwenken,
// die riesige Discokugel dreht sich. Farben: Neonpink, Cyan, Lila, Goldglitter.

export default {
  id: 'discohalle',
  name: 'Disco-Halle',
  short: 'Disco',
  theme: 'disco',
  music: 'course_star',
  banner: 'DISCO-HALLE',
  time: 'night',
  weather: 'sun',
  night: true,
  hw: 8,
  margin: 4,
  seed: 985,
  ctrl: [
    // Tanzfläche ostwärts
    [-140, 80], [-50, 86], [40, 80],
    // Wandkurve Ost
    [110, 55], [132, 0], [102, -50],
    // Wellenbahn westwärts
    [30, -62], [-40, -56],
    // Wandkurve West, Treppe hinauf zur Bühne, Gleiter
    [-100, -82], [-160, -60], [-182, -5], [-172, 48],
  ],
  heights: [
    3, 3, 3,
    4, 5, 4,
    3, 3,
    4, 6, 11, 8,
  ],
  antigrav: [[0.5, 11.6, 45]],
  bumps: [[5.6, 7.6, 1.4, 15], [0.4, 1.8, 0.8, 12]],
  glides: [{ c: 10.35, w: 13 }],
  flights: [[10.55, 11.2]],
  land: {
    flats: [{ x: -20, z: 10, r: 190, h: 3 }],
    hills: [[-260, -150, 120, 30], [250, -120, 120, 28], [0, 260, 150, 30], [260, 200, 110, 26], [-250, 200, 110, 24]],
  },
  items: [0.1, 0.36, 0.6, 0.84],
  boosts: [[0.2, 0], [0.74, -0.3], [0.77, 0.3], [0.8, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.27, 0.31, 0.4, 0.4, 5], [0.48, 0.56, 0, 0, 7], [0.66, 0.7, -0.4, -0.4, 5], [0.92, 0.95, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.15, lat: 0.35 },
    { kind: 'spinpost', u: 0.33, lat: -0.35 },
    { kind: 'spinpost', u: 0.42, lat: 0.35 },
    { kind: 'spinpost', u: 0.66, lat: -0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Discokugel über der Mitte, Großbildschirme, Boxentürme, Scheinwerfer
    D.model('disco_ball', W(-20, 10), { y: 24, scale: 2.4, always: true });
    D.model('jumbotron', W(-20, 110), { yaw: Math.PI / 2, opts: { text: 'DISCO-HALLE' }, scale: 1.4, always: true });
    D.model('jumbotron', W(-20, -110), { yaw: -Math.PI / 2, opts: { text: 'LOTTI & GRETA' }, scale: 1.4, always: true });
    const cols = [0xff3ab8, 0x3ae0ff, 0xb47fff, 0xffd23a];
    for (let k = 0; k < 14; k++) D.model('speaker_tower', { u: (k + 0.5) / 14, side: k % 2 ? 1 : -1, dist: 3 }, { opts: { color: cols[k % 4] }, face: 'track', always: true });
    for (let k = 0; k < 10; k++) D.model('light_beam', { u: (k + 0.2) / 10, side: k % 2 ? -1 : 1, dist: 8 }, { opts: { color: cols[k % 4] }, always: true });
    D.scatter('crystal', 60, { dist0: 4, dist1: 40, s0: 1, s1: 2.4, colors: [0xff3ab8, 0x3ae0ff, 0xb47fff, 0xffd23a], size: 1.2 });
    for (const [u, side, len] of [[0.03, 1, 40], [0.1, 1, 34], [0.03, -1, 34]]) D.model('grandstand', { u, side, dist: 9 }, { opts: { length: len, rows: 7 }, face: 'track', always: true });
    for (const [u, side] of [[0.08, -1], [0.5, 1], [0.7, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
