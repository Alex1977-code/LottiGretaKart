// Strecke 17: Katzeninsel – die kleine Insel im Südwesten gehört den Katzen. Die Strecke ist ein großes Herz: an
// Winkekatzen vorbei, um die riesige schlafende Katze in der Mitte herum (sie atmet, der Schwanz schwingt), durch den
// großen Karton-Tunnel („MIAU!“, oben schauen Katzen heraus) und an Kratzbäumen, Näpfen und Kissen vorbei.
// Wollknäuel rollen über die Fahrbahn, Mäuse flitzen quer, Kätzchen tapsen herum.

export default {
  id: 'katzeninsel',
  name: 'Katzeninsel',
  short: 'Katzen',
  theme: 'cats',
  music: 'course_grass',
  banner: 'KATZENINSEL',
  hw: 7.5,
  margin: 4,
  seed: 203,
  // Herz (im Uhrzeigersinn von oben): rechts = innen
  ctrl: [
    [127, -49], [114, -9], [84, 26], [52, 58], [26, 86], [0, 110], [-26, 86], [-52, 58], [-84, 26], [-114, -9],
    [-127, -49], [-117, -86], [-89, -110], [-54, -113], [-26, -97], [0, -78], [26, -97], [54, -113], [89, -110], [117, -86],
  ],
  items: [0.08, 0.32, 0.56, 0.82],
  boosts: [[0.12, 0], [0.42, 0.3], [0.63, -0.3], [0.9, 0]],
  ramps: [[0.5, 0, 6]],
  coins: [[0.03, 0.06, -0.4, 0.4, 5], [0.22, 0.25, 0.4, -0.4, 5], [0.45, 0.48, 0, 0, 5], [0.66, 0.69, 0, 0, 5], [0.86, 0.89, -0.3, 0.3, 4]],
  hazards: [
    // Wollknäuel rollen quer
    { kind: 'roller', u: 0.16, style: 'model', model: 'yarn_ball', opts: { color: 0xff5aa8 }, size: 1.4, speed: 5 },
    { kind: 'roller', u: 0.62, style: 'model', model: 'yarn_ball', opts: { color: 0x5ab8ff }, size: 1.5, speed: 6 },
    { kind: 'roller', u: 0.93, style: 'model', model: 'yarn_ball', opts: { color: 0xffd23a }, size: 1.3, speed: 5.5 },
    // Mäuse flitzen, Kätzchen tapsen über die Fahrbahn
    { kind: 'walker', u: 0.3, model: 'mouse', speed: 4.5, scale: 3.2, radius: 0.6 },
    { kind: 'walker', u: 0.55, model: 'mouse', speed: 5, scale: 3.2, radius: 0.6 },
    { kind: 'walker', u: 0.84, model: 'mouse', speed: 4, scale: 3.2, radius: 0.6 },
    { kind: 'walker', u: 0.21, model: 'kitten', opts: { color: 'white' }, speed: 1.6, scale: 3.0, radius: 0.9 },
    { kind: 'walker', u: 0.72, model: 'kitten', opts: { color: 'black' }, speed: 1.8, scale: 3.0, radius: 0.9 },
  ],
  scenery(D) {
    const tr = D.track;
    const W = (x, z) => ({ x: tr.ox + x, z: tr.oz + z });
    const colors = ['orange', 'black', 'white', 'grey', 'calico', 'tabby'];
    D.scatter('roundTree', 30, { dist0: 5, dist1: 50, s0: 1, s1: 1.5, colors: [0xff9ac8, 0xb88ad8, 0x8ad86a, 0xffb8d8], size: 2.5 });
    D.scatter('bush', 40, { dist0: 1.5, dist1: 30, s0: 0.6, s1: 1.1, colors: [0x8ad86a, 0xff9ac8], size: 1.2 });
    D.scatter('flower', 120, { dist0: 0.5, dist1: 16, s0: 1, s1: 1.4, colors: [0xff6aa8, 0xffffff, 0xffd23a, 0xb88ad8], size: 0.3 });
    // riesige schlafende Katze in der Herzmitte
    D.model('giant_cat', W(-6, -10), { opts: { color: 'orange' }, yaw: 0.3, scale: 1.25 });
    // Kratzbäume in den Herzbögen
    D.model('cat_tree', W(62, -62), { yaw: 0.6, scale: 1.4 });
    D.model('cat_tree', W(-62, -62), { yaw: 2.2, scale: 1.4 });
    // Karton-Tunnel über der Fahrbahn (unten links)
    D.model('cat_box', { u: 0.396, lat: 0 }, { opts: { length: 24, width: 28 }, face: 'along' });
    // Winkekatzen am Start, Katzen überall am Rand
    D.model('lucky_cat', { u: 0.985, side: 1, dist: 3 }, { face: 'track', scale: 1.8 });
    D.model('lucky_cat', { u: 0.985, side: -1, dist: 3 }, { face: 'track', scale: 1.8 });
    for (let k = 0; k < 30; k++) {
      const e = D.model('cat', { u: (k + 0.4) / 30, side: k % 2 ? 1 : -1, dist: 1.5 + (k % 4) * 3 }, { opts: { color: colors[k % colors.length] }, scale: 3 + (k % 3) * 0.6, face: 'track', yaw: (k % 5 - 2) * 0.3 });
      if (k % 4 === 0) {
        // ein paar Katzen streifen herum
        const c0 = e.model.root.position.clone();
        e.tick = (en, dt, t) => { const a = t * 0.4 + en.t; en.model.root.position.set(c0.x + Math.cos(a) * 3, c0.y, c0.z + Math.sin(a) * 3); en.model.root.rotation.y = -a - Math.PI / 2; en.model.update(dt, { anim: 'walk', speed: 1 }); };
      }
    }
    // Näpfe, Kissen, Fischgräten, Wollknäuel als Deko
    for (let k = 0; k < 10; k++) D.model('cat_bowl', { u: (k + 0.7) / 10, side: k % 2 ? -1 : 1, dist: 3 + (k % 3) * 4 }, { scale: 1.4 });
    const cush = [0xff9ac8, 0xb88ad8, 0x5ab8ff, 0xffd23a];
    for (let k = 0; k < 12; k++) D.model('cushion', { u: (k + 0.2) / 12, side: k % 2 ? 1 : -1, dist: 8 + (k % 3) * 5 }, { opts: { color: cush[k % 4] }, scale: 1.3 });
    for (const [u, side] of [[0.07, -1], [0.33, 1], [0.6, -1], [0.78, 1]]) D.model('fish_bone', { u, side, dist: 4 }, { face: 'along', scale: 1.2 });
    for (let k = 0; k < 8; k++) D.model('yarn_ball', { u: (k + 0.55) / 8, side: k % 2 ? 1 : -1, dist: 5 + (k % 3) * 4 }, { opts: { color: [0xff5aa8, 0x5ab8ff, 0xffd23a, 0x8ad86a][k % 4] }, y: 1, scale: 1 });
    // Katzen rund um die schlafende Riesin
    for (let k = 0; k < 6; k++) { const a = k * 1.05; D.model('kitten', W(-6 + Math.cos(a) * 26, -10 + Math.sin(a) * 20), { opts: { color: colors[(k + 2) % colors.length] }, yaw: -a + Math.PI, scale: 3 }); }
    for (const [u, side] of [[0.1, 1], [0.45, -1], [0.75, 1]]) D.model('question_block', { u, side, dist: 2.5 }, { y: 3.4, scale: 1.4, tick: (e, dt, t) => { e.model.root.rotation.y = t * 0.8 + e.t; e.model.update(dt, 'idle'); } });
    D.crowd(0.975, -1, ['bunny_small', 'fairy_spotter', 'pilzling', 'bunny_small']);
  },
};
