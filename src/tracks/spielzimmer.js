// Strecke: Spielzimmer – Archetyp Kinderzimmer-Miniaturwelt aus Mario Kart 8 Deluxe (eigene Gestaltung): die Karts
// sind winzig zwischen riesigen Bauklötzen, Teddybären und Buntstiften, die Rampe hinauf auf den Bücherstapel und mit
// dem Gleiter hinunter auf den Teppich; Spielzeugsoldaten marschieren über die Bahn, Bälle rollen.
// Farben: Bauklotz-Rot, -Blau, -Gelb, Holz, Tapetenpastell.

export default {
  id: 'spielzimmer',
  name: 'Spielzimmer',
  short: 'Spielzimmer',
  theme: 'playroom',
  music: 'course_diorama',
  banner: 'SPIELZIMMER',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1543,
  ctrl: [
    [-150, 70], [-60, 80], [20, 70], [90, 80],
    // den Bücherstapel hinauf, Gleitflug
    [150, 40], [160, -30], [110, -80], [40, -60],
    [-10, -100], [-80, -90], [-140, -60], [-190, -20], [-190, 40],
  ],
  heights: [3, 3, 3, 4, 8, 13, 16, 16, 4, 3, 3, 3, 3],
  glides: [{ c: 7.25, w: 12 }],
  flights: [[7.45, 8.1]],
  land: { flats: [{ x: -20, z: 0, r: 700, h: 3 }], backdrop: false, noWater: true },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.18, 0], [0.4, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.25, 0.29, 0.3, -0.3, 5], [0.48, 0.52, 0, 0, 5], [0.74, 0.78, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.14, model: 'toy_soldier', speed: 1.8, scale: 1.4, radius: 0.8 },
    { kind: 'walker', u: 0.16, model: 'toy_soldier', speed: 1.8, scale: 1.4, radius: 0.8 },
    { kind: 'walker', u: 0.8, model: 'toy_soldier', speed: 2, scale: 1.4, radius: 0.8 },
    { kind: 'roller', u: 0.3, style: 'model', model: 'beach_ball', size: 1.8, speed: 5 },
    { kind: 'pillar', u: 0.62, lat: 0.4, model: 'toy_block', r: 2.2, opts: { letter: 'A', color: 0xe8392d } },
    { kind: 'pillar', u: 0.66, lat: -0.4, model: 'toy_block', r: 2.2, opts: { letter: 'B', color: 0x3a8ae8 } },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.model('room_walls', W(-20, 0), { opts: { size: 640, h: 180, c1: 0xfff0d8, c2: 0xffe4e8, band: 0x8acaf0, tile: 30 }, always: true });
    D.model('teddy', W(-40, 150), { yaw: -Math.PI / 2, scale: 1, always: true });
    D.model('teddy', W(230, -160), { yaw: 2.4, scale: 0.8, always: true });
    const cols = [0xe8392d, 0x3a8ae8, 0xffd23a, 0x3aa84a];
    for (let k = 0; k < 26; k++) D.model('toy_block', { u: k / 26 + 0.01, side: k % 2 ? 1 : -1, dist: 6 + (k % 4) * 6 }, { opts: { letter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[k], color: cols[k % 4] }, yaw: k * 0.7, scale: 1 + (k % 3) * 0.5 });
    for (let k = 0; k < 8; k++) D.model('crayon', { u: k / 8 + 0.06, side: k % 2 ? -1 : 1, dist: 14 }, { opts: { color: cols[k % 4] }, yaw: k * 1.3 });
    D.model('book_stack', { x: tr.pointAt(tr.uCtrl(6.5), 0).x, z: tr.pointAt(tr.uCtrl(6.5), 0).z }, { yaw: 0.4, always: true });
    for (let k = 0; k < 8; k++) D.model('beach_ball', { u: k / 8 + 0.02, side: 1, dist: 25 }, { y: 2, scale: 2.5 });
    for (const [uu, side] of [[0.12, -1], [0.5, 1], [0.84, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['toy_soldier', 'bunny_small', 'fairy_spotter']);
  },
};
