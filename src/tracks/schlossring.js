// Strecke 24: Schlossring – nach dem Vorbild von Royal Raceway aus Mario Kart 8 Deluxe: Start im Tal, dann die
// lange Auffahrt am Hang hinauf (Ost- und Nordseite des Schlossbergs), oben am Märchenschloss vorbei und von der
// Bergkante über die Gleiter-Schanze: weiter Gleitflug über den See hinunter ins Tal, zurück zum Start.
// Höhenprofil: 3 m im Tal, 28 m oben am Schloss.

export default {
  id: 'schlossring',
  name: 'Schlossring',
  short: 'Schloss',
  theme: 'royal',
  music: 'course_diorama',
  banner: 'SCHLOSSRING',
  hw: 7.5,
  margin: 4,
  seed: 733,
  ctrl: [
    // Start-Ziel-Gerade im Tal ostwärts
    [-185, 82], [-110, 84], [-20, 82], [60, 76],
    // Auffahrt am Osthang
    [130, 62], [185, 30], [205, -20], [195, -70],
    // Nordseite hinauf zum Schloss
    [160, -105], [105, -122], [50, -120], [2, -106],
    // Gleitflug über den See (keine Fahrbahn), Landung im Tal
    [-62, -84], [-128, -58],
    // Westseite zurück zum Start
    [-172, -24], [-196, 14], [-214, 52],
  ],
  heights: [
    3, 3, 3, 3.5,
    5, 8, 12, 16,
    20, 24, 27, 28,
    15, 3.4,
    3, 3, 3,
  ],
  glides: [{ c: 11.15, w: 12 }],   // Gleiter-Schanze an der Bergkante
  flights: [[11.35, 12.9]],
  items: [0.08, 0.3, 0.55, 0.85],
  boosts: [[0.18, 0], [0.42, -0.3], [0.62, 0.3], [0.93, 0]],
  coins: [[0.02, 0.06, -0.4, 0.4, 6], [0.22, 0.26, 0.3, -0.3, 5], [0.46, 0.5, 0, 0, 6], [0.86, 0.9, -0.3, 0.3, 5]],
  hazards: [
    { kind: 'walker', u: 0.36, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.5, model: 'pilzling', speed: 2.6, scale: 1.5, radius: 0.6 },
    { kind: 'roller', u: 0.45, style: 'barrel', size: 1.3, speed: 4 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Schloss auf dem Berg (Wahrzeichen) mit Wimpeln
    D.model('palace', W(100, -70), { yaw: -Math.PI / 2, always: true });
    for (const [x, z] of [[70, -95], [130, -95], [60, -45], [140, -45]]) D.model('checkpoint_flag', W(x, z), { scale: 1.6 });
    // Schlossgarten: runde Bäume, Hecken und Blumen; Wald am Hang
    D.scatter('roundTree', 70, { dist0: 4, dist1: 40, s0: 1.1, s1: 1.8, colors: [0x4fb833, 0x5cc23c, 0x3fa02a], size: 2.2 });
    D.scatter('bush', 50, { dist0: 1, dist1: 20, s0: 0.7, s1: 1.2, colors: [0x5aae3a, 0x4a9e32], size: 1.2 });
    D.scatter('flower', 140, { dist0: 0.5, dist1: 20, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0xffffff, 0xb47fe6], size: 0.3 });
    D.scatter('daisy', 80, { dist0: 1, dist1: 18, s0: 1, s1: 1.3, colors: [0xffffff], size: 0.3 });
    // Zuschauer an der Start-Ziel-Geraden und unten am See
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
    D.crowd(0.8, -1, ['bunny_small', 'pilzling', 'fairy_spotter']);
    for (const [u, side] of [[0.12, -1], [0.4, 1], [0.9, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
