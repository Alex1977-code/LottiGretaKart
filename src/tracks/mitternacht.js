// Strecke 20: Mitternachts-Highway – Nachtrennen im Stil von Need for Speed auf der Neon-Insel im Nordosten.
// Immer Nacht: nasser, spiegelnder Asphalt, Laternen und Neon spiegeln sich auf der Straße, Hochhäuser mit
// leuchtenden Fenstern. Breiter Boulevard mit Beton-Tunnel (orange Tunnellampen), Haarnadel am Hafen, dann die
// Hochstraße (Stadtautobahn auf Stelzen) mit Schilderbrücken. Stadtverkehr fährt auf den Spuren mit, die Polizei
// mit Blaulicht wechselt die Spur, der Hubschrauber kreist mit dem Suchscheinwerfer.

export default {
  id: 'mitternacht',
  name: 'Mitternachts-Highway',
  short: 'Nacht',
  theme: 'nightcity',
  night: true,
  music: 'course_boss',
  banner: 'MITTERNACHTS-HIGHWAY',
  hw: 10,
  margin: 4.5,
  seed: 331,
  // Ostwärts über den Boulevard (Süden), Haarnadel am Hafen (Osten), westwärts über die Hochstraße (Norden)
  ctrl: [
    [-150, 70], [-70, 100], [20, 100], [90, 95], [150, 62], [180, 0], [165, -60], [110, -96],
    [30, -110, 10.5, 6.5], [-60, -110, 10.5, 6.5], [-125, -95], [-170, -45], [-182, 15],
  ],
  items: [0.08, 0.32, 0.58, 0.84],
  boosts: [[0.05, 0], [0.27, 0.35], [0.62, 0], [0.9, -0.35]],
  ramps: [[0.42, 0, 8]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.2, 0.23, 0.4, -0.4, 5], [0.5, 0.54, 0, 0, 6], [0.68, 0.72, -0.3, 0.3, 6], [0.93, 0.96, 0.3, -0.3, 4]],
  hazards: [
    // Stadtverkehr auf den Spuren (fährt mit), Taxis
    { kind: 'traffic', u: 0.12, lane: -6.5, speed: 13, opts: { taxi: true } },
    { kind: 'traffic', u: 0.24, lane: 6.5, speed: 12, opts: { color: 0x2a7ad8 } },
    { kind: 'traffic', u: 0.36, lane: -2.5, speed: 14, opts: { color: 0xffffff } },
    { kind: 'traffic', u: 0.5, lane: 6.5, speed: 13, opts: { color: 0x3aa84a } },
    { kind: 'traffic', u: 0.64, lane: -6.5, speed: 15, opts: { taxi: true } },
    { kind: 'traffic', u: 0.78, lane: 2.5, speed: 12, opts: { color: 0xe8392d } },
    { kind: 'traffic', u: 0.9, lane: -6.5, speed: 13, opts: { color: 0x2a2a34 } },
    // Polizei mit Blaulicht: schneller, wechselt die Spur
    { kind: 'traffic', u: 0.3, lane: 0, speed: 21, police: true },
    { kind: 'traffic', u: 0.7, lane: 0, speed: 22, police: true },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const th = D.theme;
    // Hochhäuser mit leuchtenden Fenstern rund um die Strecke, Neon-Türme in der Schleife
    D.city(th.city, th.cityWindow, 0, 80);
    D.model('neon_tower', W(-40, 0), { opts: { h: 78, color: 0x1e1a34, edge: 0xff3a8a } });
    D.model('neon_tower', W(60, -10), { opts: { h: 64, color: 0x22203c, edge: 0x3ad8ff } });
    D.model('neon_tower', W(110, 30), { opts: { h: 52, color: 0x1a1830, edge: 0xb06aff } });
    // Neon-Reklame am Boulevard und an der Hochstraße
    const signs = [['NITRO', '#3ad8ff'], ['DINER', '#ff3a8a'], ['ARCADE', '#b06aff'], ['GARAGE', '#ffd23a'], ['TURBO', '#3aff8a'], ['HOTEL', '#ff8a3a'], ['24/7', '#ff3a8a'], ['TUNING', '#3ad8ff']];
    signs.forEach(([text, color], k) => D.model('neon_sign', { u: (k + 0.3) / signs.length, side: k % 2 ? -1 : 1, dist: 4 }, { opts: { text, color }, face: 'track', scale: 1.2 }));
    // Beton-Tunnel über dem Boulevard
    const tw = 2 * (tr.wallAt(Math.round(0.135 * tr.N)) + 1.2);
    D.model('road_tunnel', { u: 0.135, lat: 0 }, { opts: { length: 46, width: tw, text: 'HAFENTUNNEL' }, face: 'along' });
    // Schilderbrücken über der Fahrbahn
    const gw = (u) => 2 * (tr.wallAt(Math.round(u * tr.N)) + 0.6);
    D.model('highway_sign', { u: 0.045, lat: 0 }, { opts: { width: gw(0.045), signs: [['HAFEN', '↑ Tunnel'], ['CITY', '→ Neon']] }, face: 'along' });
    D.model('highway_sign', { u: 0.6, lat: 0 }, { opts: { width: gw(0.6), signs: [['HIGHWAY', '↑ A1'], ['ZIEL', '← 1 km']] }, face: 'along' });
    D.model('highway_sign', { u: 0.86, lat: 0 }, { opts: { width: gw(0.86), signs: [['PALMEN-CITY', '↓ Brücke'], ['WÜSTE', '← 3 km']] }, face: 'along' });
    // Hafen: Container im Norden, hinter der Hochstraße
    for (let k = 0; k < 9; k++) D.model('container_stack', W(-160 + k * 38, -158 - (k % 2) * 8), { opts: { seed: k + 1 }, yaw: (k % 3) * 0.1 });
    // Tankstelle, Polizeisperren, parkende Autos
    D.model('gas_station', { u: 0.3, side: 1, dist: 9 }, { face: 'track' });
    for (const [u, side] of [[0.22, -1], [0.55, 1], [0.95, 1]]) {
      D.model('police_car', { u, side, dist: 4 }, { face: 'along', state: 'idle' });
      D.model('barricade', { u: u + 0.007, side, dist: 1 }, { face: 'along', scale: 1.2 });
      D.model('barricade', { u: u - 0.007, side, dist: 1 }, { face: 'along', scale: 1.2 });
    }
    const carCols = [0xe8392d, 0x2a7ad8, 0xffffff, 0x2a2a34, 0x3aa84a, 0xff8a1a];
    for (let k = 0; k < 14; k++) D.model('city_car', { u: (k + 0.6) / 14, side: k % 2 ? 1 : -1, dist: 6.5 }, { opts: { color: carCols[k % carCols.length], taxi: k % 5 === 2 }, face: 'along', yaw: k % 2 ? Math.PI : 0 });
    for (let k = 0; k < 10; k++) D.model('hydrant', { u: (k + 0.4) / 10, side: k % 2 ? -1 : 1, dist: 2.5 }, { scale: 1.4 });
    for (let k = 0; k < 12; k++) D.model('traffic_cone', { u: 0.4 + (k % 6) * 0.004, side: k < 6 ? 1 : -1, dist: 0.6 }, { scale: 1.4 });
    D.scatter('palm', 30, { dist0: 2, dist1: 14, s0: 1.1, s1: 1.6, colors: [0x2e6a2a, 0x3a7a32], size: 1.2 });
    // Polizeihubschrauber kreist mit Suchscheinwerfer
    {
      const h = D.model('police_heli', W(0, 0), { scale: 1.2 });
      h.tick = (e, dt, t) => {
        const a = t * 0.14 + e.t;
        e.model.root.position.set(tr.ox + Math.cos(a) * 120, 36 + Math.sin(t * 0.4) * 3, tr.oz + Math.sin(a) * 80);
        e.model.root.rotation.set(0.08, -a - Math.PI / 2, 0.1);
        e.model.update(dt, 'idle');
      };
    }
    for (const [u, side] of [[0.18, -1], [0.47, 1], [0.8, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
