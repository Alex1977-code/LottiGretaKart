// Strecke: Kuhweide – Archetyp Bauernhof-Wiese aus Mario Kart 8 Deluxe (eigene Gestaltung): eine leichte Runde
// über sanfte Hügel im Abendlicht, vorbei an der roten Scheune, dem Silo und der Windmühle, über Buckel, auf denen
// man abhebt; Kühe trotten über die Fahrbahn, Matschpfützen am Rand bremsen. Weiße Zäune, Heuballen, Traktor.
// Farben: sattes Grün, Scheunenrot, Heugelb, Abendgold.

export default {
  id: 'kuhweide',
  name: 'Kuhweide',
  short: 'Kuhweide',
  theme: 'farm',
  music: 'course_grass',
  banner: 'KUHWEIDE',
  time: 'dusk',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1061,
  ctrl: [
    // Start an der Scheune (ostwärts)
    [-160, 80], [-70, 92], [20, 84], [100, 60],
    // hinauf auf den Hügel, Buckelpiste über die Weide
    [150, 10], [150, -50], [110, -100], [40, -120],
    // durch die Senke an der Windmühle
    [-30, -100], [-70, -60], [-120, -80], [-180, -60],
    // zurück zum Hof
    [-205, 0], [-190, 50],
  ],
  heights: [3, 3, 4, 6, 9, 12, 11, 8, 5, 7, 8, 6, 4, 3],
  bumps: [[1.1, 3.0, 1.2, 22], [6.2, 7.8, 1.4, 20]],
  mud: [[-30, 70, 7, 'mud'], [128, -82, 7, 'mud'], [-100, -55, 6, 'mud'], [-160, -88, 7, 'mud'], [60, 104, 6, 'mud']],
  land: {
    flats: [{ x: -110, z: 120, r: 70, h: 3 }],
    hills: [[30, -20, 90, 10], [-260, -150, 120, 26], [250, -120, 120, 30], [40, -270, 150, 34], [-230, 220, 120, 22], [220, 200, 120, 26]],
    lakes: [{ x: -120, z: -10, r: 34, depth: 3 }],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    // Kühe trotten über die Fahrbahn
    { kind: 'walker', u: 0.16, model: 'cow', speed: 1.4, scale: 1.6, radius: 1.3 },
    { kind: 'walker', u: 0.34, model: 'cow', opts: { color: 'brown' }, speed: 1.2, scale: 1.6, radius: 1.3 },
    { kind: 'walker', u: 0.5, model: 'cow', speed: 1.5, scale: 1.6, radius: 1.3 },
    { kind: 'walker', u: 0.66, model: 'cow', opts: { color: 'brown' }, speed: 1.3, scale: 1.6, radius: 1.3 },
    { kind: 'roller', u: 0.82, style: 'model', model: 'hay_bale', size: 1.3, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Hof: Scheune, Silo, Traktor, Windmühlen auf den Hügeln
    D.model('barn', W(-110, 130), { yaw: -Math.PI / 2, scale: 1.1, always: true });
    D.model('silo', W(-80, 135), { always: true });
    D.model('silo', W(-140, 140), { scale: 0.85 });
    D.model('tractor', W(-60, 118), { yaw: 0.6, scale: 1.3 });
    D.model('windmill', W(-40, -150), { yaw: 0.3, scale: 1.4, always: true });
    D.model('windmill', W(200, -40), { yaw: 2, scale: 1.1 });
    // weiße Zäune an der Strecke, Heuballen, grasende Kühe auf der Weide
    for (let k = 0; k < 40; k++) D.model('farm_fence', { u: k / 40 + 0.005, side: k % 2 ? 1 : -1, dist: 2.2 }, { face: 'along' });
    for (let k = 0; k < 14; k++) D.model('hay_bale', { u: 0.03 + k * 0.07, side: k % 2 ? -1 : 1, dist: 7 + (k % 3) * 5 }, { yaw: k, scale: 1.3 });
    for (let k = 0; k < 16; k++) D.model('cow', { u: 0.02 + k * 0.062, side: k % 2 ? 1 : -1, dist: 10 + (k % 4) * 7 }, { yaw: k * 1.7, opts: { color: k % 3 ? 'white' : 'brown' }, scale: 1.6 });
    D.scatter('flower', 200, { dist0: 2, dist1: 40, s0: 1, s1: 1.4, colors: [0xffd21f, 0xffffff, 0xff6aa8, 0xb07aff], size: 0.3 });
    D.scatter('roundTree', 70, { dist0: 12, dist1: 60, s0: 1.2, s1: 2, colors: [0x4fb833, 0x5cc23c, 0x3f9a2a], size: 2.2 });
    D.scatter('bush', 50, { dist0: 4, dist1: 30, s0: 0.8, s1: 1.3, colors: [0x4fae34, 0x5cbf3a], size: 1.2 });
    D.scatter('tuft', 160, { dist0: 1, dist1: 25, s0: 1, s1: 1.6, colors: [0x6cc24a, 0x7fd552], size: 0.4 });
    for (const [u, side] of [[0.1, 1], [0.45, -1], [0.78, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['bunny_small', 'pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
