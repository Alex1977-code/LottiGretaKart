// Strecke: Kirschblüteninsel – Archetyp Tempelinsel mit Kirschblüten aus Mario Kart 8 Deluxe (eigene Gestaltung):
// die Allee unter roten Toren hindurch zwischen rosa Kirschbäumen, Bambus und Steinlaternen, den Tempelhügel hinauf
// an der Pagode vorbei, mit dem Gleiter über den Koi-Teich und auf der schwebenden Brücke (Anti-Gravitation) zurück.
// Frühlingstag. Farben: Kirschrosa, Tempelrot, Bambusgrün, Steingrau.

export default {
  id: 'kirschbluete',
  name: 'Kirschblüteninsel',
  short: 'Kirschblüte',
  theme: 'blossom',
  music: 'course_river',
  banner: 'KIRSCHBLÜTENINSEL',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1151,
  ctrl: [
    // Allee unter den Toren
    [-160, 60], [-80, 95], [10, 100], [90, 80],
    // den Tempelhügel hinauf
    [140, 40], [150, -20], [110, -70], [50, -90],
    // Gleitflug über den Koi-Teich, schwebende Brücke
    [-10, -80], [-60, -40, 7.5, 2.5], [-110, -60], [-170, -50], [-200, 0],
  ],
  heights: [3, 3, 3, 4, 8, 13, 16, 16, 3, 2, 2, 3, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [4, 6.5], side: 1, h: 16 }],
  tunnels: [{ c: [1.3, 2.2] }],
  glides: [{ c: 7.3, w: 12 }],
  flights: [[7.5, 8.15]],
  antigrav: [[8.6, 10.4, 0]],
  land: {
    lakes: [{ x: -30, z: -60, r: 46, depth: 3 }],
    hills: [[110, -60, 70, 14], [-260, -150, 120, 30], [260, -140, 120, 34], [40, -280, 150, 40], [-230, 220, 120, 24], [230, 210, 120, 26]],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.08, 0], [0.3, 0.3], [0.72, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.27, 0.31, 0.3, -0.3, 5], [0.68, 0.72, 0, 0, 6], [0.8, 0.84, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.7, lat: 0.35 },
    { kind: 'spinpost', u: 0.75, lat: -0.35 },
    { kind: 'walker', u: 0.15, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
    { kind: 'brummer', u: 0.45, model: 'flatterkaefer', speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const gw = (uu) => 2 * (tr.wallAt(Math.round(uu * tr.N)) + 1.2);
    // rote Tore über der Allee, Pagode auf dem Hügel, Tempelhallen
    for (const uu of [0.03, 0.08, 0.13, 0.18, 0.23]) D.model('torii', { u: uu, lat: 0 }, { opts: { width: gw(uu) }, face: 'along' });
    D.model('pagoda', W(150, -80), { yaw: 0.6, scale: 1.3, always: true });
    D.model('pagoda', W(-120, 140), { yaw: 2.2, scale: 0.9 });
    D.model('temple_gate', W(70, -120), { yaw: 0.2, opts: { width: 14 }, scale: 1.2 });
    for (let k = 0; k < 18; k++) D.model('stone_lantern', { u: k / 18 + 0.02, side: k % 2 ? 1 : -1, dist: 1.6 }, { face: 'track' });
    for (let k = 0; k < 16; k++) D.model('bamboo', { u: 0.3 + k * 0.03, side: k % 2 ? 1 : -1, dist: 5 + (k % 3) * 5 }, { scale: 1.1 });
    // Kirschbäume (rosa), Teich mit Seerosen-Schilf
    D.scatter('roundTree', 160, { dist0: 3, dist1: 50, s0: 1.1, s1: 1.8, colors: [0xffb8d8, 0xff9ac8, 0xffd0e4, 0xf48ab8], size: 2.2 });
    D.scatter('flower', 140, { dist0: 1, dist1: 30, s0: 1, s1: 1.4, colors: [0xffb8d8, 0xffffff, 0xff6aa8], size: 0.3 });
    D.scatter('reed', 40, { u0: 0.6, u1: 0.8, dist0: 1, dist1: 20, s0: 1, s1: 1.5, colors: [0x3a9a62, 0x4fae6a], size: 0.8 });
    D.scatter('rock', 30, { dist0: 3, dist1: 30, s0: 0.8, s1: 1.8, colors: [0x9a968e, 0x8a867e], size: 2 });
    for (const [uu, side] of [[0.1, 1], [0.45, -1], [0.84, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
