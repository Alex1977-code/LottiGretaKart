// Strecke: Grachtenstadt – Archetyp Stadt am Wasser mit Grachten aus Mario Kart 8 Deluxe (eigene Gestaltung): durch
// schmale Gassen zwischen hohen Giebelhäusern, zweimal über Bogenbrücken die Gracht hinweg, an Hausbooten,
// Tulpenbeeten und einer Windmühle vorbei; Radfahrer kreuzen die Straße. Heller Frühlingstag.
// Farben: Backsteinrot, Grachtengrün, Tulpenrot und -gelb, Weiß.

export default {
  id: 'grachtenstadt',
  name: 'Grachtenstadt',
  short: 'Grachten',
  theme: 'canal',
  music: 'course_river',
  banner: 'GRACHTENSTADT',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1511,
  ctrl: [
    [-160, 60], [-80, 90], [0, 90], [80, 70],
    // Bogenbrücke über die Gracht
    [130, 28, 8, 3.5], [140, -30], [100, -80], [30, -100],
    // zweite Brücke
    [-30, -66, 8, 3.5], [-80, -100], [-150, -80], [-190, -20],
  ],
  heights: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  land: {
    flats: [{ x: -20, z: 0, r: 260, h: 3 }],
    lakes: [{ x: 132, z: 24, r: 22, depth: 3 }, { x: 95, z: 0, r: 20, depth: 3 }, { x: 60, z: -20, r: 20, depth: 3 }, { x: 25, z: -40, r: 20, depth: 3 }, { x: -10, z: -55, r: 20, depth: 3 }, { x: -32, z: -68, r: 22, depth: 3 }],
    hills: [[-280, -200, 120, 20], [280, -200, 120, 24], [0, -320, 150, 26]],
  },
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.2, 0], [0.45, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0, 0, 5], [0.52, 0.56, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.12, model: 'cyclist', speed: 4, scale: 1.2, radius: 0.9 },
    { kind: 'walker', u: 0.48, model: 'cyclist', opts: { color: 0x3a8ae8 }, speed: 4.5, scale: 1.2, radius: 0.9 },
    { kind: 'walker', u: 0.82, model: 'cyclist', opts: { color: 0xffd23a }, speed: 4, scale: 1.2, radius: 0.9 },
    { kind: 'traffic', u: 0.3, lane: 4, speed: 9, model: 'tram', length: 9 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const cols = [0xb8482a, 0x8a3a2a, 0x3a3a44, 0xe8dcc4, 0x2a5a4a, 0xd8a24a];
    for (let k = 0; k < 120; k++) D.model('canal_house', { u: Math.floor(k / 2) / 60 + 0.005, side: k % 2 ? 1 : -1, dist: 3.5 + (k % 3) * 0.6 }, { opts: { color: cols[k % cols.length], floors: 3 + (k % 3) }, face: 'track' });
    for (const [x, z, yaw] of [[95, -2, 0.6], [60, -22, 0.6], [25, -42, 0.6], [-10, -56, 0.6]]) D.model('houseboat', W(x, z), { yaw, opts: { color: cols[(x / 5 | 0) % 6 + 0] ?? 0x3aa84a } });
    D.model('windmill', W(-240, -120), { yaw: 0.8, scale: 1.4, always: true });
    D.scatter('flower', 260, { dist0: 4, dist1: 50, s0: 1.2, s1: 1.6, colors: [0xe8202a, 0xffd21f, 0xff6aa8, 0xffffff, 0xff8a1a], size: 0.35 });
    for (let k = 0; k < 20; k++) D.model('street_lamp', { u: k / 20 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    for (let k = 0; k < 10; k++) D.model('cafe_set', { u: 0.02 + k * 0.03, side: 1, dist: 2 }, { opts: { color: [0xe8392d, 0x3a7ae8, 0x3aa84a][k % 3] } });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
