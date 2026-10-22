// Strecke 5: Brummbärs Abendautobahn – breite dreispurige Autobahn im Abendrot, Stadt-Silhouette am Horizont,
// Laternen, Schilder. Die Bombenkanonen des Barons feuern Kickbomben auf die Fahrbahn (roter Ring = Einschlag).

export default {
  id: 'autobahn',
  name: 'Brummbärs Abendautobahn',
  short: 'Autobahn',
  theme: 'highway',
  music: 'course_boss',
  banner: 'BRUMMBÄRS AUTOBAHN',
  hw: 9.5,
  margin: 3.5,
  lanes: 3,
  seed: 59,
  ctrl: [
    [0, 0], [80, 0], [160, -8], [230, 10], [270, 56], [262, 112], [216, 146], [150, 150, 10.5], [96, 128],
    [60, 92, 9], [10, 86], [-40, 112], [-100, 140], [-170, 132], [-214, 92], [-216, 36], [-170, 2], [-90, -4],
  ],
  hills: [[150, 160, 50, 8], [-200, 160, 50, 6], [40, 40, 40, 3]],
  items: [0.06, 0.26, 0.46, 0.64, 0.82],
  boosts: [[0.14, -0.55], [0.14, 0.55], [0.38, 0], [0.56, -0.5], [0.73, 0.5], [0.93, 0]],
  ramps: [[0.5, 0, 9]],
  coins: [[0.02, 0.05, -0.6, -0.6, 6], [0.02, 0.05, 0.6, 0.6, 6], [0.2, 0.23, 0, 0, 6], [0.4, 0.43, 0.5, -0.5, 6], [0.68, 0.71, -0.5, 0.5, 6], [0.88, 0.9, 0, 0, 5]],
  hazards: [
    { kind: 'cannon', u: 0.17, side: 1, every: 3.6 },
    { kind: 'cannon', u: 0.34, side: -1, every: 4.0 },
    { kind: 'cannon', u: 0.6, side: 1, every: 3.4 },
    { kind: 'cannon', u: 0.78, side: -1, every: 3.8 },
    { kind: 'walker', u: 0.89, model: 'kickbombe', speed: 1.6, scale: 1.4, radius: 0.6 },
  ],
  scenery(D) {
    const th = D.theme;
    D.city(th.city, th.cityWindow, 120, 80);
    D.scatter('pineTree', 40, { dist0: 4, dist1: 60, s0: 1, s1: 1.6, colors: [0x2a5a4a, 0x2f6a50, 0x3a4a6a], size: 2 });
    D.scatter('bush', 40, { dist0: 1, dist1: 20, s0: 0.8, s1: 1.4, colors: [0x4a7a4a, 0x5a6a8a], size: 1.2 });
    // Laternen an beiden Seiten (Leuchtschein über das Modell, ohne echte Lichter)
    for (let i = 0; i < 26; i++) {
      const u = i / 26 + 0.01;
      D.model('lantern', { u, side: i % 2 ? 1 : -1, dist: 0.8 }, { state: 'on', scale: 1.5 });
    }
    D.model('traffic_light', { u: 0.48, side: 1, dist: 1 }, { scale: 1.2, tick: (e, dt, t) => e.model.update(dt, ['green', 'yellow', 'red'][Math.floor(t / 2) % 3]) });
    D.crowd(0.97, -1, ['kickbombe', 'fairy_spotter', 'kickbombe', 'bunny_small', 'kickbombe'], { scale: 1.2 });
    D.model('bomb_cannon', { u: 0.99, side: 1, dist: 5 }, { state: 'idle', scale: 1.4 });
    D.signs = [[0.1, 'AUSFAHRT BLOCKINSEL', 0x1f8a4c], [0.42, 'BRUMMBÄR-STADT 2 km', 0x2a5fc8], [0.7, 'ACHTUNG KICKBOMBEN!', 0xd8262e]];
  },
};
