// Strecke 12: Loro Parque – der Tierpark an der Ostküste. Start am Thai-Tor, dann vorbei an Papageien-Volieren,
// Flamingo-Lagune, Gorillas, Tigern, Planet Penguin (Pinguine watscheln über die Fahrbahn), durch den gläsernen
// Hai-Tunnel des Aquariums, an der Delfin-Lagune und den Seelöwen vorbei. In der Orca-Show springt der Wal aus
// dem Becken und spritzt eine Riesenwelle über die Strecke – wer nass wird, wird langsamer (blauer Ring = gleich!).


export default {
  id: 'loroparque',
  name: 'Loro Parque',
  short: 'Loro Parque',
  theme: 'zoo',
  music: 'course_diorama',
  banner: 'LORO PARQUE',
  hw: 7.5,
  margin: 5,
  seed: 131,
  ctrl: [
    [0, 0], [66, -2], [132, -7], [182, 7], [216, 43], [221, 89], [194, 125], [149, 139, 7.5], [106, 146, 7.5],
    [60, 158, 7], [12, 163, 7], [-36, 161, 7], [-82, 146], [-118, 115], [-132, 72], [-120, 31], [-84, 7], [-41, 0],
  ],
  items: [0.08, 0.3, 0.55, 0.8],
  boosts: [[0.16, 0.35], [0.42, -0.3], [0.62, 0], [0.9, -0.35]],
  ramps: [[0.24, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.2, 0.23, 0.4, -0.4, 5], [0.46, 0.5, 0, 0, 5], [0.68, 0.71, -0.4, -0.4, 4], [0.86, 0.88, 0.3, 0.3, 4]],
  hazards: [
    // Orca-Show im Innenfeld der Westkurve: springt und spritzt über die Fahrbahn
    { kind: 'orca', u: 0.79, side: 1, dist: 22, r: 18, every: 6.5 },
    // Pinguine von Planet Penguin watscheln über die Straße
    { kind: 'walker', u: 0.47, model: 'penguin', speed: 1.4, scale: 1.4, radius: 0.5 },
    { kind: 'walker', u: 0.475, model: 'penguin', speed: 1.1, scale: 1.3, radius: 0.5 },
    { kind: 'walker', u: 0.48, model: 'penguin', speed: 1.7, scale: 1.5, radius: 0.5 },
    // Papageien fliegen quer über die Startgerade
    { kind: 'brummer', u: 0.1, model: 'parrot', opts: { color: 'scarlet' }, speed: 5 },
    { kind: 'brummer', u: 0.17, model: 'parrot', opts: { color: 'blue' }, speed: 4.2 },
  ],
  scenery(D) {
    // Kanaren-Grün: Palmen, Drachenbäume (runde Bäume), Hibiskus-Büsche, Blumen
    D.scatter('palm', 70, { dist0: 2, dist1: 55, s0: 0.9, s1: 1.6, colors: [0x4fb833, 0x5cc23c, 0x3fa02a], size: 1.2 });
    D.scatter('bush', 50, { dist0: 1.5, dist1: 30, s0: 0.6, s1: 1.1, colors: [0x5ab84a, 0x4aa83a, 0x6ac85a], size: 1.2 });
    D.scatter('flower', 120, { dist0: 0.5, dist1: 14, s0: 0.9, s1: 1.4, colors: [0xff3a5a, 0xff8ad8, 0xffc21a, 0xff6a2a, 0xffffff], size: 0.3 });
    D.scatter('roundTree', 24, { dist0: 8, dist1: 60, s0: 1, s1: 1.5, colors: [0x3f9a2a, 0x4aa83a], size: 2.5 });
    D.scatter('rock', 20, { dist0: 2, dist1: 30, s0: 0.6, s1: 1.2, colors: [0x6a5a50, 0x7a6a5e], size: 1.2 });

    // Eingang: Thai-Pavillons links und rechts vom Start-Tor
    D.model('thai_pavilion', { u: 0.988, side: 1, dist: 6 }, { scale: 1.1 });
    D.model('thai_pavilion', { u: 0.988, side: -1, dist: 6 }, { scale: 1.1 });
    D.model('zoo_sign', { u: 0.02, side: 1, dist: 2 }, { opts: { text: 'Loro Parque', color: '#e8392d' }, face: 'track' });

    // Papageien-Volieren an der Startgerade (mit Papageien drin)
    for (const [u, side, cols] of [[0.06, -1, ['scarlet', 'blue', 'green']], [0.13, -1, ['blue', 'scarlet', 'scarlet']], [0.1, 1, ['green', 'blue']]]) {
      const av = D.model('aviary', { u, side, dist: 7 }, { opts: { r: 5 } });
      const c = av.model.root.position;
      cols.forEach((col, k) => {
        const a = k * 2.1;
        D.model('parrot', { x: c.x + Math.cos(a) * 2.2, z: c.z + Math.sin(a) * 2.2 }, { opts: { color: col }, y: 1.6 + k * 0.6, yaw: a + Math.PI / 2, scale: 1.4, state: 'perch' });
      });
    }
    // freie Papageien auf Sitzstangen am Rand
    for (const [u, side, col] of [[0.03, 1, 'scarlet'], [0.19, -1, 'green'], [0.33, 1, 'blue'], [0.94, -1, 'scarlet']]) {
      D.model('parrot', { u, side, dist: 1.2 }, { opts: { color: col }, y: 1.6, scale: 1.6, state: 'perch' });
    }

    // Flamingo-Lagune in der Ostkurve (innen)
    {
      const lg = D.model('lagoon', { u: 0.29, side: 1, dist: 12 }, { opts: { r: 9, color: 0x3ac0d8 } });
      const c = lg.model.root.position;
      for (let k = 0; k < 7; k++) {
        const a = k * 0.9, r = 2 + (k % 3) * 2.2;
        D.model('flamingo', { x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r }, { y: 0.25, yaw: a * 1.7, scale: 1.7 });
      }
    }
    // Gorillas (außen an der Ostkurve)
    {
      const en = D.model('enclosure', { u: 0.32, side: -1, dist: 9 }, { opts: { r: 10 } });
      const c = en.model.root.position;
      D.model('gorilla', { x: c.x - 1, z: c.z + 1 }, { yaw: Math.atan2(-(D.track.pointAt(0.32, 0).z - c.z), D.track.pointAt(0.32, 0).x - c.x), scale: 2.0, state: 'idle' });
      D.model('gorilla', { x: c.x + 3, z: c.z - 4 }, { yaw: 2.5, scale: 1.3, state: 'beat' });
      D.model('zoo_sign', { u: 0.315, side: -1, dist: 1.5 }, { opts: { text: 'Gorillas', color: '#5a3a2a' } });
    }
    // Tiger (außen an der Südseite)
    {
      const en = D.model('enclosure', { u: 0.4, side: -1, dist: 9 }, { opts: { r: 10, ground: 'sand' } });
      const c = en.model.root.position;
      const tg = D.model('tiger', { x: c.x, z: c.z }, { scale: 1.8, state: { anim: 'walk', speed: 1 } });
      tg.tick = (e, dt, t) => {
        // Tiger läuft im Gehege auf und ab
        const a = t * 0.35 + e.t;
        e.model.root.position.set(c.x + Math.cos(a) * 5.5, c.y, c.z + Math.sin(a) * 5.5);
        e.model.root.rotation.y = -a - Math.PI / 2;
        e.model.update(dt, { anim: 'walk', speed: 1 });
      };
      D.model('tiger', { x: c.x - 2, z: c.z + 2 }, { scale: 1.6, yaw: 1.2, state: 'idle' });
      D.model('zoo_sign', { u: 0.395, side: -1, dist: 1.5 }, { opts: { text: 'Tiger', color: '#d86a10' } });
    }
    // Planet Penguin (außen) mit Pinguinen auf dem Schnee
    {
      const ph = D.model('penguin_house', { u: 0.47, side: -1, dist: 20 }, {});
      const c = ph.model.root.position;
      for (let k = 0; k < 10; k++) {
        const a = k * 0.63 + 0.4, r = 10.5 + (k % 3) * 1.4;
        const pe = D.model('penguin', { x: c.x + Math.cos(a) * r, z: c.z + Math.sin(a) * r }, { yaw: a + (k % 2 ? 1.5 : -1.5), scale: 1.6, state: k % 3 ? 'idle' : 'walk' });
        if (k % 3 === 0) pe.tick = (e, dt, t) => {
          const b = a + Math.sin(t * 0.25 + k) * 0.35;
          e.model.root.position.set(c.x + Math.cos(b) * r, c.y + 0.25, c.z + Math.sin(b) * r);
          e.model.root.rotation.y = -b + (Math.cos(t * 0.25 + k) > 0 ? Math.PI : 0);
          e.model.update(dt, { anim: 'walk', speed: 1 });
        };
      }
    }
    // Aquarium: gläserner Hai-Tunnel über der Fahrbahn
    D.model('shark_tunnel', { u: 0.588, lat: 0 }, { opts: { length: 40, width: 2 * (D.track.wallAt(Math.round(0.588 * (D.track.N - 1))) + 1.2) }, face: 'along' });
    // Delfin-Lagune im Innenfeld mit springenden Delfinen
    {
      const lg = D.model('lagoon', { u: 0.6, side: 1, dist: 42 }, { opts: { r: 15 } });
      const c = lg.model.root.position;
      for (let k = 0; k < 3; k++) {
        const df = D.model('dolphin', { x: c.x, z: c.z }, { scale: 1.7, state: 'swim' });
        df.tick = (e, dt, t) => {
          // Kreis im Becken, alle paar Sekunden ein Sprung
          const a = t * 0.5 + k * 2.1;
          const jump = Math.max(0, Math.sin(t * 0.9 + k * 2.1));
          const j = jump ** 3;
          e.model.root.position.set(c.x + Math.cos(a) * 9, c.y + 0.1 + j * 4.5 - 0.5 * (1 - j), c.z + Math.sin(a) * 9);
          e.model.root.rotation.set(0, -a - Math.PI / 2, Math.cos(t * 0.9 + k * 2.1) * j * 0.9);
          e.model.update(dt, 'swim');
        };
      }
    }
    // Seelöwen (außen an der Westkurve) auf Felsen an einem kleinen Becken
    {
      const lg = D.model('lagoon', { u: 0.87, side: -1, dist: 12 }, { opts: { r: 8 } });
      const c = lg.model.root.position;
      for (let k = 0; k < 4; k++) {
        const a = k * 1.4 + 0.3;
        D.model('sea_lion', { x: c.x + Math.cos(a) * 8.6, z: c.z + Math.sin(a) * 8.6 }, { y: 0.6, yaw: -a + Math.PI, scale: 1.6, state: k % 2 ? 'clap' : 'idle' });
      }
      D.model('zoo_sign', { u: 0.865, side: -1, dist: 1.5 }, { opts: { text: 'Seelöwen', color: '#1a7ab8' } });
    }
    // Orca Ocean: Show-Becken mit Tribüne (der Orca selbst ist die Gefahr, siehe hazards)
    D.model('orca_pool', { u: 0.79, side: 1, dist: 22 }, { opts: { r: 18 } });
    // Zuschauer an Start und Orca-Show
    D.crowd(0.975, 1, ['bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small', 'fairy_spotter']);
    D.crowd(0.03, -1, ['fairy_spotter', 'bunny_small', 'fairy_spotter', 'pilzling']);
    for (const [u, side] of [[0.07, 1], [0.35, -1], [0.66, 1], [0.9, -1]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
  },
};
