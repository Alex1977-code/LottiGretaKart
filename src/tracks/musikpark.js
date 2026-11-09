// Strecke: Musikpark – Archetyp Musik-Welt aus Mario Kart 8 Deluxe (eigene Gestaltung): Start auf der großen
// Klaviertastatur – jede Taste spielt einen Ton –, an Riesengitarren und Trompeten vorbei, in der Anti-Gravitation
// um den Trompetentrichter, über die Trommelbuckel (die Felle hüpfen im Takt, man hebt ab) und zum Schluss über die
// zweite Tastatur zurück. Schwebende Noten in allen Farben. Farben: Bühnenviolett, Gold, Schwarz-Weiß, bunt.

export default {
  id: 'musikpark',
  name: 'Musikpark',
  short: 'Musik',
  theme: 'music',
  music: 'course_star',
  banner: 'MUSIKPARK',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1123,
  ctrl: [
    // Start auf der Klaviertastatur
    [-150, 80], [-60, 92], [30, 90], [110, 70],
    // Anti-Grav-Kurve um den Trompetentrichter
    [160, 20], [165, -40], [120, -90],
    // Trommelbuckel
    [50, -110], [-20, -100],
    // zweite Tastatur, zurück
    [-80, -70], [-140, -90], [-195, -50], [-205, 10], [-185, 55],
  ],
  heights: [3, 3, 3, 3, 5, 9, 11, 8, 6, 5, 4, 4, 3, 3],
  piano: [[0.6, 2.8], [10.3, 11.8]],
  antigrav: [[4.2, 6.4, 35]],
  bumps: [[7.0, 8.6, 1.3, 12]],
  land: {
    flats: [{ x: -20, z: 90, r: 110, h: 3 }],
    hills: [[-260, -150, 120, 28], [260, -140, 120, 30], [40, -280, 150, 36], [-230, 220, 120, 24], [230, 210, 120, 26]],
  },
  items: [0.1, 0.38, 0.62, 0.86],
  boosts: [[0.22, 0], [0.42, 0.3], [0.66, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.36, lat: 0.35 },
    { kind: 'spinpost', u: 0.42, lat: -0.35 },
    { kind: 'brummer', u: 0.15, model: 'flatterkaefer', speed: 5 },
    { kind: 'walker', u: 0.82, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    // Riesen-Instrumente
    D.model('trumpet', W(150, -40), { yaw: 0.6, scale: 1.6, y: 14, always: true });
    D.model('guitar', W(-40, 150), { yaw: 0.2, scale: 1.2, y: 3, always: true });
    D.model('guitar', W(-250, -20), { yaw: 1.8, scale: 1.1, y: 3, opts: { color: 0x3a8ae8 } });
    for (let k = 0; k < 7; k++) D.model('giant_drum', { u: u(7.0) + k * 0.018, side: k % 2 ? 1 : -1, dist: 6 + (k % 2) * 3 }, { opts: { color: [0xe8392d, 0x2a7ae8, 0xffc21a, 0x3aa84a][k % 4] }, scale: 0.8 });
    // schwebende Noten in allen Farben
    for (let k = 0; k < 26; k++) D.model('music_note', { u: k / 26 + 0.01, side: k % 2 ? 1 : -1, dist: 5 + (k % 4) * 6 }, { opts: { color: [0x3a2aff, 0xff3a8a, 0xffc21a, 0x3ad8a8, 0xe8392d][k % 5] }, face: 'track', scale: 0.8 + (k % 3) * 0.2 });
    D.model('speaker_tower', W(-150, 135), { yaw: -Math.PI / 2, always: true });
    D.model('speaker_tower', W(80, 130), { yaw: -Math.PI / 2, always: true });
    D.model('balloons', W(-60, 140), { scale: 1.6 });
    D.scatter('flower', 140, { dist0: 2, dist1: 30, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0xb07aff, 0x5ab8ff], size: 0.3 });
    D.scatter('roundTree', 50, { dist0: 12, dist1: 55, s0: 1.2, s1: 2, colors: [0x5cc23c, 0x4fb833], size: 2.2 });
    for (const [uu, side] of [[0.14, -1], [0.5, 1], [0.8, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, -1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
