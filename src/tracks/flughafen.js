// Strecke: Ferienflughafen – Archetyp tropischer Ferienflughafen aus Mario Kart 8 Deluxe (eigene Gestaltung): Start
// auf dem Vorfeld, mitten durch das Terminal, in der Anti-Gravitations-Steilkurve um den Kontrollturm, über die
// breite Startbahn an geparkten Flugzeugen vorbei (über die Köpfe donnert ein startender Jet) und über die Gleiter-
// Schanze am Bahnende hinunter zum Strand. Gepäckschlepper fahren über das Vorfeld.
// Strahlender Sonnentag. Farben: Terminalweiß, Himmelblau, Palmengrün, gelbe Markierungen.

export default {
  id: 'flughafen',
  name: 'Ferienflughafen',
  short: 'Flughafen',
  theme: 'airport',
  music: 'course_diorama',
  banner: 'FERIENFLUGHAFEN',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 963,
  ctrl: [
    // Vorfeld, dann durch das Terminal
    [-170, 95], [-80, 100], [10, 100], [100, 88],
    // Anti-Gravitations-Steilkurve um den Kontrollturm
    [160, 50], [178, -10], [150, -65],
    // Startbahn westwärts
    [90, -96, 10], [0, -104, 10], [-90, -104, 10],
    // Bahnende mit Gleiter-Schanze, hinunter zum Strand
    [-150, -88], [-200, -30], [-212, 30], [-196, 74],
  ],
  heights: [
    3, 3, 3, 3,
    3.5, 4, 3.5,
    3, 3, 4,
    9, 3, 3, 3,
  ],
  antigrav: [[3.6, 6.5, 38]],
  glides: [{ c: 10.05, w: 13 }],
  flights: [[10.25, 11.1]],
  land: {
    sea: true,
    island: { cx: -10, cz: 0, rx: 330, rz: 240 },
    flats: [{ x: -20, z: 0, r: 200, h: 3 }],
    hills: [[-220, -70, 40, 6], [80, 260, 120, 18], [-300, 150, 90, 20]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.18, 0], [0.42, 0.35], [0.55, 0], [0.62, -0.35], [0.93, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.27, 0.31, 0.4, 0.4, 5], [0.52, 0.58, 0, 0, 7], [0.64, 0.68, -0.3, 0.3, 5], [0.88, 0.92, 0, 0, 4]],
  hazards: [
    // Gepäckschlepper über das Vorfeld und die Startbahn
    { kind: 'traffic', u: 0.05, lane: 3.5, speed: 8, model: 'baggage_cart', length: 9 },
    { kind: 'traffic', u: 0.6, lane: -4, speed: 7, model: 'baggage_cart', length: 9 },
    { kind: 'spinpost', u: 0.33, lat: 0.35 },
    { kind: 'spinpost', u: 0.39, lat: -0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const u = (c) => tr.uCtrl(c);
    // Terminal zum Durchfahren, Kontrollturm, Flugzeuge an der Startbahn, ein Jet im Steigflug
    D.model('mall', { u: u(1.6), lat: 0 }, { opts: { length: 64, width: 2 * (tr.wallAt(Math.round(u(1.6) * tr.N)) + 1.2), text: 'TERMINAL · ABFLUG' }, face: 'along', always: true });
    D.model('control_tower', W(120, 15), { always: true });
    for (const [x, z, yaw, col] of [[60, -150, 0.1, 0x1e6cff], [-40, -152, -0.05, 0xe8392d], [-140, -150, 0.08, 0x2ab04a], [130, 150, 3.1, 0xffc21a]]) D.model('airplane', W(x, z), { y: 3.8, yaw, opts: { color: col }, always: true });
    const jet = D.model('airplane', W(0, -110), { opts: { color: 0xff6aa8 }, always: true });
    jet.tick = (e, dt, t) => {
      const k = ((t * 0.06) % 1), x = 260 - k * 620, y = 7 + Math.max(0, (k - 0.35)) * 160;
      e.model.root.position.set(tr.ox + x, y, tr.oz - 130);
      e.model.root.rotation.set(0, Math.PI, k > 0.35 ? 0.18 : 0);
    };
    // Strand mit Palmen hinter der Schanze, Palmen am Vorfeld, Gepäckwagen
    D.scatter('palm', 70, { dist0: 3, dist1: 40, s0: 1.2, s1: 1.8, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    D.scatter('umbrella', 30, { u0: 0.82, u1: 1, dist0: 6, dist1: 40, s0: 1, s1: 1.3, colors: [0xe8392d, 0x1e8cff, 0xffd23a], size: 2 });
    D.scatter('bush', 40, { dist0: 2, dist1: 25, s0: 0.7, s1: 1.1, colors: [0x5ab84a], size: 1.2 });
    for (let k = 0; k < 12; k++) D.model('street_lamp', { u: 0.6 + k * 0.012, side: k % 2 ? 1 : -1, dist: 0.6 }, { face: 'track' });
    for (const [uu, side] of [[0.08, 1], [0.48, -1], [0.75, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
