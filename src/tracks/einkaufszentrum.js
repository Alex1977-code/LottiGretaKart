// Strecke: Einkaufszentrum – Archetyp Einkaufszentrum aus Mario Kart 8 Deluxe (eigene Gestaltung): durch die helle
// Ladenpassage unter dem Glasdach, an Schaufenstern, Springbrunnen und Rolltreppen vorbei, die Rampe hinauf in das
// obere Stockwerk (Turbo-Felder wie auf der Rolltreppe) und durch das Parkdeck, wo Autos ein- und ausparken.
// Farben: Marmorweiß, Glasblau, bunte Markisen.

export default {
  id: 'einkaufszentrum',
  name: 'Einkaufszentrum',
  short: 'Shopping',
  theme: 'mall',
  music: 'course_diorama',
  banner: 'EINKAUFSZENTRUM',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1307,
  ctrl: [
    // Ladenpassage
    [-150, 60], [-60, 70], [20, 60], [90, 70],
    // Rampe ins obere Stockwerk
    [150, 40], [160, -20], [120, -70], [50, -80], [0, -40],
    // Parkdeck, zurück in die Passage
    [-50, -80], [-120, -90], [-180, -50], [-195, 10],
  ],
  heights: [3, 3, 3, 3, 6, 10, 11, 11, 10, 6, 4, 3, 3],
  land: { flats: [{ x: -20, z: 0, r: 700, h: 3 }], backdrop: false, noWater: true },
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.3, -0.3], [0.33, 0.3], [0.36, -0.3], [0.7, 0], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.25, 0.29, 0.3, -0.3, 5], [0.5, 0.54, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'traffic', u: 0.74, lane: -3.5, speed: 7, opts: { color: 0x3a7ae8 } },
    { kind: 'traffic', u: 0.82, lane: 3.5, speed: 6, opts: { color: 0xffd23a } },
    { kind: 'walker', u: 0.15, model: 'pilzling', speed: 2, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.5, model: 'fairy_spotter', speed: 2.2, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Halle: Wände mit Pfeilern und goldener Bordüre, darüber das Glasdach (Himmel)
    D.model('room_walls', W(-20, -10), { opts: { size: 470, h: 70, c1: 0xf4efe6, c2: 0xe8e0d2, band: 0xd8a24a, tile: 18 }, always: true });
    const shops = [['SPIELE', 0xe8392d], ['MODE', 0xff4a9a], ['EIS', 0x3ac8e8], ['BÜCHER', 0x3aa84a], ['SCHUHE', 0x8a3ae8], ['MUSIK', 0xffa02a], ['TOYS', 0x3a7ae8], ['CAFÉ', 0xb8702a]];
    for (let k = 0; k < 48; k++) { const [text, color] = shops[k % shops.length]; D.model('shop_front', { u: Math.floor(k / 2) / 24 + 0.01, side: k % 2 ? 1 : -1, dist: 5 }, { opts: { text, color }, face: 'track' }); }
    D.model('fountain', W(-20, 20), { always: true });
    D.model('fountain', W(110, -20), { scale: 0.8 });
    for (const [x, z, yaw] of [[-100, 20, 0], [60, 10, Math.PI], [-130, -40, 0.5]]) D.model('escalator', W(x, z), { yaw, always: true });
    for (let k = 0; k < 14; k++) D.model('city_car', { u: 0.72 + k * 0.012, side: k % 2 ? 1 : -1, dist: 4 }, { opts: { color: [0xe8392d, 0x3a7ae8, 0xfaf8f4, 0x3aa84a][k % 4] }, face: 'track' });
    D.scatter('palm', 30, { dist0: 6, dist1: 40, s0: 0.8, s1: 1.1, colors: [0x3fa02a], size: 1.2 });
    D.scatter('bush', 40, { dist0: 3, dist1: 20, s0: 0.6, s1: 1, colors: [0x4fae34], size: 1 });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
