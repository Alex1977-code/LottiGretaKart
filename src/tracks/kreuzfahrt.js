// Strecke: Kreuzfahrtschiff – Archetyp Kreuzfahrtschiff aus Mario Kart 8 Deluxe (eigene Gestaltung): Start auf der
// Hafenpromenade, über die Gangway hinauf aufs Oberdeck des riesigen Schiffs – zwischen Pool, Liegestühlen und
// Schornstein entlang –, am Heck die Rampe hinunter ins Meer und unter Wasser zurück zum Hafen. Sonniger Tag.
// Farben: Schiffsweiß, Meerblau, Rettungsring-Rot, Holzdeck.

export default {
  id: 'kreuzfahrt',
  name: 'Kreuzfahrtschiff',
  short: 'Schiff',
  theme: 'cruise',
  music: 'course_river',
  banner: 'KREUZFAHRTSCHIFF',
  time: 'day',
  weather: 'sun',
  hw: 8,
  margin: 4,
  seed: 1433,
  bridgePillars: false,
  ctrl: [
    // Hafenpromenade
    [-160, 90], [-70, 100], [20, 95],
    // Gangway hinauf, Oberdeck
    [80, 70, 8, 6], [130, 20, 8, 10.5], [140, -40, 8, 10.5], [140, -100, 8, 10.5],
    // Rampe hinunter, unter Wasser zurück
    [100, -150, 8, 5], [30, -150], [-40, -125], [-110, -90], [-170, -30], [-190, 40],
  ],
  heights: [2, 2, 2, 2, 2, 2, 2, 1, -5, -9, -6, 0.5, 2],
  land: {
    sea: true,
    island: { cx: -80, cz: 150, rx: 240, rz: 70 },
    hills: [[-150, 200, 80, 16], [30, 200, 80, 12]],
  },
  items: [0.1, 0.34, 0.62, 0.86],
  boosts: [[0.2, 0], [0.4, 0.3], [0.62, -0.3], [0.95, 0]],
  coins: [[0.03, 0.07, -0.4, 0.4, 6], [0.3, 0.34, 0, 0, 5], [0.42, 0.46, 0.3, -0.3, 5], [0.72, 0.78, 0, 0, 6], [0.9, 0.93, 0, 0, 4]],
  hazards: [
    { kind: 'walker', u: 0.38, model: 'crab', speed: 2.6, scale: 1.6, radius: 0.8 },
    { kind: 'roller', u: 0.44, style: 'model', model: 'beach_ball', size: 1.4, speed: 5 },
    { kind: 'walker', u: 0.72, model: 'jellyfish', speed: 1.3, scale: 1.5, radius: 1.0, anim: 'swim' },
    { kind: 'walker', u: 0.78, model: 'jellyfish', opts: { color: 'pink' }, speed: 1.1, scale: 1.4, radius: 0.9, anim: 'swim' },
  ],
  scenery(D) {
    const tr = D.track;
    const u = (c) => tr.uCtrl(c);
    // Schiffsrumpf unter dem Oberdeck (Deck ≈ 12 m über dem Meer)
    const a = tr.pointAt(u(4), 0), b = tr.pointAt(u(6), 0);
    const hull = D.model('ship_hull', { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }, { opts: { length: 190 }, yaw: Math.atan2(-(b.z - a.z), b.x - a.x), always: true });
    hull.model.root.position.y = -1.6;
    for (let k = 0; k < 10; k++) { const p = tr.pointAt(u(4.2) + k * 0.012, (k % 2 ? 1 : -1) * 12); const e = D.model('deck_chair', { x: p.x, z: p.z }, { yaw: k }); e.model.root.position.y = p.y; }
    for (let k = 0; k < 6; k++) { const p = tr.pointAt(u(4.3) + k * 0.02, (k % 2 ? -1 : 1) * 14); const e = D.model('cafe_set', { x: p.x, z: p.z }, { opts: { color: 0x3a8ae8 } }); e.model.root.position.y = p.y; }
    // Hafen: Kaimauer, Kräne, Container, Leuchtturm
    D.model('harbor_crane', { u: 0.08, side: -1, dist: 12 }, { face: 'track', always: true });
    D.model('container_stack', { u: 0.14, side: -1, dist: 10 }, { face: 'track' });
    D.model('lighthouse', { u: 0.98, side: -1, dist: 20 }, { always: true });
    for (let k = 0; k < 8; k++) D.model('bollard', { u: 0.01 + k * 0.02, side: 1, dist: 1.2 }, {});
    D.model('ferry', { u: 0.5, side: 1, dist: 90 }, { face: 'track' });
    // unter Wasser
    const u0 = u(8), u1 = u(11.4);
    for (let k = 0; k < 14; k++) D.model(['coral_branch', 'coral_fan', 'giant_clam', 'kelp', 'coral_brain', 'anemone', 'sea_star'][k % 7], { u: u0 + (u1 - u0) * (k + 0.5) / 14, side: k % 2 ? 1 : -1, dist: 3 + (k % 3) * 4 }, { scale: 1.3 });
    for (const t of [0.3, 0.6]) D.model('fish_school', { u: u0 + (u1 - u0) * t, side: 1, dist: 6 }, { y: 3, scale: 1.4 });
    D.model('submarine', { u: u0 + (u1 - u0) * 0.5, side: -1, dist: 18 }, { y: 4, face: 'track' });
    D.scatter('palm', 30, { u0: 0, u1: 0.15, side: -1, dist0: 4, dist1: 30, s0: 1.1, s1: 1.5, colors: [0x3fa02a], size: 1.2 });
    for (const [uu, side] of [[0.1, -1], [0.55, 1], [0.84, -1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling']);
  },
};
