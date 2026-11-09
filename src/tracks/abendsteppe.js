// Strecke: Abendsteppe – Archetyp Savanne mit Tageszeitwechsel aus Mario Kart 8 Deluxe (eigene Gestaltung): jede
// Runde eine andere Tageszeit – Runde 1 am Tag, Runde 2 im Abendrot, Runde 3 in der Nacht. Durch die goldene Steppe
// zwischen Schirmakazien, an Giraffen vorbei, über die Sprungkuppen am Felsen, Elefanten trotten über die Bahn.
// Farben: Savannengold, Abendrot, Akaziengrün, Nachtblau.

export default {
  id: 'abendsteppe',
  name: 'Abendsteppe',
  short: 'Steppe',
  theme: 'savanna',
  music: 'course_arena',
  banner: 'ABENDSTEPPE',
  time: 'day',
  timeByLap: ['day', 'dusk', 'night'],
  weather: 'sun',
  hw: 8.5,
  margin: 4,
  seed: 1249,
  ctrl: [
    [-160, 80], [-70, 95], [20, 90], [100, 70],
    [150, 20], [160, -40], [120, -90],
    [50, -110], [-20, -95], [-80, -60], [-140, -80], [-195, -40], [-205, 20], [-185, 60],
  ],
  heights: [3, 3, 4, 6, 8, 10, 8, 6, 9, 5, 4, 4, 3, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [4, 6.5], side: 1, h: 14 }],
  shortcuts: [{ pts: [[-99, -56], [-148, -26], [-198, 3]], w: 4, kind: 'dirt' }],
  bumps: [[1.2, 2.8, 1.0, 26]],
  land: {
    hills: [[-20, -10, 90, 8], [60, -150, 60, 18], [-260, -150, 120, 26], [260, -140, 120, 30], [40, -280, 150, 34], [-230, 220, 120, 22], [230, 210, 120, 24]],
    lakes: [{ x: -60, z: 20, r: 30, depth: 2 }],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.3, model: 'elephant', speed: 1.2, scale: 1.3, radius: 2.2 },
    { kind: 'walker', u: 0.66, model: 'elephant', speed: 1.0, scale: 1.2, radius: 2.0 },
    { kind: 'roller', u: 0.82, style: 'tumbleweed', size: 1.3, speed: 6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    for (let k = 0; k < 40; k++) D.model('acacia', { u: k / 40 + 0.01, side: k % 2 ? 1 : -1, dist: 8 + (k % 5) * 9 }, { yaw: k * 1.9, scale: 1.2 + (k % 3) * 0.3 });
    for (let k = 0; k < 8; k++) D.model('giraffe', { u: k / 8 + 0.05, side: k % 2 ? -1 : 1, dist: 18 + (k % 3) * 8 }, { yaw: k * 2.3, scale: 1.3, always: k < 2 });
    for (let k = 0; k < 5; k++) D.model('elephant', { u: k / 5 + 0.1, side: 1, dist: 30 }, { yaw: k, scale: 1.3 });
    D.model('skull', W(60, -165), { yaw: 1, scale: 0.8 });
    D.scatter('mesa', 14, { dist0: 30, dist1: 70, s0: 0.8, s1: 1.4, colors: [0xb8784a, 0xc8884a], size: 6 });
    D.scatter('rock', 40, { dist0: 3, dist1: 30, s0: 0.8, s1: 2.2, colors: [0xb8784a, 0xa86a40], size: 2 });
    D.scatter('tuft', 220, { dist0: 1, dist1: 40, s0: 1.2, s1: 2, colors: [0xd8b85a, 0xc8a048], size: 0.5 });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling']);
  },
};
