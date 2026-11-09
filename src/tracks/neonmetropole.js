// Strecke: Neonmetropole – Archetyp Zukunftsstadt bei Nacht aus Mario Kart 8 Deluxe (eigene Gestaltung): durch die
// Häuserschluchten zwischen Türmen mit Leuchtringen, Schwebeautos fahren mit; die lange Anti-Gravitations-Spirale
// an der Turmwand hinauf, über die Himmelsbrücke und mit dem Gleiter zwischen den Hochhäusern hinunter auf den Platz.
// Nacht. Farben: Cyan, Magenta, Violett, Chrom.

export default {
  id: 'neonmetropole',
  name: 'Neonmetropole',
  short: 'Metropole',
  theme: 'future',
  music: 'course_star',
  banner: 'NEONMETROPOLE',
  time: 'night',
  weather: 'sun',
  hw: 9,
  margin: 4.5,
  seed: 1177,
  ctrl: [
    // Häuserschlucht
    [-160, 70], [-60, 95], [40, 95], [120, 70],
    // Anti-Grav-Spirale an der Turmwand hinauf
    [170, 20], [175, -50], [120, -100],
    // Himmelsbrücke, Gleitflug hinunter
    [40, -115], [-30, -100], [-90, -60], [-150, -70],
    [-200, -20], [-195, 35],
  ],
  heights: [3, 3, 3, 3, 6, 10, 14, 15, 14, 4, 3, 3, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  shortcuts: [{ pts: [[-115, -55], [-151, -11], [-187, 32]], w: 4.5, kind: 'road' }],
  antigrav: [[4.3, 7.8, 35]],
  glides: [{ c: 8.2, w: 13 }],
  flights: [[8.4, 9.05]],
  land: {
    flats: [{ x: 0, z: 0, r: 260, h: 3 }],
    hills: [[-280, -200, 120, 26], [280, -200, 120, 30], [0, -320, 150, 34]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.06, 0], [0.28, 0.35], [0.5, 0], [0.92, -0.35]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.23, 0.4, -0.4, 5], [0.42, 0.46, 0, 0, 6], [0.76, 0.8, -0.3, 0.3, 6], [0.93, 0.96, 0.3, -0.3, 4]],
  hazards: [
    { kind: 'traffic', u: 0.08, lane: -5, speed: 12, model: 'hover_car', opts: { color: 0x3ad8ff } },
    { kind: 'traffic', u: 0.2, lane: 5, speed: 13, model: 'hover_car', opts: { color: 0xff3ab8 } },
    { kind: 'traffic', u: 0.84, lane: -3, speed: 12, model: 'hover_car', opts: { color: 0xb06aff } },
    { kind: 'traffic', u: 0.94, lane: 5, speed: 14, model: 'hover_car', opts: { color: 0x3aff8a } },
    { kind: 'spinpost', u: 0.42, lat: 0.35 },
    { kind: 'spinpost', u: 0.48, lat: -0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const th = D.theme;
    D.city(th.city, th.cityWindow, 0, 70);
    const cols = [0x3ad8ff, 0xff3ab8, 0xb06aff, 0x3aff8a, 0xffd23a];
    for (const [x, z, h, k] of [[-40, 10, 90, 0], [60, -20, 110, 1], [-120, 10, 70, 2], [120, 10, 80, 3], [220, -60, 120, 4], [0, -170, 100, 1], [-220, -110, 90, 0]]) D.model('sky_tower', W(x, z), { opts: { h, color: cols[k] }, always: true });
    for (let k = 0; k < 10; k++) D.model('neon_sign', { u: (k + 0.3) / 10, side: k % 2 ? -1 : 1, dist: 4 }, { opts: { text: ['NEO', 'HYPER', 'ZUKUNFT', 'ROBO', 'PIXEL', 'TURBO', 'MEGA', 'ORBIT', 'LASER', 'NOVA'][k], color: '#' + cols[k % 5].toString(16).padStart(6, '0') }, face: 'track', scale: 1.2 });
    for (let k = 0; k < 20; k++) D.model('street_lamp', { u: k / 20 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    for (let k = 0; k < 6; k++) D.model('hover_car', W(-150 + k * 60, 140 + (k % 2) * 20), { opts: { color: cols[k % 5] }, y: 20 + k * 4, always: true, tick: (e, dt, t) => { e.model.root.position.x = tr.ox - 250 + ((t * 18 + k * 90) % 500); e.model.update(dt, 'idle'); } });
    for (const [uu, side] of [[0.14, 1], [0.6, -1], [0.82, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
