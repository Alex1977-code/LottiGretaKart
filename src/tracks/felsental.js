// Strecke: Felsental – Archetyp Felsen-Labyrinth aus Mario Kart 8 Deluxe (eigene Gestaltung): durch ein grünes Tal
// zwischen hohen Felsen, über die Sprungkante hinunter in den breiten Talgrund, wo Felssäulen die Fahrbahn in mehrere
// Wege teilen – jeder wählt seinen eigenen; riesige gepunktete Eier rollen hindurch. Hinauf zum Ausgang des Tals.
// Sonniger Tag. Farben: Felsgrau, Wiesengrün, Erdbraun, Orange.

export default {
  id: 'felsental',
  name: 'Felsental',
  short: 'Felsental',
  theme: 'valley',
  music: 'course_arena',
  banner: 'FELSENTAL',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1137,
  // [x, z, halbe Breite?]: im Talgrund ist die Fahrbahn sehr breit (Felssäulen teilen sie in Wege)
  ctrl: [
    [-150, 80], [-60, 90], [30, 85], [110, 60],
    // hinauf zur Sprungkante
    [150, 10], [140, -50],
    // breiter Talgrund mit Felssäulen
    [90, -100, 13], [20, -122, 14], [-50, -112, 14], [-110, -80, 13],
    // hinauf zum Ausgang
    [-170, -50], [-200, 0], [-190, 50],
  ],
  heights: [3, 3, 4, 6, 10, 13, 6, 4, 4, 5, 6, 5, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [7.5, 11], side: 0, h: 20 }, { c: [2, 4.5], side: 1, h: 24 }],
  tunnels: [{ c: [0.3, 1.0] }],
  ramps: [{ c: 5.25, w: 10 }],
  land: {
    hills: [[0, -10, 80, 14], [-260, -160, 120, 40], [250, -150, 120, 44], [40, -290, 150, 50], [-230, 220, 120, 30], [230, 210, 120, 32]],
  },
  items: [0.1, 0.36, 0.64, 0.88],
  boosts: [[0.2, 0], [0.42, 0], [0.78, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.25, 0.29, 0.3, -0.3, 5], [0.5, 0.53, 0.6, 0.6, 4], [0.5, 0.53, -0.6, -0.6, 4], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    // Felssäulen im Talgrund: teilen die Fahrbahn in Wege
    { kind: 'pillar', u: 0.47, lat: 0 },
    { kind: 'pillar', u: 0.51, lat: 0.45 },
    { kind: 'pillar', u: 0.51, lat: -0.45 },
    { kind: 'pillar', u: 0.56, lat: 0, opts: { h: 15 } },
    { kind: 'pillar', u: 0.6, lat: 0.5 },
    { kind: 'pillar', u: 0.6, lat: -0.4 },
    { kind: 'pillar', u: 0.65, lat: 0.1, opts: { h: 10 } },
    // rollende Riesen-Eier
    { kind: 'roller', u: 0.53, style: 'model', model: 'giant_egg', size: 2.2, speed: 5 },
    { kind: 'roller', u: 0.62, style: 'model', model: 'giant_egg', opts: { color: 0xe8392d }, size: 2.2, speed: 6 },
    { kind: 'walker', u: 0.2, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    // hohe Felsen an den Talwänden, Felsbogen über der Einfahrt in den Talgrund
    for (let k = 0; k < 30; k++) D.model('rock_pillar', { u: k / 30 + 0.01, side: k % 2 ? 1 : -1, dist: 8 + (k % 4) * 6 }, { opts: { h: 14 + (k % 5) * 5 }, scale: 1.2 + (k % 3) * 0.3 });
    D.model('rock_arch', { u: u(6.05), lat: 0 }, { opts: { span: 2 * (tr.wallAt(Math.round(u(6.05) * tr.N)) + 3) }, face: 'along', always: true });
    D.scatter('rock', 60, { dist0: 2, dist1: 40, s0: 1, s1: 3, colors: [0x9a9088, 0x8a8078], size: 2 });
    D.scatter('pineTree', 50, { dist0: 10, dist1: 60, s0: 1.2, s1: 2, colors: [0x2f7a3a, 0x3a8a42], size: 2.4 });
    D.scatter('bush', 50, { dist0: 3, dist1: 30, s0: 0.8, s1: 1.3, colors: [0x5cbf3a, 0x4fae34], size: 1.2 });
    D.scatter('flower', 100, { dist0: 2, dist1: 30, s0: 1, s1: 1.4, colors: [0xffd21f, 0xffffff, 0xff8a3a], size: 0.3 });
    D.model('dino_egg', { u: u(3), side: 1, dist: 10 }, { scale: 2.5 });
    for (const [uu, side] of [[0.12, 1], [0.4, -1], [0.82, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['krabbelkaefer', 'pilzling', 'fairy_spotter']);
  },
};
