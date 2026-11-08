// Strecke: Tempelruinen – Archetyp Dschungeltempel aus Mario Kart 8 Deluxe (eigene Gestaltung): Start auf der
// Lichtung, durch das große Tempeltor, im Tempelhof krachen Stampfsteine herunter (Timing!), hinab ins türkise
// Tempelbecken (Abschnitt unter Wasser), dann die Anti-Gravitations-Wand hinauf an der Stufenpyramide vorbei und
// über die Sprungkuppe zurück. Säulen, Steingesichter, Moos. Sonnig mit staubigen Lichtstrahlen.
// Farben: Sandstein-Ocker, Moosgrün, Türkiswasser, Gold.

export default {
  id: 'tempelruinen',
  name: 'Tempelruinen',
  short: 'Tempel',
  theme: 'ruins',
  music: 'course_arena',
  banner: 'TEMPELRUINEN',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 934,
  ctrl: [
    // Lichtung ostwärts, durch das Tempeltor
    [-150, 100], [-60, 104], [30, 100], [100, 85],
    // Tempelhof mit Stampfsteinen
    [150, 40], [160, -20], [130, -70],
    // hinunter ins Tempelbecken (unter Wasser)
    [70, -95], [10, -102], [-50, -96],
    // Anti-Gravitations-Wand an der Pyramide, Sprungkuppe
    [-100, -75], [-150, -82], [-200, -40], [-205, 20], [-185, 70],
  ],
  heights: [
    4, 4, 4, 4.5,
    5.5, 6, 6,
    2, -6, -6,
    1, 5, 7.5, 6, 4.5,
  ],
  antigrav: [[10.4, 13.3, 50]],
  bumps: [[13.6, 14.2, 1.6, 20]],
  land: {
    lakes: [{ x: -20, z: -100, r: 48, depth: 9 }],
    flats: [{ x: 0, z: 0, r: 120, h: 4 }],
    hills: [[-260, -120, 110, 30], [250, -100, 110, 28], [60, -240, 150, 36], [-220, 210, 120, 24], [220, 200, 120, 26]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.18, 0], [0.48, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0, 0, 5], [0.52, 0.58, 0, 0, 6], [0.72, 0.78, 0.4, 0.4, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    // Stampfsteine im Tempelhof (krachen herunter, wenn ein Kart kommt)
    { kind: 'stampfstein', u: 0.3, lat: -0.35 },
    { kind: 'stampfstein', u: 0.34, lat: 0.35 },
    { kind: 'stampfstein', u: 0.38, lat: -0.2 },
    { kind: 'spinpost', u: 0.76, lat: 0.35 },
    { kind: 'walker', u: 0.14, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const uAt = (x, z) => {
      const X = tr.ox + x, Z = tr.oz + z;
      let best = 0, bd = Infinity;
      for (let i = 0; i < tr.N; i++) { const d = (tr.px[i] - X) ** 2 + (tr.pz[i] - Z) ** 2; if (d < bd) { bd = d; best = i; } }
      return best / tr.N;
    };
    // Tempeltor über der Fahrbahn, Stufenpyramide im Innenfeld, Steingesichter am Rand
    D.model('temple_gate', { u: uAt(30, 100), lat: 0 }, { opts: { width: 2 * (tr.wallAt(Math.round(uAt(30, 100) * tr.N)) + 1.5) }, face: 'along', always: true });
    D.model('step_pyramid', W(-40, 10), { yaw: Math.PI, scale: 1.2, always: true });
    for (const [u, side] of [[0.24, 1], [0.42, -1], [0.66, 1], [0.92, -1]]) D.model('stone_face', { u, side, dist: 6 }, { face: 'track', always: true });
    // Säulengang im Tempelhof, umgestürzte Säulen
    for (let k = 0; k < 12; k++) D.model('temple_pillar', { u: 0.26 + k * 0.012, side: k % 2 ? 1 : -1, dist: 1.8 }, { opts: { h: 10, broken: k % 5 === 3 } });
    for (let k = 0; k < 8; k++) D.model('temple_pillar', { u: 0.04 + k * 0.025, side: k % 2 ? 1 : -1, dist: 3 + (k % 3) * 2 }, { opts: { h: 8, broken: k % 2 === 0 } });
    // Dschungel: Palmen, Farne, Büsche, Moos-Felsen
    D.scatter('palm', 60, { dist0: 3, dist1: 40, s0: 1.2, s1: 1.9, colors: [0x2f8a2a, 0x3fa02a], size: 1.2 });
    D.scatter('fern', 120, { dist0: 0.5, dist1: 22, s0: 1, s1: 1.7, colors: [0x3f9a2a, 0x4aa83a], size: 0.8 });
    D.scatter('bush', 60, { dist0: 1, dist1: 30, s0: 0.8, s1: 1.4, colors: [0x3f8a2a, 0x4a9a32], size: 1.2 });
    D.scatter('rock', 40, { dist0: 2, dist1: 30, s0: 1, s1: 2.4, colors: [0xb89a6a, 0x9a8a5a], size: 2 });
    // im Becken: Seegras und Fische
    D.scatter('reed', 40, { u0: 0.5, u1: 0.66, dist0: 1, dist1: 18, s0: 1.2, s1: 2, colors: [0x2f8a5a], size: 0.8 });
    D.model('fish_school', { u: 0.58, side: 1, dist: 5 }, { y: 3, scale: 1.3 });
    D.model('light_rays', { u: 0.58, lat: 0 }, { y: -2 });
    for (const [u, side] of [[0.08, 1], [0.5, -1], [0.82, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['krabbelkaefer', 'fairy_spotter', 'pilzling']);
  },
};
