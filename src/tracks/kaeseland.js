// Strecke: Käseland – Archetyp Käse-Welt aus Mario Kart 8 Deluxe (eigene Gestaltung): über hügeligen Käse mit
// Löchern und Buckeln, zwischen riesigen Käseecken und -laiben, Mäuse flitzen über die Bahn, Käselaibe rollen;
// in den Löchern neben der Fahrbahn bleibt man stecken. Warmer Nachmittag. Farben: Käsegelb, Orange, Himmelblau.

export default {
  id: 'kaeseland',
  name: 'Käseland',
  short: 'Käseland',
  theme: 'cheese',
  music: 'course_arena',
  banner: 'KÄSELAND',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1213,
  ctrl: [
    [-150, 85], [-60, 92], [30, 85], [110, 60],
    [160, 10], [150, -50], [100, -95],
    [30, -110], [-30, -80], [-70, -30], [-120, -50], [-180, -40], [-205, 15], [-190, 60],
  ],
  heights: [3, 3, 4, 6, 9, 11, 9, 6, 5, 6, 7, 6, 4, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  shortcuts: [{ pts: [[-94, -29], [-146, -3], [-197, 24]], w: 4, kind: 'road' }],
  bumps: [[0.8, 3.2, 1.3, 16], [6.4, 9.6, 1.6, 22], [10.2, 12.4, 1.2, 14]],
  mud: [[-20, 70, 6, 'sand'], [70, 100, 5, 'sand'], [172, -20, 6, 'sand'], [60, -120, 6, 'sand'], [-33, -42, 5, 'sand'], [-150, -70, 6, 'sand'], [-210, 40, 5, 'sand']],
  land: {
    hills: [[-20, -10, 90, 10], [-260, -150, 120, 26], [260, -140, 120, 30], [40, -280, 150, 34], [-230, 220, 120, 24], [230, 210, 120, 26]],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.22, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.1, model: 'mouse', speed: 4, scale: 2.4, radius: 0.6 },
    { kind: 'walker', u: 0.3, model: 'mouse', speed: 4.5, scale: 2.4, radius: 0.6 },
    { kind: 'walker', u: 0.55, model: 'mouse', speed: 4, scale: 2.4, radius: 0.6 },
    { kind: 'roller', u: 0.45, style: 'model', model: 'cheese_wheel', size: 1.6, speed: 5 },
    { kind: 'roller', u: 0.8, style: 'model', model: 'cheese_wheel', size: 1.6, speed: 6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    for (let k = 0; k < 22; k++) D.model('cheese_wedge', { u: k / 22 + 0.01, side: k % 2 ? 1 : -1, dist: 8 + (k % 4) * 8 }, { yaw: k * 1.3, scale: 1 + (k % 3) * 0.5 });
    for (const [x, z, s] of [[0, 0, 3], [-100, 20, 2.2], [80, -30, 2.5], [-260, 80, 3], [240, 60, 3.2]]) D.model('cheese_wedge', W(x, z), { yaw: x, scale: s, always: true });
    for (let k = 0; k < 10; k++) D.model('cheese_wheel', { u: k / 10 + 0.05, side: k % 2 ? -1 : 1, dist: 5 }, { y: 1.6, scale: 1.6 });
    D.scatter('flower', 80, { dist0: 2, dist1: 30, s0: 1, s1: 1.4, colors: [0xffffff, 0xff8a3a, 0xffd21f], size: 0.3 });
    D.scatter('bush', 40, { dist0: 4, dist1: 30, s0: 0.8, s1: 1.3, colors: [0x8ab83a, 0x9ac84a], size: 1.2 });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['mouse', 'bunny_small', 'fairy_spotter', 'mouse']);
  },
};
