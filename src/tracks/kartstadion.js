// Strecke: Kart-Stadion – Archetyp Rennstrecke/Stadion aus Mario Kart 8 Deluxe (eigene Gestaltung): Start-Ziel-
// Gerade im Stadion mit vollen Tribünen, Großbildschirmen, Fahnen und Ballons; weite Rechtskurven hinaus, den Hang
// hinauf in die große gekippte Anti-Gravitations-Steilkurve (blaue Kanten, Spin-Pfosten), über die Trick-Kuppe
// und die blaue Gleiter-Schanze über den Teich zurück ins Stadion, Turbo-Felder in der letzten Kurve.
// Sonniger Tag. Farben: Asphaltgrau, rot-weiße Curbs, Rasengrün, Gelb und Blau.

export default {
  id: 'kartstadion',
  name: 'Kart-Stadion',
  short: 'Stadion',
  theme: 'stadium',
  music: 'course_grass',
  banner: 'KART-STADION',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 901,
  ctrl: [
    // Start-Ziel-Gerade im Stadion (ostwärts)
    [-120, 80], [-40, 82], [40, 80], [110, 70],
    // weite Rechtskurven hinaus aus dem Stadion und den Hang hinauf
    [150, 35], [160, -15], [140, -60], [90, -100],
    // große Anti-Gravitations-Steilkurve (links herum)
    [20, -132], [-50, -150], [-120, -142], [-175, -108], [-198, -58],
    // Trick-Kuppe, Gleiter über den Teich, zurück ins Stadion
    [-200, -12], [-185, 30], [-160, 62],
  ],
  heights: [
    3, 3, 3, 3,
    3.5, 4, 5.5, 8,
    11, 13, 13.5, 12.5, 11,
    12, 3.5, 3,
  ],
  antigrav: [[7.6, 12.4, 42]],
  glides: [{ c: 12.95, w: 12 }],
  flights: [[13.15, 14.25]],
  land: {
    flats: [{ x: -20, z: 75, r: 120, h: 3 }],
    hills: [[-60, -125, 120, 12], [230, -60, 110, 34], [-280, -90, 100, 30], [40, -260, 140, 40], [-170, 200, 120, 22], [190, 190, 120, 26]],
    lakes: [{ x: -194, z: 10, r: 30, depth: 3 }],
  },
  items: [0.16, 0.42, 0.66, 0.97],
  boosts: [[0.07, 0], [0.33, 0.3], [0.9, -0.35], [0.93, 0.35]],
  coins: [[0.02, 0.06, -0.4, 0.4, 6], [0.24, 0.28, 0.3, -0.3, 5], [0.5, 0.56, 0.4, 0.4, 6], [0.6, 0.66, -0.4, -0.4, 6], [0.92, 0.95, 0, 0, 4]],
  hazards: [
    // Spin-Pfosten in der Steilkurve (Anti-Gravitation: Streifen gibt Spin-Boost)
    { kind: 'spinpost', u: 0.52, lat: 0.4 },
    { kind: 'spinpost', u: 0.58, lat: -0.35 },
    { kind: 'spinpost', u: 0.64, lat: 0.3 },
    { kind: 'walker', u: 0.27, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Tribünen rund um das Stadion, Großbildschirme über der Start-Ziel-Geraden
    for (const [u, side, len] of [[0.02, 1, 46], [0.09, 1, 46], [0.16, 1, 40], [0.02, -1, 40], [0.1, -1, 40], [0.97, 1, 34]]) {
      D.model('grandstand', { u, side, dist: 4.5 }, { opts: { length: len, rows: 8 }, face: 'track', always: true });
    }
    D.model('jumbotron', W(-10, 30), { yaw: -Math.PI / 2, always: true });
    D.model('jumbotron', W(170, 95), { yaw: Math.PI * 0.75, opts: { text: 'KART-STADION' }, always: true });
    // Ballons, Fahnen, Flutlicht
    for (const [x, z] of [[-150, 110], [-60, 115], [60, 112], [140, 100], [-90, 40], [80, 35], [175, 10]]) D.model('balloons', W(x, z), { scale: 1.6, always: true });
    for (let k = 0; k < 16; k++) D.model('checkpoint_flag', { u: k / 16 + 0.02, side: k % 2 ? 1 : -1, dist: 1.6 }, { scale: 1.1, face: 'track' });
    for (const [x, z] of [[-190, 120], [190, 120], [190, -10], [-200, 50]]) D.model('street_lamp', W(x, z), { scale: 3.2, always: true });
    // Rasen im Innenfeld: Blumenbeete, Büsche; Wald am Hang hinter der Steilkurve
    D.scatter('flower', 160, { side: -1, dist0: 2, dist1: 30, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0xffffff, 0xe8392d], size: 0.3 });
    D.scatter('bush', 60, { dist0: 2, dist1: 30, s0: 0.7, s1: 1.2, colors: [0x4fae34, 0x5cbf3a], size: 1.2 });
    D.scatter('roundTree', 80, { u0: 0.3, u1: 0.8, dist0: 6, dist1: 45, s0: 1.1, s1: 1.8, colors: [0x4fb833, 0x5cc23c, 0x3fa02a], size: 2.2 });
    D.scatter('pineTree', 50, { u0: 0.35, u1: 0.75, side: 1, dist0: 10, dist1: 50, s0: 1.2, s1: 2, colors: [0x2f7a3a, 0x3a8a42], size: 2.4 });
    for (const [u, side] of [[0.12, -1], [0.45, 1], [0.8, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, -1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter', 'bunny_small']);
    D.crowd(0.05, 1, ['pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
