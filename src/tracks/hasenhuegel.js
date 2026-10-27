// Strecke 18: Hasenhügel – Frühlingswiese an der Westküste. Eine lange Schlängel-Runde: im Westen in Kurven an
// Möhrenbeeten und Hasenställen vorbei nach Norden, im Osten geradeaus zurück – mitten durch den großen Hasenbau
// (Erdröhre mit Wurzeln und Glühwürmchen-Laternen). Kaninchen hoppeln über die Fahrbahn, bemalte Riesen-Eier rollen,
// aus Hasenlöchern schauen Kaninchen heraus, die Windmühle dreht sich.

export default {
  id: 'hasenhuegel',
  name: 'Hasenhügel',
  short: 'Hasen',
  theme: 'bunny',
  music: 'course_grass',
  banner: 'HASENHÜGEL',
  hw: 7.5,
  margin: 4,
  seed: 211,
  // im Uhrzeigersinn (von oben): im Westen nach Norden, im Osten nach Süden; rechts = Innenfeld
  ctrl: [
    [-40, 200], [-50, 130], [-30, 70], [-55, 10], [-45, -60], [-55, -130], [-30, -200], [10, -235], [50, -205],
    [58, -150], [55, -100], [55, -40], [55, 20], [62, 90], [50, 170], [15, 232], [-25, 228],
  ],
  items: [0.08, 0.35, 0.55, 0.8],
  boosts: [[0.1, 0], [0.3, 0.3], [0.62, 0], [0.78, -0.3]],
  ramps: [[0.22, 0, 6], [0.74, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.16, 0.19, 0.4, -0.4, 5], [0.43, 0.46, 0, 0, 5], [0.6, 0.63, 0, 0, 6], [0.86, 0.89, -0.3, 0.3, 4]],
  hazards: [
    // Kaninchen hoppeln über die Fahrbahn
    { kind: 'walker', u: 0.14, model: 'rabbit', opts: { color: 'white' }, speed: 2.4, scale: 2.6, radius: 0.8, anim: 'hop' },
    { kind: 'walker', u: 0.42, model: 'rabbit', opts: { color: 'brown' }, speed: 2.8, scale: 2.6, radius: 0.8, anim: 'hop' },
    { kind: 'walker', u: 0.7, model: 'rabbit', opts: { color: 'grey' }, speed: 2.2, scale: 2.6, radius: 0.8, anim: 'hop' },
    { kind: 'walker', u: 0.9, model: 'rabbit', opts: { color: 'black' }, speed: 3, scale: 2.6, radius: 0.8, anim: 'hop' },
    // bemalte Riesen-Eier rollen quer
    { kind: 'roller', u: 0.3, style: 'model', model: 'easter_egg', opts: { color: 0xff6aa8, stripe: 0xffd23a }, size: 1.4, speed: 5 },
    { kind: 'roller', u: 0.57, style: 'model', model: 'easter_egg', opts: { color: 0x5ab8ff, stripe: 0xffffff }, size: 1.5, speed: 6 },
    { kind: 'roller', u: 0.84, style: 'model', model: 'easter_egg', opts: { color: 0x8ad86a, stripe: 0xff6aa8 }, size: 1.3, speed: 5.5 },
    // Hummeln
    { kind: 'brummer', u: 0.5, speed: 5 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const furs = ['white', 'brown', 'grey', 'black', 'cream'];
    const eggs = [0xff6aa8, 0x5ab8ff, 0xffd23a, 0x8ad86a, 0xb88ad8, 0xff8a3a];
    D.scatter('roundTree', 40, { dist0: 6, dist1: 55, s0: 1, s1: 1.6, colors: [0x5cbf3a, 0x4fae34, 0x6fd04a, 0xffb8d8], size: 2.5 });
    D.scatter('bush', 50, { dist0: 1.5, dist1: 30, s0: 0.6, s1: 1.2, colors: [0x5cbf3a, 0x6fd04a], size: 1.2 });
    D.scatter('flower', 160, { dist0: 0.5, dist1: 18, s0: 1, s1: 1.5, colors: [0xffffff, 0xffd21f, 0xff6fa8, 0xb47fe6], size: 0.3 });
    // der Hasenbau über der Ostgeraden
    D.model('burrow_tunnel', { u: 0.659, lat: 0 }, { opts: { length: 30, width: 28 }, face: 'along' });
    // Möhrenbeete, Riesenmöhren, Kohl im Innenfeld
    for (let k = 0; k < 8; k++) D.model('carrot_patch', W(5 + (k % 2) * 14 - 7, -170 + k * 45), { yaw: Math.PI / 2 });
    for (const [x, z] of [[0, -110], [10, 60], [-10, 150]]) D.model('giant_carrot', W(x, z), { yaw: x * 0.1, scale: 1.2 });
    for (let k = 0; k < 16; k++) D.model('cabbage', W(18 + (k % 4) * 3, -60 + Math.floor(k / 4) * 3), { yaw: k, scale: 1.4 });
    // Windmühle draußen auf dem Hügel, Hasenställe, Hasenlöcher, Eier
    D.model('windmill', W(110, -60), { yaw: Math.PI, scale: 1.2 });
    for (const [u, side] of [[0.05, -1], [0.33, -1], [0.88, -1]]) D.model('hutch', { u, side, dist: 4 }, { face: 'track', scale: 1.2 });
    for (let k = 0; k < 14; k++) D.model('burrow_hole', { u: (k + 0.3) / 14, side: k % 2 ? 1 : -1, dist: 2 + (k % 3) * 4 }, { opts: { color: furs[k % furs.length] }, scale: 1.2 });
    for (let k = 0; k < 18; k++) D.model('egg_deco', { u: (k + 0.6) / 18, side: k % 2 ? -1 : 1, dist: 1.2 + (k % 3) * 2 }, { opts: { color: eggs[k % eggs.length], stripe: eggs[(k + 2) % eggs.length] }, scale: 0.6 + (k % 3) * 0.15 });
    // sitzende und hoppelnde Kaninchen
    for (let k = 0; k < 24; k++) {
      const e = D.model('rabbit', { u: (k + 0.1) / 24, side: k % 2 ? 1 : -1, dist: 2 + (k % 5) * 3 }, { opts: { color: furs[k % furs.length] }, scale: 2.2 + (k % 3) * 0.4, face: 'track', yaw: (k % 5 - 2) * 0.4 });
      if (k % 3 === 0) {
        const c0 = e.model.root.position.clone();
        e.tick = (en, dt, t) => { const a = t * 0.5 + en.t; en.model.root.position.set(c0.x + Math.cos(a) * 3.5, c0.y, c0.z + Math.sin(a) * 3.5); en.model.root.rotation.y = -a - Math.PI / 2; en.model.update(dt, { anim: 'hop', speed: 1 }); };
      }
    }
    for (const [u, side] of [[0.12, 1], [0.48, -1], [0.8, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, -1, ['bunny_small', 'bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small']);
  },
};
