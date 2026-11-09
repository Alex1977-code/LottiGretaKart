// Strecke: Spukteich – Archetyp Spuk-See aus Mario Kart 8 Deluxe (eigene Gestaltung): in der Abenddämmerung über
// knarrende Holzstege quer über den nebligen Teich, zwischen kahlen Bäumen, Grabsteinen und Irrlichtern; Gespenster
// schweben über die Fahrbahn, in der Ferne die dunkle Villa. Farben: Nebelviolett, Teichgrün, Holzbraun, Irrlicht-Türkis.

export default {
  id: 'spukteich',
  name: 'Spukteich',
  short: 'Spukteich',
  theme: 'boolake',
  music: 'course_boss',
  banner: 'SPUKTEICH',
  time: 'night',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1423,
  ctrl: [
    [-150, 80], [-60, 90], [20, 80], [90, 60],
    [130, 10], [110, -50],
    // Holzstege über den Teich
    [50, -75, 7.5, 3], [-10, -40, 7.5, 3], [-60, -70, 7.5, 3],
    [-110, -95], [-170, -60], [-200, 0], [-185, 50],
  ],
  heights: [3, 3, 3, 3, 3, 2.5, 1.5, 1.5, 1.5, 2.5, 3, 3, 3],
  bridgePillars: true,
  land: {
    lakes: [{ x: -5, z: -55, r: 75, depth: 4 }],
    hills: [[-260, -150, 120, 26], [260, -140, 120, 30], [40, -280, 150, 36], [-230, 220, 120, 22], [230, 210, 120, 24]],
  },
  items: [0.1, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.48, 0], [0.75, 0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.78, 0.82, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.48, model: 'ghost', speed: 1.4, scale: 1.6, radius: 0.8, anim: 'float' },
    { kind: 'walker', u: 0.56, model: 'ghost', speed: 1.2, scale: 1.6, radius: 0.8, anim: 'float' },
    { kind: 'walker', u: 0.2, model: 'ghost', speed: 1.6, scale: 1.5, radius: 0.8, anim: 'float' },
    { kind: 'brummer', u: 0.8, model: 'bat', speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.model('haunted_mansion', W(-30, 160), { yaw: -Math.PI / 2, scale: 1.2, always: true });
    D.model('moon', W(0, -400), { y: 120, scale: 3, always: true });
    for (let k = 0; k < 24; k++) D.model('ghost_lantern', { u: k / 24 + 0.01, side: k % 2 ? 1 : -1, dist: 4 + (k % 3) * 5 }, {});
    for (let k = 0; k < 14; k++) D.model('tombstone', { u: k / 14 + 0.03, side: k % 2 ? -1 : 1, dist: 6 + (k % 3) * 4 }, { face: 'track' });
    for (let k = 0; k < 12; k++) D.model('lantern_post', { u: k / 12 + 0.02, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    D.scatter('reed', 120, { u0: 0.4, u1: 0.7, dist0: 1, dist1: 30, s0: 1, s1: 1.6, colors: [0x3a5a4a, 0x2f4a3e], size: 0.8 });
    for (let k = 0; k < 30; k++) D.model('dead_tree', { u: k / 30 + 0.01, side: k % 2 ? 1 : -1, dist: 10 + (k % 5) * 8 }, { yaw: k * 1.3, scale: 1.2 + (k % 3) * 0.3 });
    D.scatter('rock', 40, { dist0: 3, dist1: 30, s0: 0.8, s1: 2, colors: [0x4a4458, 0x3a3448], size: 2 });
    for (const [uu, side] of [[0.12, 1], [0.44, -1], [0.82, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
