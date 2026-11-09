// Strecke: Eisbecher-Himmel – Archetyp Eiscreme-Welt am Himmel aus Mario Kart 8 Deluxe (eigene Gestaltung): hoch über
// den Wolken auf Waffelbrücken zwischen riesigen Eiskugeln, Sahnebergen und Kirschen, an den Rändern ohne
// Leitplanken, mit dem Gleiter über die Schlucht zwischen zwei Eisbechern und die Anti-Grav-Spirale um die
// Sahnetorte. Farben: Erdbeerrosa, Vanille, Pistaziengrün, Schoko, Himmelblau.

const L = 50;   // Höhe der Wege über dem Wolkenmeer
const pts = [
  [-160, 80], [-70, 86], [20, 80], [100, 60],
  [150, 18],
  [172, -32], [150, -82],
  [90, -112], [10, -120], [-60, -110],
  [-120, -80], [-170, -40], [-200, 10], [-190, 55],
];

export default {
  id: 'eisbecher',
  name: 'Eisbecher-Himmel',
  short: 'Eisbecher',
  theme: 'sundae',
  music: 'course_star',
  banner: 'EISBECHER-HIMMEL',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 3,
  seed: 1637,
  bridgePillars: false,
  ctrl: pts.map(([x, z]) => [x, z, 8, L]),
  heights: [0, 0, 2, 4, 0, -8, 0, 6, 8, 8, 6, 3, 1, 0],
  antigrav: [[5.2, 7.2, 30]],
  glides: [{ c: 3.35, w: 13 }],
  flights: [[3.55, 4.65]],
  noWalls: [[8.6, 12.4]],
  land: { sea: true, island: { cx: 0, cz: 600, rx: 10, rz: 10 }, noWater: true, backdrop: false },
  items: [0.1, 0.4, 0.6, 0.86],
  boosts: [[0.18, 0], [0.4, 0.3], [0.62, 0], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.44, 0.5, 0, 0, 6], [0.66, 0.7, 0.3, -0.3, 5], [0.88, 0.92, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.38, lat: 0.35 },
    { kind: 'spinpost', u: 0.43, lat: -0.35 },
    { kind: 'roller', u: 0.7, style: 'gum', color: 0xe8202a, size: 1.4, speed: 5 },
    { kind: 'brummer', u: 0.12, model: 'flatterkaefer', speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const at = (c, lat, y) => { const p = tr.pointAt(tr.uCtrl(c), lat); return { x: p.x, z: p.z, y: p.y + y }; };
    const put = (name, c, lat, y, o = {}) => { const p = at(c, lat, y); const e = D.model(name, { x: p.x, z: p.z }, { ...o, always: true }); e.model.root.position.y = p.y; return e; };
    for (let k = 0; k < 70; k++) { const a = k * 2.399, r = 40 + (k % 10) * 32; const e = D.model('cloud_puff', { x: tr.ox + Math.cos(a) * r, z: tr.oz + Math.sin(a) * r }, { scale: 2.6 + (k % 3), always: true }); e.model.root.position.y = -24 + (k % 5) * 4; }
    const cols = [0xff9ac8, 0xfff0d0, 0xa8e8a0, 0x8a5a32, 0xffd0e8];
    for (let k = 0; k < 18; k++) put('ice_cream', k * 0.75, (k % 2 ? 1 : -1) * (22 + (k % 3) * 10), -26, { opts: { color: cols[k % 5], scoops: 1 + (k % 3) }, scale: 1.4 + (k % 3) * 0.4 });
    put('cake', 6.2, 26, -12, { opts: { tiers: 3, color: 0xffd0e8 }, scale: 3 });
    for (let k = 0; k < 10; k++) put('cherry', k * 1.3 + 0.4, (k % 2 ? -1 : 1) * 14, -2, { scale: 2 });
    for (const [c, side] of [[0.6, 1], [5.6, -1], [8.4, 1]]) { const p = at(c, side * 6, 3.4); const e = D.model('question_block', { x: p.x, z: p.z }, { tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); }, scale: 1.4 }); e.model.root.position.y = p.y; }
  },
};
