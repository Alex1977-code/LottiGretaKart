// Strecke: Sternenbahn – Archetyp Regenbogenbahn im All aus Mario Kart 8 Deluxe (eigene Gestaltung): eine leuchtende
// Bahn in Regenbogenfarben hoch über der Erde, ohne Leitplanken (wer hinunterfällt, wird zurückgeholt), mit
// Anti-Gravitation an der kreisenden Raumstation, Spin-Pfosten, Turbo-Feldern und einem langen Gleitflug zwischen
// den Bahnen. Ewige Nacht, Sterne, Planeten. Farben: Regenbogen-Neon auf Schwarz-Violett.

const L = 100;   // Höhe der Bahn über dem Meer
const pts = [
  [-170, 90], [-80, 100], [10, 92], [90, 70],
  [150, 30], [180, -30], [160, -90], [100, -130],
  // Gleitflug zur unteren Bahn (keine Fahrbahn)
  [20, -150],
  [-60, -140], [-130, -110], [-190, -60], [-215, 0], [-200, 55],
];

export default {
  id: 'sternenbahn',
  name: 'Sternenbahn',
  short: 'Sterne',
  theme: 'space',
  music: 'course_star',
  banner: 'STERNENBAHN',
  time: 'night',
  weather: 'sun',
  night: true,
  rainbow: true,
  hw: 8,
  margin: 2,
  seed: 1040,
  bridgePillars: false,
  noWalls: true,
  ctrl: pts.map(([x, z]) => [x, z, 8, L]),
  heights: [0, 0, 3, 6, 8, 6, 4, 6, 0, -14, -10, -6, -3, 0],
  antigrav: [[3.5, 6.5, 30]],
  glides: [{ c: 7.25, w: 14 }],
  flights: [[7.45, 8.7]],
  land: { sea: true, island: { cx: 0, cz: 900, rx: 10, rz: 10 }, noWater: true, backdrop: false },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.07, 0], [0.3, -0.3], [0.33, 0.3], [0.7, 0], [0.92, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.22, 0.26, 0.3, -0.3, 5], [0.4, 0.46, 0, 0, 6], [0.72, 0.78, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'spinpost', u: 0.3, lat: 0.4 },
    { kind: 'spinpost', u: 0.38, lat: -0.4 },
    { kind: 'spinpost', u: 0.44, lat: 0.4 },
  ],
  scenery(D) {
    const tr = D.track;
    const at = (c, lat, y) => { const p = tr.pointAt(tr.uCtrl(c), lat); return { x: p.x, z: p.z, y: p.y + y }; };
    const put = (name, c, lat, y, o = {}) => { const p = at(c, lat, y); const e = D.model(name, { x: p.x, z: p.z }, { ...o, always: true }); e.model.root.position.y = p.y; return e; };
    put('space_station', 5, 60, 10, { scale: 1.5 });
    put('planet', 2, -260, 40, { opts: { r: 50, color: 0xd8a060 } });
    put('planet', 10, 300, 120, { opts: { r: 30, color: 0x5a8ae0, ring: false } });
    put('planet', 7, 400, -20, { opts: { r: 70, color: 0xc05aff } });
    for (const [c, side] of [[0.6, 1], [4.6, -1], [10.4, 1]]) { const p = at(c, side * 5, 3.4); const e = D.model('question_block', { x: p.x, z: p.z }, { tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); }, scale: 1.4 }); e.model.root.position.y = p.y; }
  },
};
