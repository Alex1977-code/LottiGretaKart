// Strecke 3: Laternengrotte – dunkle Höhle, warme Laternen, leuchtende Kristalle und Tropfsteine.
// Stampfsteine krachen von der Decke, wenn ein Kart darunter durchfährt.

export default {
  id: 'laternengrotte',
  name: 'Laternengrotte',
  short: 'Grotte',
  theme: 'cave',
  music: 'course_cave',
  hw: 6.5,
  margin: 4,
  seed: 31,
  enclosed: 0.9,
  terrainPad: 60,
  ctrl: [
    [0, 0], [50, 0], [92, -10], [116, -42, 7], [104, -78], [68, -88, 6], [42, -66], [20, -40, 6], [-10, -32],
    [-36, -56, 7], [-42, -96], [-78, -118], [-118, -104, 7.5], [-128, -62], [-102, -26], [-58, -4],
  ],
  hills: [[60, 50, 30, 3], [-90, 70, 30, 2]],
  items: [0.1, 0.33, 0.58, 0.82],
  boosts: [[0.25, -0.35], [0.47, 0.35], [0.72, 0]],
  ramps: [],
  coins: [[0.04, 0.08, 0, 0, 5], [0.2, 0.22, -0.4, 0.4, 4], [0.4, 0.44, 0.5, 0.5, 5], [0.66, 0.7, -0.45, -0.45, 5], [0.9, 0.93, 0.3, -0.3, 4]],
  hazards: [
    { kind: 'stampfstein', u: 0.15, lat: -0.42 },
    { kind: 'stampfstein', u: 0.152, lat: 0.42 },
    { kind: 'stampfstein', u: 0.54, lat: 0 },
    { kind: 'stampfstein', u: 0.77, lat: -0.45 },
    { kind: 'stampfstein', u: 0.79, lat: 0.45 },
  ],
  scenery(D) {
    const th = D.theme;
    D.scatter('rock', 90, { dist0: 0.5, dist1: 30, s0: 1.2, s1: 3.2, colors: [0x5a4e60, 0x6a5e70, 0x4e4456], size: 1.5 });
    D.scatter('crystal', 50, { dist0: 1, dist1: 26, s0: 0.8, s1: 2.0, colors: [0x3ae0d0, 0xb47fe6, 0x58b8ff, 0xff6fa8], size: 1 });
    D.scatter('mushroom', 14, { dist0: 2, dist1: 24, s0: 0.5, s1: 0.9, colors: [0x58b8ff, 0xb47fe6], size: 2 });
    // Tropfsteine an der Decke über der Strecke (Decke ≈ 14 m)
    for (let i = 0; i < 70; i++) {
      const u = i / 70 + 0.004;
      const p = D.track.pointAt(u, (D.r() * 2 - 1) * (D.track.hw[0] + 8));
      D.add('stalactite', p.x, p.y + 13 + D.r() * 3, p.z, 0.8 + D.r() * 1.2, 0x5a4e60, D.r() * 6);
    }
    // Decke: große dunkle Kuppel
    D.ceiling = true;
    // Laternen mit echtem Licht (wenige, für die Leistung)
    const ll = th.lanternLight;
    const lamps = [0.02, 0.12, 0.24, 0.36, 0.48, 0.6, 0.72, 0.86];
    lamps.forEach((u, k) => {
      const side = k % 2 ? 1 : -1;
      const e = D.model('lantern', { u, side, dist: 0.8 }, { state: 'on', scale: 1.3 });
      const p = e.model.root.position;
      D.light(p.x, p.y + 3, p.z, ll.color, ll.intensity, ll.distance);
    });
    D.model('lantern', { u: 0.3, side: 1, dist: 1 }, { opts: { hanging: true }, state: 'on', scale: 1.2, y: 4 });
    D.crowd(0.97, 1, ['wuehler', 'fairy_spotter', 'wuehler', 'bunny_small'], { scale: 1.2 });
    D.model('chest', { u: 0.45, side: -1, dist: 3 }, { state: 'open', scale: 1.5 });
    D.model('chest', { u: 0.92, side: 1, dist: 3 }, { state: 'open', scale: 1.5 });
    D.model('crystal_block', { u: 0.65, side: 1, dist: 2.5 }, { state: 'idle', scale: 1.6, y: 0.2 });
    D.model('crystal_block', { u: 0.2, side: -1, dist: 2.5 }, { state: 'idle', scale: 1.6, y: 0.2 });
  },
};
