// Strecke: Tempelstadt – Archetyp Großstadt mit goldenen Tempeln aus Mario Kart 8 Deluxe (eigene Gestaltung): im
// Abendlicht über die breite Hauptstraße zwischen Hochhäusern, an goldenen Tempeln und Pagoden vorbei, über die
// Hochstraße und hinunter zum schwimmenden Markt; bunte Tuk-Tuks fahren mit. Farben: Tempelgold, Rot, Jadegrün.

export default {
  id: 'tempelstadt',
  name: 'Tempelstadt',
  short: 'Tempel',
  theme: 'templecity',
  music: 'course_star',
  banner: 'TEMPELSTADT',
  time: 'dusk',
  weather: 'sun',
  hw: 9,
  margin: 4.5,
  seed: 1523,
  ctrl: [
    [-150, 80], [-50, 95], [40, 80], [110, 90],
    // Hochstraße
    [160, 40, 9, 5], [150, -30, 9, 7], [90, -60, 9, 5],
    // schwimmender Markt
    [30, -110], [-40, -105], [-95, -70], [-150, -85], [-200, -30], [-190, 30],
  ],
  heights: [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  shortcuts: [{ pts: [[-111, -64], [-147, -20], [-183, 24]], w: 4, kind: 'road' }],
  land: {
    flats: [{ x: -20, z: 0, r: 260, h: 3 }],
    lakes: [{ x: -10, z: -150, r: 40, depth: 3 }, { x: -110, z: -125, r: 30, depth: 3 }],
    hills: [[-280, -220, 120, 20], [280, -220, 120, 24], [0, -340, 150, 26]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.06, 0], [0.32, 0.3], [0.66, 0], [0.92, -0.3]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.23, 0.4, -0.4, 5], [0.48, 0.52, 0, 0, 6], [0.7, 0.74, -0.3, 0.3, 6], [0.93, 0.96, 0.3, -0.3, 4]],
  hazards: [
    { kind: 'traffic', u: 0.1, lane: -5, speed: 11, model: 'tuk_tuk', opts: { color: 0x3aa84a } },
    { kind: 'traffic', u: 0.3, lane: 5, speed: 12, model: 'tuk_tuk', opts: { color: 0xe8392d } },
    { kind: 'traffic', u: 0.55, lane: -3, speed: 10, model: 'tuk_tuk', opts: { color: 0x3a8ae8 } },
    { kind: 'traffic', u: 0.8, lane: 4, speed: 12, opts: { taxi: true } },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const th = D.theme;
    D.city(th.city, th.cityWindow, 0, 60);
    for (const [x, z, s] of [[-40, 20, 1.6], [70, 10, 1.2], [-120, 10, 1.1], [200, -100, 1.4], [-240, 120, 1.3]]) D.model('golden_stupa', W(x, z), { scale: s, always: true });
    for (let k = 0; k < 6; k++) D.model('pagoda', { u: k / 6 + 0.05, side: k % 2 ? 1 : -1, dist: 18 }, { scale: 0.8 });
    for (let k = 0; k < 8; k++) D.model('long_boat', W(-10 + Math.cos(k) * 25, -150 + Math.sin(k) * 25), { yaw: k * 0.8, opts: { color: [0xe8392d, 0xffd23a, 0x3aa84a, 0x3a8ae8][k % 4] } });
    for (let k = 0; k < 14; k++) D.model('neon_sign', { u: (k + 0.3) / 14, side: k % 2 ? -1 : 1, dist: 4 }, { opts: { text: ['NUDELN', 'MARKT', 'TEMPEL', 'TEE', 'MASSAGE', 'SEIDE', 'GEWÜRZE'][k % 7], color: ['#ffd23a', '#ff3a8a', '#3ad8ff'][k % 3] }, face: 'track', scale: 1.1 });
    D.scatter('palm', 50, { dist0: 3, dist1: 30, s0: 1, s1: 1.4, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    for (let k = 0; k < 20; k++) D.model('street_lamp', { u: k / 20 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    for (const [uu, side] of [[0.14, 1], [0.48, -1], [0.82, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling']);
  },
};
