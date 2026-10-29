// Strecke 25: Wasserfall-Schlucht – nach dem Vorbild von Shy Guy Falls aus Mario Kart 8 Deluxe: Start unten in der
// Schlucht am Fluss, vorbei am großen Wasserfall, dann steil die Felswand hinauf auf das Hochplateau mit der
// Kristallmine (Loren rollen über die Strecke), oben an der Kante entlang und über die Gleiter-Schanze neben dem
// zweiten Wasserfall in die Schlucht hinab zurück zum Start. Höhenprofil: 4 m am Fluss, 32 m auf dem Plateau.

export default {
  id: 'schlucht',
  name: 'Wasserfall-Schlucht',
  short: 'Schlucht',
  theme: 'canyon',
  music: 'course_river',
  banner: 'WASSERFALL-SCHLUCHT',
  hw: 7.5,
  margin: 4,
  seed: 845,
  ctrl: [
    // Schluchtgrund ostwärts am Fluss entlang (links der große Wasserfall)
    [-165, 76], [-100, 77], [-30, 74], [50, 74], [118, 62],
    // die Felswand hinauf
    [165, 30], [180, -15], [168, -58], [132, -86],
    // Hochplateau mit Kristallmine
    [72, -98], [14, -88], [-40, -78], [-96, -76],
    // Gleitflug in die Schlucht (keine Fahrbahn)
    [-142, -42], [-178, 2],
    // Landung und weite Kurve zum Start
    [-202, 34], [-210, 58], [-196, 74],
  ],
  heights: [
    4, 4, 4.2, 4.5, 6,
    10, 17, 24, 29.5,
    32, 32, 32, 32,
    18, 4.2,
    4, 4, 4,
  ],
  bumps: [[9.3, 10.7, 1.1, 14]],      // holprige Minengleise auf dem Plateau
  glides: [{ c: 12.1, w: 12 }],
  flights: [[12.3, 13.9]],
  items: [0.1, 0.35, 0.58, 0.88],
  boosts: [[0.2, 0], [0.3, 0.3], [0.62, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.24, 0.28, 0.3, -0.3, 5], [0.48, 0.52, 0, 0, 5], [0.63, 0.66, 0.3, -0.3, 4]],
  hazards: [
    // Loren rollen über das Plateau
    { kind: 'traffic', u: 0.55, lane: -3, speed: 7, model: 'mine_cart', length: 3.4 },
    { kind: 'traffic', u: 0.62, lane: 3, speed: 6, model: 'mine_cart', length: 3.4 },
    { kind: 'walker', u: 0.15, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3, scale: 1.6, radius: 0.6 },
    { kind: 'walker', u: 0.92, model: 'pilzling', speed: 2.6, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // zwei Wasserfälle vom Plateau in die Schlucht (Wahrzeichen)
    D.model('waterfall', W(-20, -40), { yaw: -Math.PI / 2, opts: { h: 38, w: 20, tilt: 0.5 }, always: true });
    D.model('waterfall', W(-120, -34), { yaw: -Math.PI / 2, opts: { h: 36, w: 12, tilt: 0.55 }, always: true });
    // Kristalle und Felsen auf dem Plateau, Loren am Rand
    D.scatter('crystal', 60, { u0: 0.48, u1: 0.7, dist0: 1, dist1: 22, s0: 1, s1: 2.4, colors: [0xff6aa8, 0x58b8ff, 0xffd21f, 0xb47fe6, 0x7ae85a], size: 1.2 });
    D.scatter('rock', 70, { dist0: 2, dist1: 40, s0: 0.8, s1: 2.6, colors: [0xb86a4a, 0xa85e40, 0xc87a52], size: 2 });
    for (const [u, side] of [[0.52, 1], [0.58, -1], [0.66, 1]]) D.model('mine_cart', { u, side, dist: 3 }, { face: 'along' });
    // Palmen und Farne unten am Fluss, Hütten der Minenarbeiter oben
    D.scatter('palm', 40, { u0: 0, u1: 0.3, dist0: 1, dist1: 20, s0: 1.1, s1: 1.6, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    D.scatter('fern', 80, { u0: 0, u1: 0.3, dist0: 0.5, dist1: 14, s0: 1, s1: 1.5, colors: [0x4a9a32, 0x5aae3a], size: 0.8 });
    D.scatter('reed', 60, { u0: 0, u1: 0.3, side: -1, dist0: 2, dist1: 14, s0: 1, s1: 1.4, colors: [0x6aa83a], size: 0.6 });
    for (let k = 0; k < 4; k++) D.model('canary_house', { u: 0.5 + k * 0.05, side: k % 2 ? 1 : -1, dist: 8 }, { opts: { color: [0xd8a26a, 0xc8925a][k % 2], w: 6, d: 6, floors: 1, roof: 'tile' } });
    for (const [u, side] of [[0.08, 1], [0.46, -1], [0.7, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'krabbelkaefer']);
  },
};
