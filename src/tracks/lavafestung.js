// Strecke: Lavafestung – Archetyp Vulkanburg aus Mario Kart 8 Deluxe (eigene Gestaltung): durch das Festungstor,
// die Anti-Gravitations-Spirale an den Burgmauern hinauf, oben an der riesigen Drachenstatue vorbei, deren
// Steinfaust auf die Fahrbahn kracht, und über die Lavabrücke ohne Leitplanken (wer in die Lava fährt, wird
// zurückgeholt). Dunkel, nur Lavaglühen und Feuer. Farben: Lavarot-Orange, Basaltschwarz, Steingrau, Gold.

export default {
  id: 'lavafestung',
  name: 'Lavafestung',
  short: 'Festung',
  theme: 'lavafort',
  music: 'course_boss',
  banner: 'LAVAFESTUNG',
  time: 'night',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1029,
  ctrl: [
    [-150, 90], [-60, 95], [30, 90], [110, 70],
    [160, 20], [150, -40], [100, -90], [30, -110],
    [-40, -105], [-100, -80], [-160, -50], [-200, 0], [-195, 55],
  ],
  heights: [3, 3, 3, 3, 6, 10, 13, 14, 12, 6, 4, 3.5, 3],
  antigrav: [[3.6, 7.4, 40]],
  noWalls: [[9.2, 11.6]],
  lavaAt: [[9.4, 1, 14], [9.9, -1, 12], [10.5, 1, 15], [11, -1, 12], [11.5, 1, 11]],
  land: {
    flats: [{ x: 0, z: 0, r: 150, h: 3 }],
    hills: [[-260, -150, 120, 40], [260, -120, 120, 44], [0, -280, 160, 50], [-250, 220, 120, 34], [250, 220, 120, 36]],
  },
  items: [0.1, 0.38, 0.62, 0.86],
  boosts: [[0.18, 0], [0.45, 0.3], [0.7, 0], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.36, 0.4, 0.4, 6], [0.56, 0.6, 0, 0, 5], [0.76, 0.8, 0, 0, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    // die Steinfaust der Drachenstatue kracht auf die Fahrbahn
    { kind: 'stampfstein', u: 0.58, lat: -0.3, scale: 2.2 },
    { kind: 'stampfstein', u: 0.64, lat: 0.3, scale: 2.2 },
    { kind: 'spinpost', u: 0.36, lat: 0.35 },
    { kind: 'brummer', u: 0.2, model: 'bat', speed: 6 },
    { kind: 'brummer', u: 0.8, model: 'bat', speed: 6.5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    D.model('fort_gate', { u: u(1.6), lat: 0 }, { opts: { width: 2 * (tr.wallAt(Math.round(u(1.6) * tr.N)) + 1.5) }, face: 'along', always: true });
    for (const [x, z, h] of [[-60, 30, 26], [40, 30, 22], [120, -60, 30], [60, -40, 24], [-40, -40, 28], [180, 60, 20], [-200, 110, 20]]) D.model('fort_tower', W(x, z), { opts: { h }, always: true });
    D.model('dragon_statue', { u: u(7.4), side: -1, dist: 10 }, { face: 'track', scale: 1.6, always: true });
    D.scatter('rock', 60, { dist0: 2, dist1: 40, s0: 1, s1: 2.6, colors: [0x2e2830, 0x3a3034], size: 2 });
    D.scatter('crystal', 30, { dist0: 3, dist1: 30, s0: 1, s1: 2, colors: [0xff5a1a, 0xffa030], size: 1.2 });
    for (let k = 0; k < 16; k++) D.model('lantern_post', { u: 0.01 + k * 0.06, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    for (const [uu, side] of [[0.08, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'pilzling', 'bunny_small']);
  },
};
