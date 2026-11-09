// Strecke: Eissee – Archetyp Winterstrecke mit zugefrorenem See aus Mario Kart 8 Deluxe (eigene Gestaltung): Start
// am verschneiten Ufer zwischen Iglus und Tannen, durch die blau schimmernde Eishöhle mit Eiszapfen, hinunter auf
// den zugefrorenen See: in Schlangenlinien über das spiegelglatte Eis (das Kart rutscht!), Pinguine watscheln über
// die Bahn, zurück ans Ufer. Leichter Schneefall. Farben: Schneeweiß, Eisblau, Tannengrün, Rot.

export default {
  id: 'eissee',
  name: 'Eissee',
  short: 'Eissee',
  theme: 'frozen',
  music: 'course_star',
  banner: 'EISSEE',
  time: 'day',
  weather: 'snow',
  hw: 8,
  margin: 4,
  seed: 1109,
  ctrl: [
    // verschneites Ufer ostwärts
    [-150, 85], [-60, 95], [30, 88], [110, 60],
    // durch die Eishöhle
    [150, 10], [140, -50], [90, -95],
    // auf den zugefrorenen See, Schlangenlinien
    [20, -110], [-40, -70], [-20, -10], [-80, 20], [-150, 0],
    // zurück ans Ufer
    [-200, 40], [-190, 75],
  ],
  heights: [3, 3, 3, 4, 6, 8, 5, 2, 1.2, 1.2, 1.2, 1.2, 2, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [3, 5.5], side: 1, h: 16 }],
  shortcuts: [{ pts: [[-46, -76], [-94, -42], [-142, -8]], w: 4, kind: 'road' }],
  ice: [[7.3, 11.4]],
  land: {
    flats: [{ x: -60, z: -40, r: 110, h: 1.2 }],
    hills: [[160, -20, 60, 14], [-260, -150, 120, 30], [260, -140, 120, 34], [40, -280, 150, 40], [-230, 220, 120, 26], [230, 210, 120, 28]],
    regions: [0, 1, 2].map(() => ({ theme: 'icesheet', x: -60, z: -40, r: 100, fade: 30 })),
  },
  items: [0.12, 0.36, 0.6, 0.86],
  boosts: [[0.2, 0], [0.42, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.55, 0.6, 0, 0, 6], [0.7, 0.74, -0.3, 0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.58, model: 'penguin', speed: 1.4, scale: 1.6, radius: 0.6 },
    { kind: 'walker', u: 0.66, model: 'penguin', speed: 1.1, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.74, model: 'penguin', speed: 1.7, scale: 1.6, radius: 0.6 },
    { kind: 'roller', u: 0.1, size: 1.8, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    // Eishöhle über der Fahrbahn
    const cw = (c) => 2 * (tr.wallAt(Math.round(u(c) * tr.N)) + 1);
    D.model('ice_arch', { u: u(4.6), lat: 0 }, { opts: { width: cw(4.6), length: 42 }, face: 'along', always: true });
    // Ufer: Iglus, Schneemänner, Tannen; auf dem See Eisschollen und Kristalle
    for (const [x, z, yaw] of [[-120, 130, 1.2], [-40, 135, 2], [60, 125, 2.5], [-230, 80, 0.2]]) D.model('igloo', W(x, z), { yaw, scale: 1.2 });
    D.scatter('snowman', 14, { u0: 0, u1: 0.3, dist0: 4, dist1: 20, s0: 1.2, s1: 1.6, colors: [0xffffff], size: 1 });
    D.scatter('pineTree', 140, { dist0: 4, dist1: 60, s0: 1.2, s1: 2.2, colors: [0x2f6a3a, 0x3a7a42, 0x2a5e34], size: 2.4 });
    D.scatter('crystal', 40, { u0: u(7), u1: u(11.5), dist0: 4, dist1: 30, s0: 1, s1: 2, colors: [0xbfe6fa, 0x9ad4f4], size: 1.2 });
    D.scatter('rock', 30, { dist0: 3, dist1: 30, s0: 0.8, s1: 2, colors: [0xe8eef6, 0xc8d4e2], size: 2 });
    for (let k = 0; k < 8; k++) D.model('penguin', { u: u(7.5) + k * 0.03, side: k % 2 ? 1 : -1, dist: 6 + (k % 3) * 4 }, { yaw: k, scale: 1.4 });
    for (const [uu, side] of [[0.1, 1], [0.48, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['penguin', 'bunny_small', 'fairy_spotter', 'penguin']);
  },
};
