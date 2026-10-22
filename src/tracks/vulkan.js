// Strecke 10: Feuerberg – am Vulkan im Südwesten: schwarzer Basalt, glühende Lava-Seen (wer hineinfährt, wird vom
// Kobold zurückgesetzt), Feuer-Geysire brechen auf der Fahrbahn aus (roter Ring = Warnung), Stampfsteine.

export default {
  id: 'vulkan',
  name: 'Feuerberg',
  short: 'Vulkan',
  theme: 'volcano',
  music: 'course_boss',
  banner: 'FEUERBERG',
  hw: 7,
  margin: 5,
  seed: 103,
  ctrl: [
    [0, 0], [50, 0], [95, 12, 7.5], [118, 45], [105, 80], [70, 92, 6.5], [38, 78], [20, 50, 6.5], [-8, 40],
    [-30, 60], [-50, 92, 7], [-90, 96], [-118, 64], [-112, 24], [-80, 4], [-40, 0],
  ],
  // Lava-Seen im Innenfeld (Weltkoordinaten werden beim Einbau verschoben)
  lava: [[52, 46, 15], [-72, 52, 17]],
  items: [0.08, 0.32, 0.58, 0.84],
  boosts: [[0.2, 0], [0.46, -0.35], [0.72, 0.35]],
  ramps: [[0.62, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.26, 0.29, 0.4, 0.4, 4], [0.5, 0.53, 0, 0, 5], [0.77, 0.8, -0.4, -0.4, 4]],
  hazards: [
    { kind: 'geyser', u: 0.12, lat: -0.35, every: 3.2 },
    { kind: 'geyser', u: 0.13, lat: 0.4, every: 3.6 },
    { kind: 'geyser', u: 0.4, lat: 0, every: 2.8 },
    { kind: 'geyser', u: 0.66, lat: 0.35, every: 3.4 },
    { kind: 'geyser', u: 0.9, lat: -0.3, every: 3.0 },
    { kind: 'stampfstein', u: 0.55, lat: -0.42 },
    { kind: 'stampfstein', u: 0.552, lat: 0.42 },
  ],
  scenery(D) {
    D.scatter('rock', 110, { dist0: 1, dist1: 60, s0: 1, s1: 3.4, colors: [0x2e2830, 0x3a3238, 0x4a3a3a], size: 1.6 });
    D.scatter('crystal', 40, { dist0: 1, dist1: 30, s0: 0.8, s1: 2, colors: [0xff6a1a, 0xff9a2a, 0xffc040], size: 1 });
    D.scatter('pineTree', 30, { dist0: 6, dist1: 60, s0: 0.9, s1: 1.4, colors: [0x2a2420, 0x34281e], size: 2 });
    D.scatter('pebble', 80, { dist0: 0.5, dist1: 20, s0: 1, s1: 2, colors: [0x2a2228, 0x3a3034], size: 0.4 });
    for (const [u, side] of [[0.25, 1], [0.75, -1]]) D.model('bomb_cannon', { u, side, dist: 5 }, { state: 'idle', scale: 1.3 });
    for (const [u, side] of [[0.06, 1], [0.34, -1], [0.6, 1], [0.86, -1]]) D.model('lantern', { u, side, dist: 1 }, { state: 'on', scale: 1.4 });
    D.model('wuehler', { u: 0.45, side: 1, dist: 3 }, { opts: { ground: 'earth' }, state: 'idle', scale: 1.5 });
    D.crowd(0.96, -1, ['kickbombe', 'wuehler', 'kickbombe', 'pilzling'], { scale: 1.2 });
  },
};
