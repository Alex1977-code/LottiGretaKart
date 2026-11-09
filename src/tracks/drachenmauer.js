// Strecke: Drachenmauer – Archetyp lange Mauer über die Berge aus Mario Kart 8 Deluxe (eigene Gestaltung): durch das
// Maul des riesigen Drachenkopfs, dann die steilen Rampen hinauf auf den Bergrücken und oben auf der Mauer entlang,
// vorbei an Wachtürmen, über steile Kuppen und wieder hinunter ins Tal; Felsbrocken rollen den Hang herab.
// Klarer Bergtag. Farben: Mauergrau, Drachengrün, Tempelrot, Bergblau.

export default {
  id: 'drachenmauer',
  name: 'Drachenmauer',
  short: 'Mauer',
  theme: 'greatwall',
  music: 'course_boss',
  banner: 'DRACHENMAUER',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1163,
  ctrl: [
    // durch den Drachenkopf ins Tal
    [-170, 70], [-80, 90], [10, 80], [90, 50],
    // steil hinauf auf den Bergrücken
    [140, 0], [130, -60],
    // oben auf der Mauer entlang
    [70, -100], [0, -110], [-70, -95], [-130, -60],
    // hinunter ins Tal
    [-180, -20], [-200, 30],
  ],
  heights: [4, 4, 6, 10, 16, 22, 24, 24, 22, 17, 10, 5],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [9, 11.8], side: 1, h: 16 }],
  tunnels: [{ c: [2.2, 3.0] }],
  bumps: [[6.2, 8.8, 1.2, 30]],
  land: {
    hills: [[0, -130, 150, 22], [-100, -120, 90, 16], [120, -110, 90, 18], [-260, -170, 120, 40], [260, -150, 120, 44], [40, -300, 170, 56], [-230, 220, 120, 28], [230, 210, 120, 30]],
  },
  items: [0.12, 0.36, 0.62, 0.86],
  boosts: [[0.2, 0], [0.32, 0], [0.7, 0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.27, 0.31, 0, 0, 5], [0.52, 0.58, 0, 0, 6], [0.76, 0.8, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'roller', u: 0.4, style: 'rock', size: 1.8, speed: 6 },
    { kind: 'roller', u: 0.55, style: 'rock', size: 2.0, speed: 5 },
    { kind: 'roller', u: 0.82, style: 'rock', size: 1.7, speed: 6 },
    { kind: 'walker', u: 0.65, model: 'panzerkroete', speed: 1.8, scale: 1.4, radius: 0.7 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    const gw = (uu) => 2 * (tr.wallAt(Math.round(uu * tr.N)) + 1.5);
    D.model('dragon_head', { u: 0.04, lat: 0 }, { opts: { width: gw(0.04) }, face: 'along', always: true });
    // Mauer mit Zinnen beiderseits der Fahrbahn auf dem Bergrücken, Wachtürme
    for (let uu = u(5.6); uu < u(9.4); uu += 0.022) for (const side of [1, -1]) D.model('great_wall', { u: uu, side, dist: 1.4 }, { opts: { length: 22 }, face: 'along', y: -5.6 });
    for (const [c, side] of [[5.8, 1], [6.8, -1], [7.8, 1], [8.8, -1], [3.5, 1]]) D.model('wall_tower', { u: u(c), side, dist: 7 }, { face: 'track', always: true });
    // Mauer über die fernen Berge
    for (let k = 0; k < 14; k++) D.model('great_wall', { u: 0.4 + k * 0.012, side: 1, dist: 70 + k * 3 }, { opts: { length: 26 }, face: 'along', y: 6 });
    D.scatter('pineTree', 120, { dist0: 6, dist1: 60, s0: 1.2, s1: 2.2, colors: [0x2f6a3a, 0x3a7a42, 0x2a5e34], size: 2.4 });
    D.scatter('rock', 60, { dist0: 3, dist1: 40, s0: 1, s1: 2.5, colors: [0x9a968e, 0x8a867e], size: 2 });
    D.scatter('roundTree', 50, { u0: 0, u1: 0.25, dist0: 6, dist1: 40, s0: 1.2, s1: 1.8, colors: [0xffb8d8, 0x5cc23c], size: 2.2 });
    for (const [uu, side] of [[0.12, -1], [0.5, 1], [0.84, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
