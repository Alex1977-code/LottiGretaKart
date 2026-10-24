// Strecke 14: Dino-Dschungel – im Urwald an der Nordküste. Die Strecke ist eine Schleife mit Looping: erst ein
// großer Bogen durch den Dschungel, dann eine enge innere Schleife um das Dino-Nest, und zurück geht es über die
// Lianenbrücke – genau über die Stelle, an der man vorher unten durchgefahren ist. Ein T-Rex stapft über die
// Fahrbahn (wer erwischt wird, ist platt), Flugsaurier sausen tief vorbei, Felsbrocken rollen vom Hang.
// Brachiosaurier fressen an den Bäumen, Triceratopse grasen, am Wasserfall plätschert es.

export default {
  id: 'dinodschungel',
  name: 'Dino-Dschungel',
  short: 'Dinos',
  theme: 'jungle',
  music: 'course_grass',
  banner: 'DINO-DSCHUNGEL',
  hw: 7.5,
  margin: 4,
  seed: 157,
  // Pascalsche Schnecke (r = 60 + 150·cos θ): großer Bogen + innere Schleife, eine Kreuzung mit Brücke
  ctrl: [
    [164, -95], [198, -53], [210, 0], [198, 53], [164, 95], [117, 117], [68, 117], [26, 95], [0, 60], [-5, 20],
    [7, -13], [33, -33], [61, -35], [82, -22], [90, 0], [82, 22, 7.5, 0.5], [61, 35, 7.5, 2.2], [33, 33, 7.5, 4.6],
    [8, 13, 7.5, 7.0], [-5, -20, 7.5, 6.0], [0, -60, 7.5, 3.5], [26, -95, 7.5, 1.2], [68, -117], [117, -117],
  ],
  items: [0.08, 0.3, 0.52, 0.8],
  boosts: [[0.18, 0], [0.4, 0.3], [0.6, -0.3], [0.92, 0]],
  ramps: [[0.25, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.14, 0.17, 0.4, -0.4, 5], [0.46, 0.5, 0, 0, 5], [0.7, 0.74, 0, 0, 6], [0.95, 0.97, -0.3, 0.3, 4]],
  hazards: [
    // T-Rex stapft quer über die Fahrbahn
    { kind: 'walker', u: 0.2, model: 'trex', speed: 2.2, scale: 1.25, radius: 2.2, anim: 'walk', hit: 'squish' },
    // Triceratops-Herde kreuzt die Straße
    { kind: 'walker', u: 0.88, model: 'triceratops', speed: 1.8, scale: 1.1, radius: 1.6, anim: 'walk' },
    // Flugsaurier sausen tief über die Strecke
    { kind: 'brummer', u: 0.1, model: 'ptero', speed: 6 },
    { kind: 'brummer', u: 0.34, model: 'ptero', speed: 5 },
    { kind: 'brummer', u: 0.62, model: 'ptero', speed: 5.5 },
    // Felsbrocken rollen quer
    { kind: 'roller', u: 0.27, style: 'rock', size: 1.8, speed: 5 },
    { kind: 'roller', u: 0.94, style: 'rock', size: 1.6, speed: 6 },
  ],
  scenery(D) {
    D.scatter('roundTree', 60, { dist0: 3, dist1: 60, s0: 1.1, s1: 1.8, colors: [0x2f8a2a, 0x3a9a2e, 0x4aa83a], size: 2.5 });
    D.scatter('palm', 40, { dist0: 2, dist1: 45, s0: 1.0, s1: 1.7, colors: [0x3fa02a, 0x4fb833], size: 1.2 });
    D.scatter('bush', 70, { dist0: 1, dist1: 30, s0: 0.7, s1: 1.4, colors: [0x2f8a2a, 0x3a9a2e, 0x5ab84a], size: 1.2 });
    D.scatter('rock', 30, { dist0: 2, dist1: 40, s0: 0.8, s1: 2.2, colors: [0x7a7068, 0x8a8078], size: 1.5 });
    D.scatter('flower', 90, { dist0: 0.5, dist1: 14, s0: 1, s1: 1.5, colors: [0xff3a8a, 0xffc21a, 0xff6a2a, 0xb05aff], size: 0.3 });
    // Baumfarne entlang der Strecke
    for (let k = 0; k < 26; k++) {
      const u = (k + 0.5) / 26;
      if (u > 0.6 && u < 0.92) continue;   // neben der Brücke ist unten kein Rand
      D.model('fern', { u, side: k % 2 ? 1 : -1, dist: 2 + (k % 3) * 2 }, { opts: { size: 1 + (k % 3) * 0.3 } });
    }
    const tr = D.track;
    // Dino-Nest in der inneren Schleife
    {
      const x = tr.ox + 58, z = tr.oz;
      for (let k = 0; k < 5; k++) { const a = k * 1.26; D.model('dino_egg', { x: x + Math.cos(a) * 3.5, z: z + Math.sin(a) * 3.5 }, { scale: 1.5 }); }
      D.model('triceratops', { x: x - 2, z: z + 7 }, { yaw: -1.2, scale: 1.2, state: 'idle' });
    }
    // Brachiosaurier im großen Innenfeld (fressen an den Bäumen) und draußen
    D.model('brachio', { x: tr.ox + 140, z: tr.oz + 20 }, { yaw: 2.6, scale: 1.0, state: 'idle' });
    const br = D.model('brachio', { x: tr.ox + 130, z: tr.oz - 40 }, { yaw: 0.5, scale: 0.8, state: 'walk' });
    br.tick = (e, dt, t) => {
      const a = t * 0.06 + e.t;
      e.model.root.position.set(tr.ox + 130 + Math.cos(a) * 16, e.model.root.position.y, tr.oz - 10 + Math.sin(a) * 26);
      e.model.root.rotation.y = -a - Math.PI / 2;
      e.model.update(dt, { anim: 'walk', speed: 0.6 });
    };
    D.model('brachio', { u: 0.12, side: -1, dist: 30 }, { scale: 1.1, state: 'idle' });
    // Triceratopse und ein brüllender T-Rex am Rand
    D.model('triceratops', { u: 0.05, side: -1, dist: 10 }, { scale: 1.2, state: 'idle' });
    D.model('triceratops', { u: 0.33, side: -1, dist: 12 }, { scale: 1.0, state: 'idle' });
    D.model('trex', { u: 0.45, side: -1, dist: 14 }, { scale: 1.3, state: 'roar' });
    // Wasserfall außen am großen Bogen
    D.model('waterfall', { u: 0.03, side: -1, dist: 22 }, { scale: 1.3, face: 'track' });
    for (const [u, side] of [[0.15, 1], [0.38, 1], [0.55, -1], [0.98, 1]]) {
      D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    }
    D.crowd(0.975, 1, ['pilzling', 'bunny_small', 'fairy_spotter', 'bunny_small', 'pilzling']);
  },
};
