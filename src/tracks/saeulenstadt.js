// Strecke: Säulenstadt – Archetyp antike Stadt aus Mario Kart 8 Deluxe (eigene Gestaltung): über die gepflasterte
// Säulenallee, den Hügel hinauf zum weißen Tempel mit Blick über das Meer, an der riesigen Arena vorbei und
// zwischen Olivenbäumen und Zypressen zurück. Strahlende Sonne. Farben: Marmorweiß, Terrakotta, Olivgrün, Ägäisblau.

export default {
  id: 'saeulenstadt',
  name: 'Säulenstadt',
  short: 'Antike',
  theme: 'ancient',
  music: 'course_arena',
  banner: 'SÄULENSTADT',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1531,
  ctrl: [
    // Säulenallee
    [-160, 70], [-70, 90], [20, 90], [100, 70],
    // den Tempelhügel hinauf
    [150, 20], [150, -40], [100, -90],
    // hinab an der Arena vorbei
    [30, -100], [-40, -80], [-100, -100], [-160, -60], [-195, 0],
  ],
  heights: [3, 3, 3, 4, 8, 13, 15, 12, 7, 5, 4, 3],
  bumps: [[8.3, 9.8, 0.9, 18]],
  land: {
    sea: true,
    island: { cx: -20, cz: -20, rx: 330, rz: 230 },
    hills: [[150, -90, 80, 14], [-260, -150, 100, 24], [40, -230, 120, 26]],
  },
  items: [0.12, 0.38, 0.62, 0.86],
  boosts: [[0.1, 0], [0.47, 0.3], [0.7, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.28, 0.32, 0.3, -0.3, 5], [0.52, 0.56, 0, 0, 6], [0.76, 0.8, 0.4, 0.4, 5], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'roller', u: 0.4, style: 'rock', color: 0xe8e0d0, size: 1.6, speed: 5 },
    { kind: 'pillar', u: 0.66, lat: 0.4, model: 'temple_pillar', r: 1.4, opts: { h: 8, broken: true } },
    { kind: 'pillar', u: 0.7, lat: -0.4, model: 'temple_pillar', r: 1.4, opts: { h: 6, broken: true } },
    { kind: 'walker', u: 0.15, model: 'pilzling', speed: 2.4, scale: 1.5, radius: 0.6 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    for (let k = 0; k < 40; k++) D.model('temple_pillar', { u: Math.floor(k / 2) / 20 * 0.3 + 0.005, side: k % 2 ? 1 : -1, dist: 2.2 }, { opts: { h: 9 }, face: 'track' });
    D.model('ancient_temple', W(175, -60), { yaw: Math.PI / 2, scale: 1.2, always: true });
    D.model('colosseum', W(-60, -10), { always: true });
    for (let k = 0; k < 10; k++) D.model('temple_pillar', { u: 0.5 + k * 0.03, side: k % 2 ? 1 : -1, dist: 10 + (k % 3) * 4 }, { opts: { h: 6 + (k % 3) * 2, broken: true } });
    D.scatter('pineTree', 70, { dist0: 4, dist1: 45, s0: 0.9, s1: 1.4, colors: [0x2f5a32, 0x3a6a3a], size: 2 });
    D.scatter('roundTree', 80, { dist0: 4, dist1: 45, s0: 0.9, s1: 1.3, colors: [0x8a9a5a, 0x7a8a4a], size: 2 });
    D.scatter('rock', 40, { dist0: 3, dist1: 30, s0: 0.8, s1: 2, colors: [0xe8e0d0, 0xd8d0c0], size: 2 });
    D.scatter('flower', 80, { dist0: 2, dist1: 30, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffffff, 0xb07aff], size: 0.3 });
    for (const [uu, side] of [[0.14, -1], [0.5, 1], [0.82, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling']);
  },
};
