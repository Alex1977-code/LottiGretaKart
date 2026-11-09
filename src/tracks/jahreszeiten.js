// Strecke: Jahreszeitendorf – Archetyp Dorf mit wechselnder Jahreszeit aus Mario Kart 8 Deluxe (eigene Gestaltung):
// bei jedem Start eine andere Jahreszeit – Frühling mit Blüten, Sommer in der Sonne, goldener Herbst mit Laub oder
// Winter mit Schnee. Durch das Dorf mit Fachwerkhäusern und Kirche, über die Steinbrücke am Mühlbach, durch Felder
// und den Wald zurück. Farben je Jahreszeit.

export default {
  id: 'jahreszeiten',
  name: 'Jahreszeitendorf',
  short: 'Jahreszeiten',
  theme: 'grass',
  seasons: {
    fruehling: { theme: 'blossom', weather: 'sun' },
    sommer: { theme: 'grass', weather: 'sun' },
    herbst: { theme: 'autumn', weather: 'rain' },
    winter: { theme: 'snow', weather: 'snow' },
  },
  music: 'course_grass',
  banner: 'JAHRESZEITENDORF',
  time: 'day',
  weather: 'sun',
  hw: 7.5,
  margin: 4,
  seed: 1237,
  ctrl: [
    // Dorfstraße
    [-150, 80], [-70, 90], [10, 85], [80, 70],
    // Steinbrücke über den Mühlbach, Felder
    [130, 30, 7.5, 3], [140, -30], [100, -85],
    // Wald
    [30, -110], [-40, -100], [-100, -70], [-160, -60], [-200, -10], [-190, 45],
  ],
  heights: [3, 3, 3, 4, 4, 6, 8, 9, 8, 6, 5, 4, 3],
  // Leveldesign (G5): Felswände als Rahmen, Tunnel durch den Berg, Abkürzung
  cliffs: [{ c: [6, 8], side: 1, h: 14 }],
  tunnels: [{ c: [1.2, 2.2] }],
  land: {
    lakes: [{ x: 160, z: 50, r: 28, depth: 3 }],
    hills: [[-20, -10, 80, 8], [-260, -150, 120, 30], [260, -140, 120, 34], [40, -280, 150, 40], [-230, 220, 120, 24], [230, 210, 120, 26]],
  },
  items: [0.12, 0.36, 0.62, 0.86],
  boosts: [[0.2, 0], [0.45, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.4, model: 'cow', speed: 1.4, scale: 1.6, radius: 1.3 },
    { kind: 'walker', u: 0.75, model: 'rabbit', speed: 2.5, scale: 2.2, radius: 0.6 },
    { kind: 'roller', u: 0.6, size: 1.6, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const season = tr.def.season ?? 'sommer';
    // Dorf: Häuser, Kirche, Brunnen-Platz
    for (let k = 0; k < 12; k++) D.model('canary_house', { u: 0.01 + k * 0.022, side: k % 2 ? 1 : -1, dist: 5 + (k % 3) * 2 }, { opts: { color: [0xfaf0dc, 0xf4d8b8, 0xe8e4f4, 0xf8e8c8][k % 4] }, face: 'track' });
    D.model('canary_church', W(-40, 140), { yaw: -Math.PI / 2, always: true });
    D.model('windmill', W(170, -60), { yaw: 2, scale: 1.2, always: true });
    D.model('barn', W(60, -150), { yaw: 0.4 });
    for (let k = 0; k < 24; k++) D.model('farm_fence', { u: 0.3 + k * 0.012, side: k % 2 ? 1 : -1, dist: 2.2 }, { face: 'along' });
    // Bäume und Boden je Jahreszeit
    const trees = { fruehling: [0xffb8d8, 0xff9ac8, 0xffffff], sommer: [0x4fb833, 0x5cc23c, 0x3f9a2a], herbst: [0xe8892d, 0xd8501e, 0xffc21a], winter: [0xf4f8fc, 0xe2ecf6, 0x2f6a3a] }[season] ?? [0x4fb833];
    D.scatter('roundTree', 140, { dist0: 4, dist1: 55, s0: 1.2, s1: 2, colors: trees, size: 2.2 });
    D.scatter('pineTree', 60, { u0: 0.5, u1: 0.95, dist0: 6, dist1: 50, s0: 1.2, s1: 2, colors: season === 'winter' ? [0xe8f0f8, 0x2f6a3a] : [0x2f7a3a, 0x3a8a42], size: 2.4 });
    if (season === 'winter') D.scatter('snowman', 14, { dist0: 4, dist1: 20, s0: 1.2, s1: 1.6, colors: [0xffffff], size: 1 });
    else if (season === 'fruehling') D.scatter('flower', 220, { dist0: 1, dist1: 35, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0xffffff, 0xb07aff], size: 0.3 });
    else if (season === 'herbst') { D.scatter('mushroom', 40, { dist0: 2, dist1: 25, s0: 0.6, s1: 1.2, colors: [0xe8392d, 0xa8682a], size: 2 }); for (let k = 0; k < 10; k++) D.model('jack_o_lantern', { u: k * 0.1 + 0.03, side: k % 2 ? 1 : -1, dist: 3 }, { scale: 1.2 }); }
    else { D.scatter('flower', 80, { dist0: 1, dist1: 30, s0: 1, s1: 1.4, colors: [0xffd21f, 0xffffff], size: 0.3 }); for (let k = 0; k < 10; k++) D.model('hay_bale', { u: 0.35 + k * 0.03, side: k % 2 ? -1 : 1, dist: 8 }, { yaw: k, scale: 1.3 }); }
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.8, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
