// Strecke: Nachtautobahn – Archetyp Stadtautobahn bei Nacht aus Mario Kart 8 Deluxe (eigene Gestaltung): breite
// Autobahn durch die beleuchtete Stadt, Lastwagen, Autos und Busse fahren mit; über die Rampe hinauf auf das
// Autobahnkreuz – die hohe Brücke wird zur Anti-Gravitations-Steilkurve (Spin-Pfosten) –, wieder hinunter durch
// den Tunnel und zurück. Schilderbrücken, Laternen, Hochhäuser mit leuchtenden Fenstern, nasser Asphalt.
// Farben: Nachtblau, Laternen-Orange, Neon-Pink und Cyan.

export default {
  id: 'nachtautobahn',
  name: 'Nachtautobahn',
  short: 'Autobahn',
  theme: 'nightcity',
  music: 'course_boss',
  banner: 'NACHTAUTOBAHN',
  time: 'night',
  weather: 'sun',
  hw: 10.5,
  margin: 4.5,
  seed: 1093,
  // [x, z, halbe Breite?, Brückenhöhe?]
  ctrl: [
    // Stadtautobahn ostwärts
    [-170, 70], [-80, 96], [20, 96], [110, 80],
    // Rampe hinauf auf das Autobahnkreuz, Anti-Grav-Steilkurve auf der Brücke
    [170, 40, 10.5, 4], [190, -20, 10.5, 9], [165, -85, 10.5, 12], [100, -120, 10.5, 12],
    // westwärts über die Hochstraße und hinunter
    [20, -125, 10.5, 10], [-60, -118, 10.5, 6], [-125, -90, 10.5, 2],
    // Tunnel, zurück auf die Stadtautobahn
    [-170, -40], [-190, 15],
  ],
  antigrav: [[4.4, 7.6, 30]],
  items: [0.1, 0.36, 0.6, 0.86],
  boosts: [[0.06, 0], [0.28, 0.35], [0.66, 0], [0.92, -0.35]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.23, 0.4, -0.4, 5], [0.48, 0.52, 0, 0, 6], [0.7, 0.74, -0.3, 0.3, 6], [0.93, 0.96, 0.3, -0.3, 4]],
  land: {
    flats: [{ x: 0, z: 0, r: 260, h: 2 }],
    hills: [[-280, -200, 120, 26], [280, -200, 120, 30], [0, -320, 150, 34], [-280, 220, 120, 22], [280, 220, 120, 26]],
  },
  hazards: [
    { kind: 'traffic', u: 0.08, lane: -6.5, speed: 12, model: 'truck', length: 10, opts: { color: 0x2a5ae8 } },
    { kind: 'traffic', u: 0.18, lane: 6.5, speed: 13, opts: { taxi: true } },
    { kind: 'traffic', u: 0.3, lane: -2.5, speed: 14, opts: { color: 0xffffff } },
    { kind: 'traffic', u: 0.42, lane: 6.5, speed: 11, model: 'truck', length: 10, opts: { color: 0xe8392d, trailer: 0xffc21a } },
    { kind: 'traffic', u: 0.55, lane: -6.5, speed: 13, opts: { color: 0x3aa84a } },
    { kind: 'traffic', u: 0.68, lane: 2.5, speed: 12, model: 'truck', length: 10, opts: { color: 0x3a3a44 } },
    { kind: 'traffic', u: 0.8, lane: -6.5, speed: 14, opts: { taxi: true } },
    { kind: 'traffic', u: 0.92, lane: 6.5, speed: 13, opts: { color: 0x2a7ad8 } },
    { kind: 'spinpost', u: 0.45, lat: 0.3 },
    { kind: 'spinpost', u: 0.52, lat: -0.3 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const th = D.theme;
    const u = (c) => tr.uCtrl(c);
    D.city(th.city, th.cityWindow, 0, 90);
    for (const [x, z, h, edge] of [[-40, 0, 80, 0xff3a8a], [70, -20, 66, 0x3ad8ff], [-120, 10, 58, 0xb06aff], [120, 20, 54, 0xffd23a]]) D.model('neon_tower', W(x, z), { opts: { h, color: 0x1e1a34, edge }, always: true });
    const signs = [['AUTOHOF', '#ffd23a'], ['MOTEL', '#ff3a8a'], ['NACHTCAFÉ', '#3ad8ff'], ['KINO', '#b06aff'], ['TANKEN', '#3aff8a'], ['PIZZA', '#ff8a3a']];
    signs.forEach(([text, color], k) => D.model('neon_sign', { u: (k + 0.4) / signs.length, side: k % 2 ? -1 : 1, dist: 5 }, { opts: { text, color }, face: 'track', scale: 1.2 }));
    const gw = (uu) => 2 * (tr.wallAt(Math.round(uu * tr.N)) + 0.6);
    D.model('highway_sign', { u: 0.04, lat: 0 }, { opts: { width: gw(0.04), signs: [['KREUZ', '↑ 2 km'], ['CITY', '→ Ring']] }, face: 'along' });
    D.model('highway_sign', { u: 0.24, lat: 0 }, { opts: { width: gw(0.24), signs: [['HAFEN', '↗ Ausfahrt'], ['KREUZ', '↑ 500 m']] }, face: 'along' });
    D.model('highway_sign', { u: u(9.2), lat: 0 }, { opts: { width: gw(u(9.2)), signs: [['TUNNEL', '↓'], ['ZIEL', '← 1 km']] }, face: 'along' });
    const tw = 2 * (tr.wallAt(Math.round(u(11.4) * tr.N)) + 1.2);
    D.model('road_tunnel', { u: u(11.4), lat: 0 }, { opts: { length: 50, width: tw, text: 'STADTTUNNEL' }, face: 'along' });
    for (let k = 0; k < 24; k++) D.model('street_lamp', { u: k / 24 + 0.01, side: k % 2 ? 1 : -1, dist: 0.8 }, { face: 'track' });
    D.model('gas_station', W(-60, 140), { yaw: Math.PI, always: true });
    D.model('police_heli', W(0, 0), { scale: 1.2, always: true, tick: (e, dt, t) => { const a = t * 0.16 + e.t; e.model.root.position.set(tr.ox + Math.cos(a) * 110, 38, tr.oz + Math.sin(a) * 80); e.model.root.rotation.set(0.08, -a - Math.PI / 2, 0.1); e.model.update(dt, 'idle'); } });
    for (const [uu, side] of [[0.14, 1], [0.5, -1], [0.82, 1]]) D.model('question_block', { u: uu, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
  },
};
