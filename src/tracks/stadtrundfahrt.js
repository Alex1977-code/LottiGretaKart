// Strecke: Stadtrundfahrt – Archetyp Städtetour aus Mario Kart 8 Deluxe (eigene Gestaltung): eine Rundfahrt durch
// eine sonnige Großstadt an ihren Wahrzeichen vorbei – Uhrturm am Marktplatz, Fernsehturm, Riesenrad im Park, Dom –,
// über die Flussbrücke und durch die Altstadtgassen; Straßenbahnen und Busse fahren mit.
// Farben: Sandstein, Rasengrün, Rot, Himmelblau.

export default {
  id: 'stadtrundfahrt',
  name: 'Stadtrundfahrt',
  short: 'Stadt',
  theme: 'town',
  music: 'course_river',
  banner: 'STADTRUNDFAHRT',
  time: 'day',
  weather: 'sun',
  hw: 9,
  margin: 4.5,
  seed: 1291,
  ctrl: [
    // Prachtstraße am Marktplatz
    [-160, 75], [-70, 95], [20, 92], [100, 70],
    // Flussbrücke
    [150, 25, 9, 4], [160, -35, 9, 4],
    // Park mit Riesenrad, Altstadtgassen
    [120, -90], [50, -110], [-20, -90], [-60, -45], [-120, -60], [-180, -40], [-200, 15],
  ],
  heights: [3, 3, 3, 3, 3, 3, 4, 5, 5, 4, 4, 3, 3],
  land: {
    flats: [{ x: -20, z: 0, r: 260, h: 3 }],
    lakes: [{ x: 155, z: -5, r: 40, depth: 4 }],
    hills: [[-280, -200, 120, 26], [280, -200, 120, 30], [0, -320, 150, 34], [-280, 220, 120, 22], [280, 220, 120, 26]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.06, 0], [0.3, 0.3], [0.66, 0], [0.92, -0.3]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.23, 0.4, -0.4, 5], [0.48, 0.52, 0, 0, 6], [0.7, 0.74, -0.3, 0.3, 6], [0.93, 0.96, 0.3, -0.3, 4]],
  hazards: [
    { kind: 'traffic', u: 0.1, lane: -4.5, speed: 10, model: 'tram', length: 9 },
    { kind: 'traffic', u: 0.4, lane: 4.5, speed: 11, model: 'guagua', length: 9, opts: { color: 0xe8392d } },
    { kind: 'traffic', u: 0.62, lane: -4.5, speed: 12, opts: { taxi: true } },
    { kind: 'traffic', u: 0.85, lane: 4.5, speed: 11, opts: { color: 0x3a7ae8 } },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const th = D.theme;
    D.city(th.city, th.cityWindow, 0, 70);
    D.model('clock_tower', W(-60, 135), { always: true });
    D.model('tv_tower', W(60, 0), { always: true });
    D.model('ferris_wheel', W(70, -165), { yaw: 0.3, scale: 1.2, always: true });
    D.model('canary_church', W(-110, 0), { yaw: 0.6, scale: 1.6, always: true });
    D.model('palace', W(-230, 110), { yaw: 0.8, scale: 0.8, always: true });
    for (let k = 0; k < 10; k++) D.model('canary_house', { u: 0.62 + k * 0.03, side: k % 2 ? 1 : -1, dist: 3 }, { opts: { color: [0xf4d8b8, 0xe8c8a8, 0xfaf0dc, 0xd8b898][k % 4] }, face: 'track' });
    for (let k = 0; k < 8; k++) D.model('cafe_set', { u: 0.01 + k * 0.025, side: 1, dist: 3.5 }, { opts: { color: [0xe8392d, 0x3a7ae8, 0x3aa84a][k % 3] } });
    for (let k = 0; k < 20; k++) D.model('street_lamp', { u: k / 20 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    D.scatter('roundTree', 60, { u0: 0.5, u1: 0.65, dist0: 4, dist1: 40, s0: 1.2, s1: 1.8, colors: [0x4fb833, 0x5cc23c], size: 2.2 });
    D.model('dock', { u: 0.3, side: -1, dist: 6 }, { opts: { length: 14 }, face: 'track' });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
