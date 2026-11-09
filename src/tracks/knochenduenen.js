// Strecke: Knochendünen – Archetyp Wüste mit Riesenskeletten aus Mario Kart 8 Deluxe (eigene Gestaltung): über hohe
// Sanddünen (Buckel), durch die Rippenbögen eines riesigen Skeletts, an Schädeln vorbei, hinab durch die türkise
// Oase (unter Wasser) und am Treibsand entlang, der bremst. Warmes, tiefstehendes Wüstenlicht, Sand in der Luft.
// Farben: Ocker, Knochenweiß, Terrakotta, Türkis.

export default {
  id: 'knochenduenen',
  name: 'Knochendünen',
  short: 'Dünen',
  theme: 'dunes',
  music: 'course_arena',
  banner: 'KNOCHENDÜNEN',
  time: 'dusk',
  weather: 'calima',
  hw: 8,
  margin: 4,
  seed: 1018,
  ctrl: [
    [-150, 90], [-60, 95], [30, 90], [110, 70],
    [160, 20], [150, -40], [100, -90],
    [30, -110], [-40, -105],
    [-100, -80], [-160, -60], [-200, -5], [-195, 55],
  ],
  heights: [3, 3, 3, 3, 5, 8, 5, -1, -6, 2, 4, 4, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [6, 9], side: 1, h: 14 }, { c: [6.5, 8.5], side: -1, h: 10 }],
  bumps: [[0.6, 2.8, 2.2, 26], [4.2, 5.8, 1.6, 20]],
  mud: [[-175, -38, 8, 'sand'], [-198, 20, 7, 'sand'], [-130, -60, 6, 'sand'], [60, 98, 7, 'sand']],
  land: {
    lakes: [{ x: -5, z: -110, r: 46, depth: 9 }],
    hills: [[0, 20, 90, 6], [-260, -140, 120, 28], [260, -100, 120, 26], [40, -260, 150, 30], [-230, 220, 120, 22], [230, 210, 120, 24]],
  },
  items: [0.1, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.48, 0.3], [0.72, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0, 0, 5], [0.55, 0.6, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.15, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3, scale: 1.6, radius: 0.6 },
    { kind: 'walker', u: 0.33, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3.4, scale: 1.6, radius: 0.6 },
    { kind: 'roller', u: 0.75, style: 'tumbleweed', size: 1.3, speed: 6 },
    { kind: 'roller', u: 0.9, style: 'tumbleweed', size: 1.2, speed: 7 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    // Rippenbögen über der Fahrbahn, Schädel und Riesenknochen im Sand
    for (const c of [10.3, 10.6, 10.9]) D.model('ribcage', { u: u(c), lat: 0 }, { opts: { width: 2 * (tr.wallAt(Math.round(u(c) * tr.N)) + 1) }, face: 'along', always: true });
    for (const [x, z, yaw] of [[-40, 30, 0.5], [90, -20, 2.2], [-120, 140, -1.2], [180, -110, 3]]) D.model('skull', W(x, z), { yaw, scale: 1.4, always: true });
    for (const [uu, side] of [[0.12, 1], [0.24, -1], [0.45, 1]]) D.model('ribcage', { u: uu, side, dist: 14 }, { opts: { width: 16 }, face: 'along', scale: 0.8 });
    // Oase: Palmen am Ufer, Felsformationen, Kakteen
    D.scatter('palm', 30, { u0: u(6.5), u1: u(9.5), dist0: 2, dist1: 25, s0: 1.2, s1: 1.8, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    D.scatter('mesa', 16, { dist0: 20, dist1: 60, s0: 0.8, s1: 1.4, colors: [0xc8784a, 0xd8885a], size: 6 });
    D.scatter('cactus', 50, { dist0: 3, dist1: 40, s0: 1, s1: 1.6, colors: [0x5a9a42, 0x4a8a3a], size: 1.5 });
    D.scatter('rock', 40, { dist0: 2, dist1: 30, s0: 0.8, s1: 2.2, colors: [0xc8784a, 0xb86a40], size: 2 });
    D.scatter('reed', 30, { u0: u(7), u1: u(9), dist0: 1, dist1: 14, s0: 1.2, s1: 1.8, colors: [0x2f8a5a], size: 0.8 });
    for (const [uu, side] of [[0.08, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['krabbelkaefer', 'fairy_spotter', 'pilzling']);
  },
};
