// Strecke 23: Buckelpisten-Arena – nach dem Vorbild der Excitebike-Arena aus Mario Kart 8 Deluxe: ein Stadion
// mit Lehmpiste in Schlangenlinien, ringsum Tribünen voller Zuschauer. Auf den Geraden folgen Buckel auf Buckel
// (bei Tempo hebt das Kart über jeden ab), auf der Gegengeraden große Sprunghügel, am Ende eine Schanze.

export default {
  id: 'arena',
  name: 'Buckelpisten-Arena',
  short: 'Arena',
  theme: 'arena',
  music: 'course_diorama',
  banner: 'BUCKELPISTEN-ARENA',
  hw: 8,
  margin: 3.5,
  seed: 611,
  noLine: true,
  ctrl: [
    // Start-Ziel-Gerade ostwärts (Tribüne rechts)
    [-130, 60], [-50, 62], [30, 62], [100, 58],
    // Kehre Ost
    [135, 40], [140, 10], [118, -8],
    // Mittelgerade westwärts
    [60, -12], [-20, -12], [-70, -15],
    // Kehre West
    [-100, -32], [-98, -58], [-72, -74],
    // Nordgerade ostwärts mit Schanze
    [-10, -80], [60, -82], [115, -86],
    // Kehre Nordost, dann die lange Gegengerade zurück nach Westen und die Westkurve hinunter zum Start
    [150, -100], [148, -128], [110, -142], [20, -144], [-80, -142], [-150, -125], [-178, -80], [-182, -20], [-172, 30], [-155, 55],
  ],
  heights: [
    3, 3, 3, 3,
    3.6, 4.2, 3.6,
    3, 3, 3,
    3.6, 4.2, 3.6,
    3, 3.2, 3,
    3.6, 4.2, 3.6, 3, 3, 3, 3, 3, 3, 3,
  ],
  // [von Punkt, bis Punkt, Höhe, Wellenlänge]: Buckel wie auf einer Motocross-Strecke
  bumps: [
    [0.5, 2.6, 1.0, 13],      // Start-Ziel-Gerade: kleine Buckel
    [7.0, 9.0, 1.4, 16],      // Mittelgerade: mittlere Buckel
    [13.2, 14.8, 1.3, 15],    // Nordgerade
    [18.8, 20.8, 2.2, 22],    // Gegengerade: große Sprunghügel
  ],
  items: [0.13, 0.4, 0.62, 0.84],
  boosts: [[0.21, 0], [0.47, 0.35], [0.66, -0.35], [0.9, 0]],
  ramps: [[0.58, 0, 8]],
  coins: [[0.03, 0.08, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.5, 0.55, 0, 0, 5], [0.7, 0.76, 0, 0, 6], [0.94, 0.97, 0.3, -0.3, 4]],
  hazards: [
    { kind: 'roller', u: 0.36, style: 'barrel', size: 1.2, speed: 5 },
    { kind: 'walker', u: 0.52, model: 'pilzling', speed: 2.6, scale: 1.5, radius: 0.6 },
    { kind: 'walker', u: 0.8, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Tribünen außen an der Start-Ziel-Geraden, an der Gegengeraden und an den Kehren
    for (const [u, side, len] of [[0.02, 1, 46], [0.085, 1, 46], [0.15, 1, 40], [0.69, 1, 46], [0.75, 1, 46], [0.81, 1, 46], [0.26, 1, 30], [0.88, 1, 34]]) {
      D.model('grandstand', { u, side, dist: 4.5 }, { opts: { length: len, rows: 7 }, face: 'track', always: true });
    }
    // Reifenstapel und Fahnen im Innenfeld, Strohballen an den Kehren
    for (let k = 0; k < 14; k++) D.model('checkpoint_flag', { u: k / 14 + 0.03, side: -1, dist: 1.6 }, { scale: 1.1, face: 'track' });
    D.scatter('block', 40, { side: -1, dist0: 1.5, dist1: 6, s0: 1, s1: 1.3, colors: [0xe8c86a, 0xdcbc5e], size: 1.4 });   // Strohballen
    D.scatter('tuft', 160, { side: -1, dist0: 3, dist1: 30, s0: 0.9, s1: 1.3, colors: [0x5fb83a, 0x6ac844], size: 0.4 });
    // Anzeigetafel und Flutlichtmasten
    D.model('question_block', W(0, 20), { y: 9, scale: 3, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.5; e.model.update(dt, 'idle'); }, always: true });
    for (const [x, z] of [[-200, 85], [175, 85], [175, -165], [-200, -165]]) D.model('street_lamp', W(x, z), { scale: 3.2, always: true });
    D.crowd(0.975, -1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
