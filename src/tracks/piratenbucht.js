// Strecke 13: Piratenbucht – eine Acht an der Südküste: in der Mitte kreuzt sich die Strecke, einmal unten
// durch, einmal oben über die Holzbrücke. In der Lagune ankert das Piratenschiff, am Ufer feuern Piratenkanonen
// Kanonenkugeln auf die Fahrbahn (roter Ring = Einschlag), Pulverfässer rollen quer, Krabben flitzen herum.
// Auf der Schatzinsel: Totenkopf-Felsen, Goldhaufen und Truhen.

export default {
  id: 'piratenbucht',
  name: 'Piratenbucht',
  short: 'Piraten',
  theme: 'pirate',
  music: 'course_diorama',
  banner: 'PIRATENBUCHT',
  hw: 7.5,
  margin: 4.5,
  seed: 149,
  // [x, z, halbe Breite?, Brückenhöhe?] – Acht: bei (0, 0) unten durch, später oben über die Brücke
  ctrl: [
    [-63, -51], [0, 0], [63, 51], [117, 72], [152, 51], [165, 0], [152, -51], [117, -72, 7.5, 3.0], [63, -51, 7.5, 6.5],
    [0, 0, 7.5, 7.5], [-63, 51, 7.5, 6.5], [-117, 72, 7.5, 3.0], [-152, 51], [-165, 0], [-152, -51], [-117, -72],
  ],
  items: [0.1, 0.33, 0.6, 0.85],
  boosts: [[0.04, 0], [0.28, 0.35], [0.5, 0], [0.76, -0.35]],
  ramps: [[0.15, 0, 6]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.24, 0.4, -0.4, 5], [0.46, 0.53, 0, 0, 6], [0.72, 0.75, -0.3, 0.3, 4], [0.9, 0.93, 0.3, -0.3, 4]],
  hazards: [
    // Piratenkanonen am Lagunenufer und an der Schatzinsel schießen Kanonenkugeln auf die Fahrbahn
    // (Ostbogen wird gegen den Uhrzeigersinn gefahren: innen = links/−1; Westbogen im Uhrzeigersinn: innen = +1)
    { kind: 'cannon', u: 0.25, side: -1, dist: 5, model: 'pirate_cannon', shot: 'cannonball', scale: 1.3, every: 4.2 },
    { kind: 'cannon', u: 0.37, side: -1, dist: 5, model: 'pirate_cannon', shot: 'cannonball', scale: 1.3, every: 4.8 },
    { kind: 'cannon', u: 0.82, side: 1, dist: 5, model: 'pirate_cannon', shot: 'cannonball', scale: 1.3, every: 4.5 },
    // rollende Pulverfässer
    { kind: 'roller', u: 0.14, style: 'barrel', size: 1.3, speed: 5 },
    { kind: 'roller', u: 0.88, style: 'barrel', size: 1.3, speed: 6 },
    // Strandkrabben
    { kind: 'walker', u: 0.3, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 3.2, scale: 1.8, radius: 0.6 },
    { kind: 'walker', u: 0.79, model: 'krabbelkaefer', opts: { color: 'red' }, speed: 2.8, scale: 1.8, radius: 0.6 },
    { kind: 'walker', u: 0.95, model: 'krabbelkaefer', opts: { color: 'yellow' }, speed: 3.4, scale: 1.8, radius: 0.6 },
  ],
  scenery(D) {
    D.scatter('palm', 70, { dist0: 2, dist1: 50, s0: 0.9, s1: 1.6, colors: [0x4fb833, 0x5cc23c, 0x3fa02a], size: 1.2 });
    D.scatter('rock', 34, { dist0: 1, dist1: 35, s0: 0.6, s1: 1.6, colors: [0xb8a888, 0xa89878, 0xc8b898], size: 1.2 });
    D.scatter('bush', 30, { dist0: 2, dist1: 30, s0: 0.6, s1: 1.1, colors: [0x6ab83a, 0x7ac84a], size: 1.2 });
    D.scatter('starfish', 50, { dist0: 0.5, dist1: 16, s0: 0.8, s1: 1.4, colors: [0xff8a5a, 0xffc21a, 0xff6fa8], size: 0.4 });
    const tr = D.track;
    const at = (u, lat) => tr.pointAt(u, lat);
    void at;
    // Lagune mit dem Piratenschiff (Innenfeld des östlichen Bogens; die Lagune selbst steht in worldDef.lakes)
    {
      const x = tr.ox + 108, z = tr.oz;
      const ship = D.model('pirate_ship', { x, z }, { yaw: 0.6, scale: 0.85, state: 'idle' });
      ship.model.root.position.y = 0;
      let n = 0;
      ship.tick = (e, dt, t) => {
        const ph = (t + e.t) % 7;
        if (ph < dt * 1.5) n++;
        e.model.update(dt, { anim: 'fire', side: 1, n });
      };
    }
    // Schatzinsel mit Totenkopf-Felsen (Innenfeld des westlichen Bogens)
    {
      const x = tr.ox - 122, z = tr.oz;
      D.model('skull_rock', { x, z }, { yaw: 0, scale: 1.0 });
      for (let k = 0; k < 5; k++) {
        const a = k * 1.25 + 0.4;
        D.model(k % 2 ? 'treasure_pile' : 'chest', { x: x + 11 + Math.cos(a) * 5, z: z + Math.sin(a) * 6 }, { yaw: a, scale: k % 2 ? 1.2 : 1.6, state: k === 0 ? 'open' : 'closed' });
      }
      D.model('pirate_flag', { x: x + 4, z: z - 9 }, { scale: 1.4 });
      D.model('pirate_flag', { x: x + 4, z: z + 9 }, { scale: 1.4 });
    }
    // Piratenflaggen, Fässer und Kanonen-Deko am Rand
    // (nicht neben die Brücke u ≈ 0,43–0,74 stellen: dort ist unten kein Rand)
    for (const [u, side] of [[0.03, 1], [0.03, -1], [0.18, 1], [0.35, 1], [0.8, -1], [0.92, 1]]) D.model('pirate_flag', { u, side, dist: 1.5 }, { scale: 1.2 });
    for (const [u, side] of [[0.07, -1], [0.22, 1], [0.4, 1], [0.78, -1], [0.88, 1], [0.97, -1]]) {
      for (let k = 0; k < 3; k++) D.model('barrel', { u: u + k * 0.003, side, dist: 1.2 + (k % 2) * 1.1 }, { scale: 1.1 + (k % 2) * 0.2, yaw: k });
    }
    // Leuchtturm und Stege an der Küste (außen, Süden)
    D.model('lighthouse', { u: 0.2, side: 1, dist: 18 }, { scale: 1.2 });
    D.model('dock', { u: 0.22, side: 1, dist: 4 }, { opts: { length: 14 }, face: 'track' });
    D.model('dock', { u: 0.765, side: -1, dist: 4 }, { opts: { length: 12 }, face: 'track' });
    for (const [u, side] of [[0.12, 1], [0.4, -1], [0.9, 1], [0.86, -1]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
    D.crowd(0.975, 1, ['krabbelkaefer', 'fairy_spotter', 'bunny_small', 'fairy_spotter', 'pilzling']);
  },
};
