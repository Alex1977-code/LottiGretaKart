// Strecke 19: Palmen-City – Großstadt auf der Palmeninsel im Osten, im Sonnenuntergang. Breite Straßen zwischen
// Hochhäusern mit Neonlicht, eine Acht mit Stadtautobahn-Brücke über die Kreuzung. Verfolgungsjagd: Polizeiautos mit
// Blaulicht und der Stadtverkehr kreuzen die Fahrbahn, der Polizeihubschrauber kreist mit dem Suchscheinwerfer,
// an der Tankstelle und an Absperrungen vorbei, über die Sprungschanze.

export default {
  id: 'palmencity',
  name: 'Palmen-City',
  short: 'City',
  theme: 'city',
  music: 'course_diorama',
  banner: 'PALMEN-CITY',
  hw: 9,
  margin: 4.5,
  seed: 223,
  // Acht: bei (0, 0) unten durch, später oben über die Stadtautobahn-Brücke. Ostschleife gegen den Uhrzeigersinn
  // (innen = links/−1), Westschleife im Uhrzeigersinn (innen = rechts/+1)
  ctrl: [
    [-54, -67], [0, 0], [54, 67], [99, 95], [129, 67], [140, 0], [129, -67], [99, -95, 9, 3.2], [54, -67, 9, 7],
    [0, 0, 9, 8], [-54, 67, 9, 7], [-99, 95, 9, 3.2], [-129, 67], [-140, 0], [-129, -67], [-99, -95],
  ],
  items: [0.06, 0.3, 0.6, 0.85],
  boosts: [[0.04, 0], [0.24, -0.35], [0.5, 0], [0.76, 0.35]],
  ramps: [[0.3, 0, 8]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.18, 0.21, 0.4, -0.4, 5], [0.46, 0.53, 0, 0, 6], [0.7, 0.73, -0.3, 0.3, 5], [0.9, 0.93, 0.3, -0.3, 4]],
  hazards: [
    // Polizeiautos mit Blaulicht kreuzen die Fahrbahn
    { kind: 'walker', u: 0.2, model: 'police_car', speed: 5, scale: 1.05, radius: 1.8 },
    { kind: 'walker', u: 0.56, model: 'police_car', speed: 5.5, scale: 1.05, radius: 1.8 },
    { kind: 'walker', u: 0.82, model: 'police_car', speed: 4.5, scale: 1.05, radius: 1.8 },
    // Stadtverkehr und Taxis
    { kind: 'walker', u: 0.13, model: 'city_car', opts: { taxi: true }, speed: 4.5, scale: 1.05, radius: 1.8, anim: 'idle' },
    { kind: 'walker', u: 0.4, model: 'city_car', opts: { color: 0x2a7ad8 }, speed: 4, scale: 1.05, radius: 1.8, anim: 'idle' },
    { kind: 'walker', u: 0.66, model: 'city_car', opts: { taxi: true }, speed: 5, scale: 1.05, radius: 1.8, anim: 'idle' },
    { kind: 'walker', u: 0.93, model: 'city_car', opts: { color: 0x3aa84a }, speed: 4.2, scale: 1.05, radius: 1.8, anim: 'idle' },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    // Hochhäuser rund um die Strecke (nie auf Straßen), dazu Neon-Türme in den beiden Schleifen
    D.city([0x2c2448, 0x3a2f5c, 0x47386a, 0x332a52, 0x5a3a6a], 0xffd88a, 0, 70);
    D.model('neon_tower', W(95, 0), { opts: { h: 70, color: 0x2c2448, edge: 0xff3a8a } });
    D.model('neon_tower', W(-95, 0), { opts: { h: 58, color: 0x3a2f5c, edge: 0x3ad8ff } });
    D.scatter('palm', 60, { dist0: 1, dist1: 14, s0: 1.1, s1: 1.7, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    // Straßenlaternen, Hydranten, Leitkegel
    for (let k = 0; k < 28; k++) D.model('street_lamp', { u: (k + 0.5) / 28, side: k % 2 ? 1 : -1, dist: 0.6 }, { face: 'track' });
    for (let k = 0; k < 10; k++) D.model('hydrant', { u: (k + 0.2) / 10, side: k % 2 ? -1 : 1, dist: 2.5 }, { scale: 1.4 });
    for (let k = 0; k < 16; k++) D.model('traffic_cone', { u: 0.27 + (k % 8) * 0.004, side: k < 8 ? 1 : -1, dist: 0.6 }, { scale: 1.4 });
    // Ampeln an der großen Kreuzung, Neon-Schilder
    for (const [x, z] of [[32, 0], [-32, 0], [0, 30], [0, -30]]) D.model('traffic_light', W(x, z), { yaw: Math.atan2(z, -x), scale: 1.2 });
    const signs = [['PALMEN-CITY', '#ff3a8a'], ['TURBO', '#3ad8ff'], ['PIZZA', '#ffd23a'], ['KINO', '#b06aff'], ['DISCO', '#3aff8a'], ['HOTEL', '#ff8a3a']];
    signs.forEach(([text, color], k) => D.model('neon_sign', { u: (k + 0.35) / signs.length, side: k % 2 ? -1 : 1, dist: 4 }, { opts: { text, color }, face: 'track', scale: 1.2 }));
    // Tankstelle, Polizeisperren mit parkenden Polizeiautos
    D.model('gas_station', { u: 0.37, side: 1, dist: 9 }, { face: 'track' });
    for (const [u, side] of [[0.15, -1], [0.62, 1], [0.88, -1]]) {
      D.model('police_car', { u, side, dist: 4 }, { face: 'along', state: 'idle' });
      D.model('barricade', { u: u + 0.008, side, dist: 1 }, { face: 'along', scale: 1.2 });
      D.model('barricade', { u: u - 0.008, side, dist: 1 }, { face: 'along', scale: 1.2 });
    }
    // geparkte Autos
    const carCols = [0xe8392d, 0x2a7ad8, 0xffffff, 0x2a2a34, 0x3aa84a];
    for (let k = 0; k < 12; k++) D.model('city_car', { u: (k + 0.7) / 12, side: k % 2 ? 1 : -1, dist: 6.5 }, { opts: { color: carCols[k % carCols.length], taxi: k % 5 === 2 }, face: 'along', yaw: k % 2 ? Math.PI : 0 });
    // Polizeihubschrauber kreist mit Suchscheinwerfer über der Stadt
    {
      const h = D.model('police_heli', W(0, 0), { scale: 1.2 });
      h.tick = (e, dt, t) => {
        const a = t * 0.12 + e.t;
        e.model.root.position.set(tr.ox + Math.cos(a) * 90, 34 + Math.sin(t * 0.4) * 3, tr.oz + Math.sin(a) * 70);
        e.model.root.rotation.set(0.08, -a - Math.PI / 2, 0.1);
        e.model.update(dt, 'idle');
      };
    }
    for (const [u, side] of [[0.1, -1], [0.45, 1], [0.78, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
