// Strecke: Baumwipfelweg – Archetyp Wald in den Baumkronen aus Mario Kart 8 Deluxe (eigene Gestaltung): Holzstege
// hoch oben zwischen riesigen Bäumen, über breite Pilzhüte als Brücken, mit dem Gleiter von einem Baum zum nächsten
// und auf einer Rampe wieder hinab auf den Waldboden. Grünes Sonnenlicht durch das Laub, Glühwürmchen.
// Farben: Holzbraun, Laubgrün, Pilzrot, Sonnengold.

const H = 16;   // Höhe der Holzstege über dem Waldboden

export default {
  id: 'baumwipfel',
  name: 'Baumwipfelweg',
  short: 'Baumwipfel',
  theme: 'treetop',
  music: 'course_grass',
  banner: 'BAUMWIPFELWEG',
  time: 'day',
  weather: 'sun',
  hw: 7,
  margin: 4,
  seed: 1229,
  bridgePillars: false,
  ctrl: [
    // Waldboden, Rampe hinauf
    [-150, 80], [-60, 92], [30, 85],
    // Holzstege in den Baumkronen
    [100, 60, 7, H * 0.5], [150, 15, 7, H], [150, -45, 7, H], [100, -95, 7, H],
    [30, -110, 7, H], [-30, -90, 7, H],
    // Gleitflug hinunter, Waldboden
    [-90, -50], [-150, -60], [-200, -10], [-195, 45],
  ],
  heights: [3, 3, 3, 3, 4, 5, 5, 4, 4, 3, 3, 3, 3],
  glides: [{ c: 8.3, w: 12 }],
  flights: [[8.5, 9.1]],
  land: {
    flats: [{ x: 90, z: -40, r: 120, h: 2 }, { x: -10, z: -100, r: 70, h: 2 }],
    hills: [[-260, -150, 120, 30], [260, -140, 120, 34], [40, -280, 150, 40], [-230, 220, 120, 24], [230, 210, 120, 26]],
  },
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.2, 0], [0.44, 0.3], [0.56, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0, 0, 5], [0.46, 0.5, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'brummer', u: 0.36, speed: 4 },
    { kind: 'brummer', u: 0.52, model: 'flatterkaefer', speed: 5 },
    { kind: 'walker', u: 0.85, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    // riesige Bäume an den Stegen, Pilzhüte als Plattformen, Glühwürmchen-Laternen
    for (let k = 0; k < 14; k++) D.model('giant_tree', { u: u(3.2) + k * 0.026, side: k % 2 ? 1 : -1, dist: 6 + (k % 3) * 3 }, { scale: 1 + (k % 3) * 0.2, y: -2, always: k % 3 === 0 });
    for (let k = 0; k < 8; k++) D.model('giant_mushroom', { u: u(3.5) + k * 0.05, side: k % 2 ? -1 : 1, dist: 14 }, { opts: { color: k % 2 ? 0xe8392d : 0xffa02a }, scale: 1.4 });
    for (let k = 0; k < 14; k++) D.model('lantern', { u: u(3.2) + k * 0.026, side: k % 2 ? -1 : 1, dist: 0.6 }, { state: 'on', y: H, scale: 1.2 });
    D.scatter('roundTree', 160, { dist0: 4, dist1: 60, s0: 1.6, s1: 2.6, colors: [0x3f9a2a, 0x2f8a2a, 0x4fae34], size: 2.6 });
    D.scatter('fern', 140, { dist0: 1, dist1: 30, s0: 1, s1: 1.8, colors: [0x2f8a3a, 0x3a9a42], size: 0.8 });
    D.scatter('mushroom', 50, { dist0: 2, dist1: 25, s0: 0.8, s1: 1.6, colors: [0xe8392d, 0xffa02a], size: 2 });
    for (const [uu, side] of [[0.12, -1], [0.66, 1], [0.86, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['pilzling', 'fairy_spotter', 'bunny_small']);
  },
};
