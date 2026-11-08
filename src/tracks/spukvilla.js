// Strecke: Spukvilla – Archetyp Spukvilla aus Mario Kart 8 Deluxe (eigene Gestaltung): bei Nacht durch den
// Friedhofsgarten vor der Villa, hinter dem Haus hinab in den gefluteten Keller (Abschnitt unter Wasser), die Treppe
// hinauf in den Festsaal im Obergeschoss (Anti-Gravitation, Kronleuchter, Tafeln, Gemälde, Spin-Pfosten) und durch
// das große Fenster mit dem Gleiter hinunter in den Garten. Gespenster und Fledermäuse.
// Nacht, Mondlicht, Kerzenschein. Farben: Violett, Dunkelblau, Gold, Kerzengelb.

export default {
  id: 'spukvilla',
  name: 'Spukvilla',
  short: 'Villa',
  theme: 'halloween',
  music: 'course_boss',
  banner: 'SPUKVILLA',
  time: 'night',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 941,
  ctrl: [
    // Friedhofsgarten vor der Villa (ostwärts)
    [-150, 92], [-60, 96], [30, 92], [110, 70],
    // hinter das Haus und hinab in den gefluteten Keller
    [160, 20], [150, -50], [100, -95], [30, -110], [-40, -100],
    // Treppe hinauf in den Festsaal (Obergeschoss, südwärts)
    [-100, -92], [-140, -62], [-145, -18], [-145, 22],
    // Gleiter aus dem Fenster in den Garten
    [-168, 56], [-172, 80],
  ],
  heights: [
    3, 3, 3, 3,
    2, -1.5, -6, -6.5, -2,
    3, 8, 9, 9,
    5, 3,
  ],
  antigrav: [[10.1, 12.3, 0]],
  glides: [{ c: 12.25, w: 12 }],
  flights: [[12.45, 13.55]],
  land: {
    lakes: [{ x: 50, z: -100, r: 72, depth: 9 }],
    flats: [{ x: -20, z: 40, r: 140, h: 3 }],
    hills: [[-260, -140, 110, 34], [250, -120, 110, 30], [40, -260, 150, 40], [-230, 220, 120, 26], [230, 210, 120, 24]],
  },
  items: [0.1, 0.36, 0.6, 0.96],
  boosts: [[0.2, 0], [0.5, 0.3], [0.65, 0], [0.96, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.25, 0.29, 0, 0, 5], [0.42, 0.48, 0, 0, 6], [0.83, 0.88, 0.35, 0.35, 6], [0.92, 0.95, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.15, model: 'ghost', speed: 1.6, scale: 1.4, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.3, model: 'ghost', speed: 1.3, scale: 1.3, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.76, model: 'ghost', speed: 1.8, scale: 1.4, radius: 1.0, anim: 'swim' },
    { kind: 'brummer', u: 0.05, model: 'bat', speed: 6 },
    { kind: 'brummer', u: 0.26, model: 'bat', speed: 5.5 },
    // Spin-Pfosten im Festsaal (Anti-Gravitation)
    { kind: 'spinpost', u: 0.84, lat: 0.4 },
    { kind: 'spinpost', u: 0.875, lat: -0.4 },
    { kind: 'roller', u: 0.06, style: 'model', model: 'pumpkin_ball', size: 1.4, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // die Villa: Festsaal über der Fahrbahn (Obergeschoss), Hauptbau mit Türmen daneben
    const a = tr.pointAt(tr.uCtrl(10.2), 0), b = tr.pointAt(tr.uCtrl(12.2), 0);
    const L = Math.hypot(b.x - a.x, b.z - a.z) + 6;
    const hall = D.model('mansion_hall', { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, { opts: { length: Math.round(L), width: 30 }, yaw: Math.atan2(-(b.z - a.z), b.x - a.x), y: 0, always: true });
    hall.model.root.position.y = Math.min(a.y, b.y) - 0.2;
    D.model('haunted_mansion', W(-60, -30), { yaw: -Math.PI / 2, scale: 1.6, always: true });
    D.model('moon', W(0, -300), { y: 80, scale: 3, always: true });
    // Friedhofsgarten: Grabsteine, Kürbisse, kahle Bäume, Laternen, Zaun
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) D.model('tombstone', W(-80 + c * 14 + (r % 2) * 5, 30 + r * 12), { opts: { kind: (r + c) % 3 }, yaw: -Math.PI / 2 + ((r * 3 + c) % 5 - 2) * 0.08 });
    for (let k = 0; k < 14; k++) D.model('jack_o_lantern', { u: 0.02 + k * 0.022, side: k % 2 ? 1 : -1, dist: 1.4 }, { scale: 1.2 });
    D.scatter('pineTree', 50, { dist0: 8, dist1: 45, s0: 1.2, s1: 2, colors: [0x1e3a2a, 0x24402e], size: 2.4 });
    for (let k = 0; k < 10; k++) D.model('dead_tree', { u: 0.05 + k * 0.09, side: k % 2 ? -1 : 1, dist: 7 + (k % 3) * 4 }, { scale: 1.4 });
    for (let k = 0; k < 12; k++) D.model('lantern_post', { u: 0.01 + k * 0.024, side: -1, dist: 0.8 }, { face: 'track' });
    for (let k = 0; k < 8; k++) D.model('iron_fence', { u: 0.03 + k * 0.03, side: 1, dist: 2.5 }, { face: 'along' });
    D.model('cauldron', W(-110, 40), { scale: 1.4 });
    D.model('scarecrow', W(60, 30), { scale: 1.3 });
    // im Keller: Seegras und Fische, versunkene Fässer
    D.scatter('reed', 50, { u0: 0.36, u1: 0.6, dist0: 1, dist1: 16, s0: 1.2, s1: 2, colors: [0x2f5a4a], size: 0.8 });
    D.model('fish_school', { u: 0.48, side: 1, dist: 5 }, { y: 3, scale: 1.2 });
    for (const [u, side] of [[0.08, 1], [0.32, -1], [0.88, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['ghost', 'fairy_spotter', 'pilzling']);
  },
};
