// Strecke: Rohrkanal – Archetyp Röhren-Kanal aus Mario Kart 8 Deluxe (eigene Gestaltung): zwischen riesigen grünen
// Röhren und Backsteinmauern, hinab in den gefluteten Kanal und unter Wasser durch die Röhrenlandschaft, an
// schnappenden Riesenpflanzen vorbei, und über die Rampe wieder hinauf. Farben: Röhrengrün, Backstein, Kanaltürkis.

export default {
  id: 'rohrkanal',
  name: 'Rohrkanal',
  short: 'Röhren',
  theme: 'sewer',
  music: 'course_river',
  banner: 'ROHRKANAL',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1607,
  ctrl: [
    [-150, 70], [-60, 85], [20, 70], [90, 85],
    // hinab in den Kanal, unter Wasser
    [150, 40], [150, -20], [100, -60], [30, -75], [-30, -100],
    // die Rampe hinauf, zurück
    [-90, -90], [-150, -70], [-195, -10], [-185, 45],
  ],
  heights: [3, 3, 3, 3, 3, 1, -4, -7, -4, 1, 3, 3, 3],
  ramps: [{ c: 9.4, w: 8 }],
  land: {
    lakes: [{ x: 40, z: -75, r: 80, depth: 9 }],
    hills: [[-260, -150, 120, 26], [260, -140, 120, 30], [40, -280, 150, 36], [-230, 220, 120, 22], [230, 210, 120, 24]],
  },
  items: [0.12, 0.36, 0.62, 0.86],
  boosts: [[0.2, 0], [0.45, 0.3], [0.56, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0, 0, 5], [0.5, 0.56, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'snapper', u: 0.18, lat: 0.6 },
    { kind: 'snapper', u: 0.3, lat: -0.6 },
    { kind: 'snapper', u: 0.84, lat: 0.6 },
    { kind: 'walker', u: 0.5, model: 'pufferfish', speed: 1.2, scale: 1.4, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.58, model: 'jellyfish', speed: 1.3, scale: 1.4, radius: 1.0, anim: 'swim' },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    for (let k = 0; k < 30; k++) D.model('pipe', { u: k / 30 + 0.01, side: k % 2 ? 1 : -1, dist: 6 + (k % 4) * 6 }, { opts: { height: 4 + (k % 5) * 3, radius: 2 + (k % 3) }, scale: 1.5 });
    for (let k = 0; k < 12; k++) D.model('brick_block', { u: k / 12 + 0.03, side: k % 2 ? -1 : 1, dist: 4 }, { y: 4 + (k % 3) * 2, scale: 2 });
    const u0 = u(5.5), u1 = u(8.8);
    for (let k = 0; k < 16; k++) D.model(['kelp', 'coral_branch', 'pipe', 'anemone'][k % 4], { u: u0 + (u1 - u0) * (k + 0.5) / 16, side: k % 2 ? 1 : -1, dist: 3 + (k % 3) * 4 }, { opts: { height: 6, radius: 1.5 }, scale: 1.3 });
    for (const t of [0.3, 0.6]) D.model('fish_school', { u: u0 + (u1 - u0) * t, side: 1, dist: 6 }, { y: 3, scale: 1.4 });
    D.model('light_rays', { u: u0 + (u1 - u0) * 0.5, lat: 0 }, { y: -2 });
    D.scatter('bush', 60, { dist0: 3, dist1: 30, s0: 0.8, s1: 1.4, colors: [0x4fae34, 0x5cbf3a], size: 1.2 });
    D.scatter('rock', 40, { dist0: 3, dist1: 30, s0: 0.8, s1: 2, colors: [0xb8583a, 0xa84a32], size: 2 });
    for (const [uu, side] of [[0.12, 1], [0.44, -1], [0.82, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
