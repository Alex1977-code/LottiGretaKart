// Strecke: Pilzschlucht – Archetyp Pilz-Schlucht aus Mario Kart 8 Deluxe (eigene Gestaltung): durch eine grüne
// Schlucht mit riesigen federnden Pilzhüten auf der Fahrbahn – wer drüberfährt, wird hoch in die Luft geschleudert –,
// mit dem Gleiter über den Wasserfall-Kessel und durch die Höhle mit leuchtenden Pilzen. Sonniger Tag.
// Farben: Moosgrün, Pilzrot, Felsviolett, Leucht-Cyan.

export default {
  id: 'pilzschlucht',
  name: 'Pilzschlucht',
  short: 'Pilze',
  theme: 'shroom',
  music: 'course_grass',
  banner: 'PILZSCHLUCHT',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1321,
  ctrl: [
    [-150, 80], [-60, 85], [20, 70], [90, 80],
    // hinauf zur Kante, Gleiter über den Kessel
    [150, 40], [150, -20], [100, -60],
    // Pilz-Trampoline, Höhle mit Leuchtpilzen
    [40, -50], [-10, -90], [-70, -110], [-130, -80], [-180, -40], [-195, 20],
  ],
  heights: [3, 3, 5, 7, 9, 12, 5, 6, 9, 6, 4, 3, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [8, 10.5], side: 0, h: 18 }],
  glides: [{ c: 5.05, w: 12 }],
  flights: [[5.25, 5.85]],
  bouncers: [{ c: 2.4, lat: 0, w: 8 }, { c: 7.25, lat: -0.35, w: 7, color: 0xffa02a }, { c: 7.6, lat: 0.35, w: 7 }, { c: 10.4, lat: 0, w: 8, color: 0x3a8ae8 }],
  land: {
    lakes: [{ x: 140, z: -45, r: 34, depth: 5 }],
    hills: [[30, 10, 70, 12], [220, -40, 90, 34], [-260, -150, 120, 30], [260, -160, 120, 36], [40, -280, 150, 40], [-230, 220, 120, 26], [230, 210, 120, 28]],
  },
  items: [0.12, 0.36, 0.62, 0.88],
  boosts: [[0.08, 0], [0.32, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.22, 0.26, 0, 0, 5], [0.55, 0.6, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.16, model: 'pilzling', speed: 2.4, scale: 1.6, radius: 0.6 },
    { kind: 'walker', u: 0.66, model: 'krallen_pilzling', speed: 2.6, scale: 1.6, radius: 0.6 },
    { kind: 'brummer', u: 0.45, speed: 4 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    for (let k = 0; k < 14; k++) D.model('giant_mushroom', { u: k / 14 + 0.02, side: k % 2 ? 1 : -1, dist: 8 + (k % 3) * 7 }, { opts: { color: [0xe8392d, 0xffa02a, 0x3a8ae8][k % 3] }, scale: 1.2 + (k % 3) * 0.4 });
    for (let k = 0; k < 18; k++) D.model('glow_mushroom', { u: u(9.2) + k * 0.012, side: k % 2 ? 1 : -1, dist: 2 + (k % 3) * 3 }, { opts: { color: [0x3ad8ff, 0xb06aff, 0x3aff8a][k % 3] }, scale: 0.8 + (k % 2) * 0.4 });
    D.model('waterfall', { u: u(5.5), side: 1, dist: 30 }, { opts: { h: 24, w: 18 }, face: 'track', always: true });
    D.scatter('rock', 70, { dist0: 3, dist1: 40, s0: 1, s1: 3, colors: [0x7a6a8a, 0x6a5a7a], size: 2 });
    D.scatter('mushroom', 80, { dist0: 1, dist1: 30, s0: 0.8, s1: 1.6, colors: [0xe8392d, 0xffa02a, 0x3a8ae8], size: 2 });
    D.scatter('fern', 80, { dist0: 1, dist1: 30, s0: 1, s1: 1.6, colors: [0x2f8a3a, 0x3a9a42], size: 0.8 });
    D.scatter('pineTree', 40, { dist0: 12, dist1: 55, s0: 1.2, s1: 2, colors: [0x2f7a3a, 0x3a8a42], size: 2.4 });
    for (const [uu, side] of [[0.12, 1], [0.48, -1], [0.84, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'pilzling']);
  },
};
