// Strecke: Bastelinsel – Archetyp Bastel-Welt aus Wolle und Filz aus Mario Kart 8 Deluxe (eigene Gestaltung): Hügel
// aus Filz, Bäume aus Pompons, Blumen aus Knöpfen, Wolken aus Watte; über die Kartonbrücke, die Wollknäuel-Buckel
// und mit dem Gleiter vom Pappberg. Wollknäuel rollen über die Bahn. Farben: Pastellgrün, Rosa, Himmelblau, Karton.

export default {
  id: 'bastelinsel',
  name: 'Bastelinsel',
  short: 'Basteln',
  theme: 'craft',
  music: 'course_diorama',
  banner: 'BASTELINSEL',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1621,
  ctrl: [
    [-150, 80], [-60, 92], [30, 85], [110, 60],
    [160, 10], [150, -50], [100, -95],
    [30, -110], [-30, -80, 8, 4], [-70, -30], [-120, -50], [-180, -40], [-205, 15], [-190, 60],
  ],
  heights: [3, 3, 4, 6, 9, 13, 15, 4, 4, 5, 5, 4, 3, 3],
  bumps: [[0.8, 2.8, 1.2, 14]],
  glides: [{ c: 6.15, w: 12 }],
  flights: [[6.35, 6.95]],
  land: {
    sea: true,
    island: { cx: -20, cz: -10, rx: 300, rz: 220 },
    hills: [[120, -80, 80, 14], [-20, -10, 60, 6], [-200, -160, 90, 22], [60, -220, 100, 24]],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.2, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'roller', u: 0.15, style: 'model', model: 'yarn_ball', opts: { color: 0xff5aa8 }, size: 1.5, speed: 5 },
    { kind: 'roller', u: 0.62, style: 'model', model: 'yarn_ball', opts: { color: 0x5ab8ff }, size: 1.6, speed: 6 },
    { kind: 'roller', u: 0.88, style: 'model', model: 'yarn_ball', opts: { color: 0xffd23a }, size: 1.4, speed: 5 },
    { kind: 'walker', u: 0.35, model: 'kitten', speed: 2, scale: 2, radius: 0.6 },
  ],
  scenery(D) {
    const cols = [0xff8ac8, 0x8ad4ff, 0xffd86a, 0x9af08a, 0xc89aff];
    for (let k = 0; k < 40; k++) D.model('pompom_tree', { u: k / 40 + 0.01, side: k % 2 ? 1 : -1, dist: 6 + (k % 5) * 7 }, { opts: { color: cols[k % 5] }, scale: 1 + (k % 3) * 0.4 });
    for (let k = 0; k < 40; k++) D.model('button_flower', { u: k / 40 + 0.02, side: k % 2 ? -1 : 1, dist: 3 + (k % 4) * 3 }, { opts: { color: cols[(k + 2) % 5] }, scale: 1 + (k % 2) * 0.5 });
    for (let k = 0; k < 10; k++) D.model('cat_box', { u: k / 10 + 0.05, side: k % 2 ? 1 : -1, dist: 22 }, { yaw: k, scale: 0.5 });
    for (let k = 0; k < 16; k++) { const e = D.model('cloud_puff', { u: k / 16, side: k % 2 ? 1 : -1, dist: 50 + (k % 3) * 20 }, { scale: 1.2 }); e.model.root.position.y += 30 + (k % 4) * 6; }
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['kitten', 'bunny_small', 'fairy_spotter']);
  },
};
