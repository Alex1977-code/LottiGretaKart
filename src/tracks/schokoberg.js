// Strecke: Schokoberg – Archetyp Schokoladen-Berg aus Mario Kart 8 Deluxe (eigene Gestaltung): die braune
// Bergstraße steil hinauf durch Kakaofelsen, riesige Schokotafeln ragen aus dem Hang, durch den Tunnel im Berg und
// über die Kuppe wieder hinab; Felsbrocken rollen von oben über die Fahrbahn. Warmes Nachmittagslicht.
// Farben: Kakaobraun, Karamell, Goldgelb.

export default {
  id: 'schokoberg',
  name: 'Schokoberg',
  short: 'Schoko',
  theme: 'choco',
  music: 'course_boss',
  banner: 'SCHOKOBERG',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1319,
  ctrl: [
    [-160, 40], [-90, 90], [0, 100], [80, 80],
    // steil hinauf, Tunnel im Berg
    [140, 30], [170, -40], [130, -100],
    // über die Kuppe und hinab
    [60, -90], [0, -120], [-70, -110], [-120, -60], [-175, -30],
  ],
  heights: [4, 6, 9, 12, 15, 18, 16, 13, 10, 8, 6, 4],
  bumps: [[7.2, 8.8, 1.2, 24]],
  land: {
    hills: [[60, -20, 90, 16], [160, -150, 90, 40], [-60, -200, 120, 34], [-260, -150, 120, 36], [260, -40, 120, 40], [40, -300, 160, 50], [-230, 200, 120, 26], [230, 200, 120, 30]],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'roller', u: 0.3, style: 'rock', color: 0x5a3218, size: 2.0, speed: 6 },
    { kind: 'roller', u: 0.62, style: 'rock', color: 0x6a4428, size: 2.2, speed: 5 },
    { kind: 'roller', u: 0.8, style: 'rock', color: 0x5a3218, size: 1.8, speed: 6 },
    { kind: 'walker', u: 0.12, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    const tw = 2 * (tr.wallAt(Math.round(u(5.3) * tr.N)) + 1.2);
    D.model('road_tunnel', { u: u(5.3), lat: 0 }, { opts: { length: 60, width: tw, text: 'KAKAOTUNNEL' }, face: 'along', always: true });
    for (let k = 0; k < 16; k++) D.model('choco_bar', { u: k / 16 + 0.02, side: k % 2 ? 1 : -1, dist: 7 + (k % 3) * 6 }, { yaw: k * 1.4, scale: 1 + (k % 3) * 0.4 });
    D.scatter('rock', 90, { dist0: 2, dist1: 45, s0: 1, s1: 3, colors: [0x5a3218, 0x6a4428, 0x4a2812], size: 2 });
    D.scatter('mesa', 14, { dist0: 25, dist1: 70, s0: 0.8, s1: 1.4, colors: [0x6a4428, 0x5a3218], size: 6 });
    D.scatter('roundTree', 40, { dist0: 8, dist1: 50, s0: 1.2, s1: 1.8, colors: [0xd8a24a, 0xc8883a], size: 2.2 });
    for (const [uu, side] of [[0.14, -1], [0.5, 1], [0.8, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
