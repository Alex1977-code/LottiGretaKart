// Strecke: Uhrwerk – Archetyp Uhrturm von innen aus Mario Kart 8 Deluxe (eigene Gestaltung): im Inneren einer
// riesigen Uhr zwischen sich drehenden Zahnrädern, an den Zifferblättern mit laufenden Zeigern vorbei, die
// Anti-Gravitations-Wand an der Uhrwand hinauf, über die Messingbrücke und mit dem Gleiter hinab. Stampfende
// Gewichte krachen auf die Bahn. Warmes Licht. Farben: Messing, dunkles Holz, Zifferblatt-Creme.

export default {
  id: 'uhrwerk',
  name: 'Uhrwerk',
  short: 'Uhrwerk',
  theme: 'clockwork',
  music: 'course_boss',
  banner: 'UHRWERK',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1279,
  ctrl: [
    [-150, 70], [-60, 85], [30, 80], [100, 55],
    // Anti-Grav-Wand an der Uhrwand hinauf
    [145, 5], [140, -55], [90, -95],
    // Messingbrücke, Gleitflug
    [20, -110, 7.5, 4], [-40, -95],
    [-100, -55], [-160, -65], [-200, -15], [-185, 40],
  ],
  heights: [3, 3, 3, 4, 7, 11, 14, 14, 3, 3, 3, 3, 3],
  antigrav: [[3.6, 6.6, 40]],
  glides: [{ c: 7.25, w: 12 }],
  flights: [[7.45, 8.05]],
  land: {
    flats: [{ x: -20, z: 0, r: 280, h: 3 }],
    backdrop: false,
  },
  items: [0.1, 0.36, 0.64, 0.86],
  boosts: [[0.2, 0], [0.38, 0.3], [0.48, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0, 0, 5], [0.46, 0.5, 0, 0, 6], [0.78, 0.82, 0.3, -0.3, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'stampfstein', u: 0.12, lat: -0.4 },
    { kind: 'stampfstein', u: 0.14, lat: 0.4 },
    { kind: 'stampfstein', u: 0.8, lat: 0 },
    { kind: 'spinpost', u: 0.38, lat: 0.35 },
    { kind: 'spinpost', u: 0.44, lat: -0.35 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    D.ceiling = true;
    D.ceilingY = 40;
    const cols = [0xc8a03a, 0xa8884a, 0xd8b04a, 0x8a7a5a];
    for (let k = 0; k < 26; k++) D.model('gear', { u: k / 26 + 0.01, side: k % 2 ? 1 : -1, dist: 6 + (k % 4) * 6 }, { opts: { r: 4 + (k % 4) * 2.5, color: cols[k % 4], speed: (k % 2 ? 1 : -1) * (0.3 + (k % 3) * 0.2) }, face: 'track', y: -1 });
    for (const [x, z, r] of [[0, 0, 20], [-120, 10, 14], [100, -20, 16], [0, 160, 24], [-240, -60, 18], [240, -40, 18]]) D.model('gear', W(x, z), { opts: { r, color: cols[Math.abs(x) % 4], speed: 0.15 }, yaw: x * 0.01, always: true });
    for (const [x, z, r, yaw] of [[-40, 150, 22, -Math.PI / 2], [200, -100, 18, Math.PI], [-60, -170, 18, Math.PI / 2]]) D.model('clock_face', W(x, z), { opts: { r }, yaw, y: r + 4, always: true });
    for (let k = 0; k < 12; k++) D.model('lantern', { u: k / 12 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { state: 'on', scale: 1.3 });
    for (const [uu, side] of [[0.18, -1], [0.55, 1], [0.84, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
