// Strecke: Palmenstrand – Archetyp Tropenstrand aus Mario Kart 8 Deluxe (eigene Gestaltung): Start am weißen
// Sandstrand mit Strandhütten, Rettungsturm, Surfbrettern und Sandburgen, Krabben laufen über die Fahrbahn und
// Wasserbälle rollen; die Küstenstraße hinauf auf den Dschungelhügel, mit dem Gleiter von der Klippe hinunter zur
// Lagune und quer durch die Lagune unter Wasser zurück zum Strand. Strahlende Sonne.
// Farben: Türkis, Sandweiß, Palmengrün, Korallenrot.

export default {
  id: 'palmenstrand',
  name: 'Palmenstrand',
  short: 'Strand',
  theme: 'beach',
  music: 'course_river',
  banner: 'PALMENSTRAND',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1077,
  ctrl: [
    // Sandstrand westwärts → ostwärts
    [-150, 90], [-60, 96], [30, 92], [100, 72],
    // Küstenstraße auf den Dschungelhügel
    [150, 30], [160, -30], [130, -80], [70, -110], [0, -120],
    // Gleitflug von der Klippe, dann durch die Lagune unter Wasser
    [-70, -100], [-120, -60], [-170, -10], [-190, 40], [-180, 80],
  ],
  heights: [2, 2, 2, 3, 7, 13, 18, 21, 21, 4, -6, -8, -3, 1.5],
  glides: [{ c: 8.15, w: 13 }],
  flights: [[8.35, 9.1]],
  land: {
    sea: true,
    island: { cx: 0, cz: -30, rx: 240, rz: 140 },
    hills: [[90, -120, 90, 20], [180, -150, 80, 26], [-20, -190, 90, 20]],
    lakes: [{ x: -160, z: -20, r: 72, depth: 11 }],
  },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.18, 0], [0.44, 0.3], [0.56, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.25, 0.29, 0.3, -0.3, 5], [0.48, 0.52, 0, 0, 5], [0.72, 0.78, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.06, model: 'crab', speed: 2.6, scale: 1.6, radius: 0.8 },
    { kind: 'walker', u: 0.14, model: 'crab', opts: { color: 0xff7a2a }, speed: 3, scale: 1.6, radius: 0.8 },
    { kind: 'walker', u: 0.22, model: 'crab', speed: 2.8, scale: 1.6, radius: 0.8 },
    { kind: 'roller', u: 0.1, style: 'model', model: 'beach_ball', size: 1.4, speed: 5 },
    { kind: 'roller', u: 0.9, style: 'model', model: 'beach_ball', size: 1.4, speed: 6 },
    { kind: 'walker', u: 0.76, model: 'jellyfish', speed: 1.3, scale: 1.5, radius: 1.0, anim: 'swim' },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    // Strand: Hütten, Rettungsturm, Surfbretter, Sandburgen, Sonnenschirme
    for (let k = 0; k < 6; k++) D.model('beach_hut', { u: 0.015 + k * 0.035, side: -1, dist: 9 }, { opts: { color: [0x2fb8c8, 0xff8a5a, 0xffd23a, 0xff5aa8][k % 4] }, face: 'track' });
    D.model('lifeguard', { u: 0.08, side: 1, dist: 10 }, { face: 'track', always: true });
    D.model('lifeguard', { u: 0.95, side: 1, dist: 12 }, { face: 'track' });
    for (let k = 0; k < 10; k++) D.model('surfboard', { u: 0.02 + k * 0.022, side: 1, dist: 4 + (k % 3) * 2 }, { opts: { color: [0xff8a3a, 0x2a7ae8, 0xffd23a, 0xff4a9a][k % 4] }, yaw: k * 0.4 });
    for (const [uu, side] of [[0.05, 1], [0.16, 1], [0.97, -1]]) D.model('sand_castle', { u: uu, side, dist: 7 }, { scale: 1.2 });
    D.scatter('umbrella', 36, { u0: 0, u1: 0.25, side: 1, dist0: 4, dist1: 26, s0: 1, s1: 1.3, colors: [0xff4a9a, 0x1e8cff, 0xffd23a, 0xfaf6ee], size: 2 });
    D.scatter('starfish', 40, { u0: 0, u1: 0.25, dist0: 2, dist1: 20, s0: 1, s1: 1.4, colors: [0xff7a5a, 0xffb02a], size: 0.4 });
    // Dschungelhügel: Palmen, Farne, Felsen
    D.scatter('palm', 90, { dist0: 1, dist1: 30, s0: 1.1, s1: 1.7, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    D.scatter('fern', 80, { u0: u(4), u1: u(9), dist0: 1, dist1: 20, s0: 1, s1: 1.6, colors: [0x2f8a3a, 0x3a9a42], size: 0.8 });
    D.scatter('rock', 30, { u0: u(4), u1: u(9), dist0: 3, dist1: 25, s0: 0.8, s1: 2, colors: [0xb8a48a, 0xa89478], size: 2 });
    // Lagune unter Wasser
    const u0 = u(9.4), u1 = u(12.6);
    for (let k = 0; k < 14; k++) D.model(['coral_branch', 'coral_fan', 'giant_clam', 'kelp', 'coral_brain', 'anemone', 'sea_star'][k % 7], { u: u0 + (u1 - u0) * (k + 0.5) / 14, side: k % 2 ? 1 : -1, dist: 3 + (k % 3) * 4 }, { scale: 1.3 });
    for (const t of [0.3, 0.6]) D.model('fish_school', { u: u0 + (u1 - u0) * t, side: 1, dist: 6 }, { y: 3, scale: 1.4 });
    D.model('sea_turtle', { u: u0 + (u1 - u0) * 0.45, side: -1, dist: 8 }, { y: 3, scale: 1.4 });
    D.model('light_rays', { u: u0 + (u1 - u0) * 0.5, lat: 0 }, { y: -2 });
    D.model('pirate_ship', { u: 0.1, side: 1, dist: 70 }, { scale: 1.2, face: 'track', always: true });
    for (const [uu, side] of [[0.12, -1], [0.4, 1], [0.84, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, -1, ['crab', 'bunny_small', 'fairy_spotter', 'pilzling']);
  },
};
