// Strecke 21: Teneriffa – Rundfahrt über die Kanaren-Insel im Südosten. Start auf der Strandpromenade (Palmen,
// Cafés, Sonnenschirme, Liegen am Strand), durch das Einkaufszentrum „Centro Comercial“, dann in Serpentinen den
// Teide hinauf (Haarnadelkurven, Ziegen auf der Straße, Seilbahn, Blick auf den schneebedeckten Gipfel), über
// den Kamm und hinunter in die Altstadt mit engen Gassen zwischen bunten Häusern mit Holzbalkonen, Kirche und
// Drachenbaum – zurück zur Promenade. Stadtverkehr: grüne Guaguas (Linienbusse) und Autos.

export default {
  id: 'teneriffa',
  name: 'Teneriffa',
  short: 'Teneriffa',
  theme: 'tenerife',
  music: 'course_river',
  banner: 'TENERIFFA',
  hw: 7.5,
  margin: 4,
  seed: 412,
  weatherOdds: [0.15, 0.35],   // Zufallswetter: hier öfter Calima als Regen
  ctrl: [
    // Strandpromenade ostwärts
    [-120, 172], [-20, 180], [80, 176], [150, 160], [200, 112],
    // Einkaufszentrum (Nord-Süd-Gerade)
    [215, 60], [215, 0], [210, -40],
    // Serpentinen am Osthang des Teide: drei Schleifen hinauf
    [194, -75, 6.5], [193, -122, 7], [188, -143, 8], [173, -152, 8.5], [158, -143, 8], [153, -122, 7],
    [152, -48, 7], [147, -28, 8], [132, -19, 8.5], [117, -28, 8], [112, -48, 7],
    [110, -122, 6.5],
    // über den Kamm nördlich des Gipfels nach Westen, dann hinab
    [80, -156, 6.5], [40, -162, 6.5], [-10, -148, 6.5], [-58, -118, 7], [-95, -72, 7], [-128, -30, 6.5],
    // Altstadt: enge Gassen im Zickzack
    [-168, 0, 5.5], [-186, 40, 5.5], [-158, 72, 5.5], [-188, 104, 5.5], [-178, 142, 6], [-152, 164, 7],
  ],
  items: [0.08, 0.3, 0.64, 0.88],
  boosts: [[0.05, 0], [0.16, 0.35], [0.68, 0], [0.97, 0]],
  ramps: [[0.2, -0.3, 8]],
  coins: [[0.02, 0.05, -0.4, 0.4, 5], [0.12, 0.15, 0.4, -0.4, 5], [0.27, 0.3, 0, 0, 5], [0.63, 0.67, -0.3, 0.3, 6], [0.84, 0.87, 0, 0, 4]],
  hazards: [
    // Guaguas und Autos fahren mit (Promenade, Serpentinen, Altstadt)
    { kind: 'traffic', u: 0.1, lane: 3.5, speed: 10, model: 'guagua', length: 10 },
    { kind: 'traffic', u: 0.52, lane: -2.5, speed: 8, model: 'guagua', length: 10 },
    { kind: 'traffic', u: 0.2, lane: -3.5, speed: 12, opts: { color: 0xffffff } },
    { kind: 'traffic', u: 0.75, lane: 2.5, speed: 11, opts: { taxi: true } },
    { kind: 'traffic', u: 0.92, lane: 0, speed: 8, opts: { color: 0x2a7ad8 } },
    // Ziegen laufen über die Serpentinen
    { kind: 'walker', u: 0.4, model: 'cabra', speed: 2.2, scale: 1.3, radius: 0.8 },
    { kind: 'walker', u: 0.47, model: 'cabra', speed: 1.8, scale: 1.3, radius: 0.8 },
    { kind: 'walker', u: 0.57, model: 'cabra', speed: 2.5, scale: 1.3, radius: 0.8 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const uAt = (x, z) => {
      const X = tr.ox + x, Z = tr.oz + z;
      let best = 0, bd = Infinity;
      for (let i = 0; i < tr.N; i++) { const d = (tr.px[i] - X) ** 2 + (tr.pz[i] - Z) ** 2; if (d < bd) { bd = d; best = i; } }
      return best / tr.N;
    };
    const uMall = uAt(215, 30), uProm0 = 0, uProm1 = uAt(150, 160), uTown0 = uAt(-128, -30), uTown1 = uAt(-152, 164);
    const uSerp0 = uAt(194, -75), uSerp1 = uAt(110, -122), uCrest1 = uAt(-58, -118);

    // ---- Teide: Gipfelkegel mit Schnee, Seilbahn, Lavafelsen
    D.model('teide_peak', W(40, -60), { opts: { h: 46, r: 46 }, always: true });   // Wahrzeichen: von überall zu sehen
    D.model('teleferico', W(70, -20), { yaw: 0.9 });
    D.scatter('rock', 70, { u0: uSerp0, u1: uCrest1, dist0: 2, dist1: 30, s0: 0.8, s1: 2.2, colors: [0x5a4a44, 0x6a4e40, 0x3e3438], size: 2 });
    D.scatter('cactus', 24, { u0: uSerp0, u1: uCrest1, dist0: 3, dist1: 25, s0: 0.8, s1: 1.3, colors: [0x5a8a42], size: 1.5 });
    for (let k = 0; k < 6; k++) D.model('cabra', { u: uSerp0 + (uSerp1 - uSerp0) * (k + 0.5) / 6, side: k % 2 ? 1 : -1, dist: 4 + (k % 3) * 3 }, { scale: 1.2, state: 'idle', face: 'along' });

    // ---- Strandpromenade: Palmen, Laternen, Cafés, Strand mit Schirmen
    D.scatter('palm', 40, { u0: uProm0, u1: uProm1, dist0: 0.5, dist1: 6, s0: 1.2, s1: 1.8, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    for (let k = 0; k < 14; k++) D.model('street_lamp', { u: uProm0 + (uProm1 - uProm0) * (k + 0.5) / 14, side: 1, dist: 0.6 }, { face: 'track' });
    for (let k = 0; k < 7; k++) D.model('cafe_set', { u: uProm0 + (uProm1 - uProm0) * (k + 0.3) / 7, side: -1, dist: 3.5 }, { opts: { color: [0xe8392d, 0x2a6ab8, 0xf2c14e, 0x2aa84a][k % 4] } });
    for (let k = 0; k < 5; k++) D.model('strelitzia', { u: uProm0 + (uProm1 - uProm0) * (k + 0.7) / 5, side: -1, dist: 1.2 }, { face: 'along' });
    D.scatter('umbrella', 46, { u0: uProm0, u1: uProm1, side: 1, dist0: 8, dist1: 34, s0: 1, s1: 1.3, colors: [0xe8392d, 0x2a8ae8, 0xffc21a, 0x4fb833, 0xff6aa8], size: 2 });
    D.scatter('starfish', 20, { u0: uProm0, u1: uProm1, side: 1, dist0: 10, dist1: 40, s0: 1, s1: 1.4, colors: [0xff8a3a, 0xff6aa8], size: 0.6 });
    // Hotels und Apartments hinter der Promenade
    for (let k = 0; k < 6; k++) {
      const u = uProm0 + (uProm1 - uProm0) * (k + 0.5) / 6;
      D.model('canary_house', { u, side: -1, dist: 14 }, { opts: { color: [0xfaf6ee, 0xf2c14e, 0x8ad0e8, 0xf0a8a0][k % 4], w: 14, d: 10, floors: 4, roof: 'flat', balcony: true } });
    }

    // ---- Einkaufszentrum zum Durchfahren
    D.model('mall', { u: uMall, lat: 0 }, { opts: { length: 50, width: 2 * (tr.wallAt(Math.round(uMall * tr.N)) + 1.2), text: 'CENTRO COMERCIAL' }, face: 'along' });

    // ---- Kanarenkiefern an den Hängen des Teide, Büsche und Blumen im Tiefland
    D.scatter('pineTree', 60, { u0: uSerp0, u1: uCrest1, dist0: 6, dist1: 45, s0: 1.2, s1: 2, colors: [0x3a7a3a, 0x4a8a42], size: 2.5 });
    D.scatter('bush', 60, { dist0: 2, dist1: 40, s0: 0.6, s1: 1.2, colors: [0x7aa64a, 0x8ab04a], size: 1.2 });
    D.scatter('flower', 120, { dist0: 0.5, dist1: 22, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffd21f, 0xb47fe6, 0xffffff], size: 0.3 });
    // Dorf im Inneren: weiße und bunte Häuser mit Flachdach, dazwischen Drachenbäume
    for (let k = 0; k < 14; k++) {
      const p = W(-95 + (k % 5) * 22 + ((k * 37) % 17) - 8, 70 + Math.floor(k / 5) * 26 + ((k * 23) % 15) - 7);
      if (D.clear(p.x, p.z, 7)) D.model('canary_house', p, { yaw: (k % 4) * Math.PI / 2, opts: { color: [0xfaf6ee, 0xfaf6ee, 0xf2c14e, 0x8ad0e8, 0xf0a8c8][k % 5], w: 7, d: 7, floors: 1 + (k % 3 === 0 ? 1 : 0), roof: k % 3 ? 'flat' : 'tile', balcony: k % 3 === 0 } });
    }
    D.model('drago', W(-40, 100), { scale: 1.2 });
    // ---- Bananenplantage im Inneren
    for (let r = 0; r < 4; r++) for (let c = 0; c < 8; c++) {
      const p = W(30 + c * 14, 50 + r * 18);
      if (D.clear(p.x, p.z, 3)) D.model('banana_plant', p, { yaw: (r * 8 + c) * 0.7, scale: 1 + ((r + c) % 3) * 0.12 });
    }

    // ---- Altstadt: bunte Häuser dicht an den Gassen, Kirche, Drachenbaum
    const cols = [0xf2c14e, 0xe86a4a, 0x8ad0e8, 0x7ab85a, 0xf0a8c8, 0xfaf6ee, 0xd8762a, 0x6a8ae8];
    // Platz frei? (keine andere Straße unter dem Haus – Ecken und Mitte prüfen)
    const nr = {};
    const freeAt = (x, z) => {
      const r = D.world.nearestRoad(x, z, 2, nr);
      if (!r.road) return true;
      return r.d > (r.road.closed ? r.road.wallAt(r.i) : r.hw + 1) + 0.2;
    };
    let k = 0;
    for (let u = uTown0; u < uTown1; u += 0.0062) {
      for (const side of [-1, 1]) {
        const d = 7 + (k % 3), w = 6 + (k % 2) * 2, p0 = tr.pointAt(u, 0);
        const q = tr.pointAt(u, side * (tr.wallAt(p0.i) + 0.4 + d / 2));
        const tx = tr.tx[p0.i], tz = tr.tz[p0.i], nx = -tz * side, nz = tx * side;
        k++;
        let ok = freeAt(q.x, q.z);
        for (const a of [-1, 1]) for (const b of [-1, 1]) ok = ok && freeAt(q.x + nx * a * d / 2 + tx * b * w / 2, q.z + nz * a * d / 2 + tz * b * w / 2);
        if (!ok || D.world.heightAt(q.x, q.z) < 0.5) continue;
        D.model('canary_house', { u, side, dist: 0.4 + d / 2 }, { opts: { color: cols[k % cols.length], w, d, floors: 2 + (k % 3 === 0 ? 1 : 0), roof: k % 4 === 0 ? 'flat' : 'tile', balcony: k % 3 !== 1 } });
      }
    }
    D.model('canary_church', W(-235, 70), { yaw: 0 });
    D.model('drago', W(-225, 20), { scale: 1.1 });
    D.model('drago', W(-110, 40), { scale: 0.9 });

    for (const [u, side] of [[0.06, -1], [0.45, 1], [0.8, -1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, 1, ['fairy_spotter', 'bunny_small', 'pilzling', 'fairy_spotter']);
  },
};
