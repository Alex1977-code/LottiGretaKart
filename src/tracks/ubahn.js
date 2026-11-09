// Strecke: U-Bahn – Archetyp U-Bahn-Tunnel aus Mario Kart 8 Deluxe (eigene Gestaltung): unter der Stadt durch
// gekachelte Tunnel und an Bahnsteigen mit Säulen und Anzeigetafeln vorbei; an den Kreuzungen fahren U-Bahn-Züge quer
// über die Strecke, auf den Gleisen daneben rollen Züge mit. Kühles Neonlicht.
// Farben: Kachelweiß, Linienfarben Rot, Blau, Gelb, Grün.

export default {
  id: 'ubahn',
  name: 'U-Bahn',
  short: 'U-Bahn',
  theme: 'subway',
  music: 'course_boss',
  banner: 'U-BAHN',
  time: 'day',
  weather: 'sun',
  hw: 8.5,
  margin: 4,
  seed: 1709,
  ctrl: [
    [-160, 60], [-70, 75], [20, 70], [100, 60],
    [150, 20], [150, -40], [110, -85],
    [40, -95], [-20, -70], [-80, -95], [-150, -80], [-195, -20],
  ],
  heights: [3, 3, 3, 4, 6, 8, 8, 6, 4, 3, 3, 3],
  land: { flats: [{ x: -20, z: 0, r: 700, h: 3 }], backdrop: false, noWater: true },
  items: [0.1, 0.36, 0.62, 0.86],
  boosts: [[0.2, 0], [0.45, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0, 0, 5], [0.52, 0.56, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'train', u: 0.14, every: 8, cars: 4, speed: 28, span: 110, offset: 0.3, model: 'subway_car', car: 'subway_car', carLength: 14, opts: { color: 0xe8392d } },
    { kind: 'train', u: 0.5, every: 9, cars: 4, speed: 30, span: 110, offset: 0.7, model: 'subway_car', car: 'subway_car', carLength: 14, opts: { color: 0x3a8ae8 } },
    { kind: 'train', u: 0.8, every: 8.5, cars: 3, speed: 28, span: 110, offset: 0.1, model: 'subway_car', car: 'subway_car', carLength: 14, opts: { color: 0x3aa84a } },
    { kind: 'walker', u: 0.3, model: 'fairy_spotter', speed: 2.2, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.ceiling = true;
    D.ceilingY = 22;
    D.model('room_walls', W(-20, -10), { opts: { size: 470, h: 22, c1: 0xf4f6f8, c2: 0xe2e8ee, band: 0xffc21a, tile: 6 }, always: true });
    const lines = [0xe8392d, 0x3a8ae8, 0xffc21a, 0x3aa84a];
    for (let k = 0; k < 8; k++) D.model('subway_station', { u: k / 8 + 0.03, side: k % 2 ? 1 : -1, dist: 3 }, { opts: { color: lines[k % 4], text: ['MARKT', 'HAFEN', 'PARK', 'MUSEUM', 'ZOO', 'RATHAUS', 'BAHNHOF', 'STADION'][k] }, face: 'track', always: true });
    for (let k = 0; k < 28; k++) D.model('tile_pillar', { u: k / 28 + 0.01, side: k % 2 ? 1 : -1, dist: 1.5 }, { opts: { color: lines[k % 4] } });
    for (let k = 0; k < 6; k++) D.model('subway_car', { u: k / 6 + 0.08, side: k % 2 ? 1 : -1, dist: 14 }, { opts: { color: lines[k % 4] }, face: 'along' });
    for (const [uu, side] of [[0.1, 1], [0.42, -1], [0.72, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
