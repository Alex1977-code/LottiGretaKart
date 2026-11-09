// Strecke: Wolkenstraße – Archetyp Himmelsstrecke aus Mario Kart 8 Deluxe (eigene Gestaltung): hoch über dem Meer
// auf Wolkenwegen, mit dem Gleiter hinüber zur riesigen Bohnenranke (Anti-Gravitation den Hang hinauf), über das
// Deck der Luftschiff-Werft und durch die Gewitterwolken (ohne Leitplanken – wer fällt, wird zurückgeholt).
// Heller Himmel, im Gewitter dunkle Wolken mit Blitzen. Farben: Wolkenweiß, Himmelblau, Rankengrün, Messing.

const L = 60;   // Höhe der Wolkenwege über dem Meer
const pts = [
  // Wolken-Platz und Wolkenweg ostwärts
  [-160, 80], [-70, 86], [20, 80], [100, 60],
  // Gleiter hinüber zur Bohnenranke (keine Fahrbahn)
  [150, 18],
  // die Bohnenranke hinauf (Anti-Gravitation)
  [172, -32], [150, -82],
  // Deck der Luftschiff-Werft
  [90, -112], [10, -120], [-60, -110],
  // durch die Gewitterwolken
  [-120, -80], [-170, -40], [-200, 10], [-190, 55],
];

export default {
  id: 'wolkenstrasse',
  name: 'Wolkenstraße',
  short: 'Wolken',
  theme: 'skyway',
  music: 'course_star',
  banner: 'WOLKENSTRASSE',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 3,
  seed: 1007,
  bridgePillars: false,
  ctrl: pts.map(([x, z]) => [x, z, 8, L]),
  heights: [0, 0, 0, 3, 0, -12, -2, 10, 12, 12, 10, 6, 2, 0],
  antigrav: [[5.2, 7.2, 30]],
  glides: [{ c: 3.35, w: 13 }],
  flights: [[3.55, 4.65]],
  noWalls: [[9.6, 12.4]],
  land: { sea: true, island: { cx: 0, cz: 600, rx: 10, rz: 10 }, noWater: true, backdrop: false },
  items: [0.1, 0.4, 0.6, 0.86],
  boosts: [[0.18, 0], [0.4, 0.3], [0.62, 0], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.44, 0.5, 0, 0, 6], [0.66, 0.7, 0.3, -0.3, 5], [0.88, 0.92, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.38, lat: 0.35 },
    { kind: 'spinpost', u: 0.43, lat: -0.35 },
    { kind: 'brummer', u: 0.12, model: 'flatterkaefer', speed: 5 },
    { kind: 'brummer', u: 0.7, model: 'flatterkaefer', speed: 6 },
  ],
  scenery(D) {
    const tr = D.track;
    const at = (c, lat, y) => { const p = tr.pointAt(tr.uCtrl(c), lat); return { x: p.x, z: p.z, y: p.y + y }; };
    const put = (name, c, lat, y, o = {}) => { const p = at(c, lat, y); const e = D.model(name, { x: p.x, z: p.z }, { ...o, always: true }); e.model.root.position.y = p.y; return e; };
    // Wolkenmeer tief unter den Wegen, Wolken neben den Wegen
    for (let k = 0; k < 70; k++) { const a = k * 2.399, r = 40 + (k % 10) * 32; const e = D.model('cloud_puff', { x: tr.ox + Math.cos(a) * r, z: tr.oz + Math.sin(a) * r }, { scale: 2.6 + (k % 3), always: true }); e.model.root.position.y = 12 + (k % 5) * 4; }
    for (let k = 0; k < 28; k++) put('cloud_puff', k * 0.5, (k % 2 ? 1 : -1) * (16 + (k % 3) * 8), -8 - (k % 4) * 3, { scale: 1 + (k % 3) * 0.4 });
    for (let k = 0; k < 6; k++) put('cloud_puff', 10 + k * 0.45, (k % 2 ? 1 : -1) * 18, -2 + (k % 2) * 6, { opts: { dark: true, r: 12 } });
    // Bohnenranke und Luftschiffe
    for (const c of [5.3, 5.9, 6.5]) put('beanstalk', c, 14, -30, { opts: { height: 60 }, scale: 1.6 });
    for (const [c, lat, col] of [[7.6, 22, 0xe8392d], [8.6, -24, 0x1e6cff], [9.4, 26, 0xffc21a]]) put('airship', c, lat, -4, { opts: { color: col }, scale: 1.2 });
    put('airship', 2, -60, 20, { opts: { color: 0x4fb833 }, scale: 1.5 });
    for (const [c, side] of [[0.6, 1], [5.6, -1], [8.4, 1]]) { const p = at(c, side * 6, 3.4); const e = D.model('question_block', { x: p.x, z: p.z }, { tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); }, scale: 1.4 }); e.model.root.position.y = p.y; }
  },
};
