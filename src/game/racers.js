// Die acht Fahrer von Lotti & Greta Kart – alle aus der Lotti-&-Greta-Welt.
// Werte (1..5): speed = Höchsttempo, accel = Beschleunigung, weight = Gewicht (Rempeln), handling = Lenkung,
// offroad = Wiese/Sand. Kart-Farben passend zur Figur.

export const RACERS = [
  {
    id: 'lotti', name: 'Lotti', kind: 'hero', hero: 'lotti',
    blurb: 'Zöpfe, rote Schleife, blaues Kleid – flink in den Kurven.',
    stats: { speed: 3, accel: 4, weight: 2, handling: 4, offroad: 3 },
    kart: { main: 0x3b7cf0, accent: 0xe83a30, trim: 0xf8f6f0, rim: 0xffc21a, flag: 0xe83a30, seat: 0x7c4a24 },
    color: '#3b7cf0',
  },
  {
    id: 'greta', name: 'Greta', kind: 'hero', hero: 'greta',
    blurb: 'Langes Haar mit Haarreif, grünes Kleid – schnell auf der Geraden.',
    stats: { speed: 4, accel: 3, weight: 2, handling: 3, offroad: 3 },
    kart: { main: 0x4fb833, accent: 0xf0609f, trim: 0xfff3df, rim: 0xffffff, flag: 0xf0609f, seat: 0x7d2e42 },
    color: '#4fb833',
  },
  {
    id: 'pflaume', name: 'Pflaume', kind: 'pflaume',
    blurb: 'Schwarzes Schlappohr-Kaninchen – federleicht, schießt sofort los.',
    stats: { speed: 2, accel: 5, weight: 1, handling: 5, offroad: 4 },
    kart: { main: 0xb47fe6, accent: 0xff8a2a, trim: 0xf4f1f8, rim: 0xff8a2a, flag: 0x5cbf3a, seat: 0x2a2630 },
    color: '#b47fe6',
  },
  {
    id: 'pilzling', name: 'Pilzling', kind: 'model', model: 'pilzling',
    blurb: 'Dicker oranger Hut mit Cremepunkten – klein und wendig.',
    stats: { speed: 2, accel: 5, weight: 1, handling: 4, offroad: 5 },
    kart: { main: 0xff8a2a, accent: 0xfff0d0, trim: 0xfff8ee, rim: 0xffc21a, flag: 0xfff0d0, seat: 0x7a4a2a },
    color: '#ff8a2a',
    seat: { y: -0.04, x: 0.02, scale: 1.0 },
    anims: { drive: 'idle', hit: 'stunned', cheer: 'alert', sad: 'idle' },
  },
  {
    id: 'panzerkroete', name: 'Panzerkröte', kind: 'model', model: 'panzerkroete',
    blurb: 'Grüne Kröte mit magentafarbenem Panzer – robust und ausgewogen.',
    stats: { speed: 3, accel: 3, weight: 3, handling: 3, offroad: 3 },
    kart: { main: 0xd23a8a, accent: 0xffd21f, trim: 0x6ccf4a, rim: 0xffd21f, flag: 0xffd21f, seat: 0x5a2a6a },
    color: '#d23a8a',
    seat: { y: -0.3, x: 0.0, scale: 0.85 },
    anims: { drive: 'idle', hit: 'stunned', cheer: 'walk', sad: 'idle' },
  },
  {
    id: 'zauberkroete', name: 'Zauberkröte', kind: 'model', model: 'zauberkroete',
    blurb: 'Zauberhut, Umhang und Kristallstab – trickst in jeder Kurve.',
    stats: { speed: 3, accel: 3, weight: 2, handling: 5, offroad: 2 },
    kart: { main: 0xb8203a, accent: 0xffc21a, trim: 0x2a1a4a, rim: 0x3ae0d0, flag: 0x3ae0d0, seat: 0x2a1a4a },
    color: '#b8203a',
    seat: { y: -0.36, x: 0.0, scale: 0.78 },
    anims: { drive: 'idle', hit: 'appear', cheer: 'cast', sad: 'idle', throw: 'cast' },
  },
  {
    id: 'bulle', name: 'Rammbock-Bulle', kind: 'model', model: 'rammbock_bulle',
    blurb: 'Blauer Helm, goldener Nasenring – schiebt alle aus dem Weg.',
    stats: { speed: 4, accel: 2, weight: 5, handling: 2, offroad: 3 },
    kart: { main: 0x2a5fc8, accent: 0xffcf3a, trim: 0xe8392d, rim: 0xffcf3a, flag: 0xe8392d, seat: 0x2a2f4a },
    color: '#2a5fc8',
    seat: { y: -0.5, x: -0.05, scale: 0.62 },
    anims: { drive: 'idle', hit: 'hit', cheer: 'walk', sad: 'stunned' },
  },
  {
    id: 'krallenpilzling', name: 'Krallen-Pilzling', kind: 'model', model: 'krallen_pilzling',
    blurb: 'Gestreifte Krallen-Mütze und Katzenaugen – kratzt die Kurve.',
    stats: { speed: 3, accel: 4, weight: 1, handling: 4, offroad: 4 },
    kart: { main: 0xffb03a, accent: 0x8a5aff, trim: 0xfff3df, rim: 0x8a5aff, flag: 0xffb03a, seat: 0x5a3a2a },
    color: '#ffb03a',
    seat: { y: -0.06, x: 0.02, scale: 0.95 },
    anims: { drive: 'idle', hit: 'stunned', cheer: 'alert', sad: 'idle', throw: 'pounce' },
  },
  {
    id: 'kickbombe', name: 'Kickbombe', kind: 'model', model: 'kickbombe',
    blurb: 'Runde Bombe mit Goldgürtel und Zündschnur – explosiv schnell.',
    stats: { speed: 4, accel: 3, weight: 2, handling: 3, offroad: 2 },
    kart: { main: 0x2c3274, accent: 0xffc21a, trim: 0xb8c0d8, rim: 0xff9a1a, flag: 0xff9a1a, seat: 0x15102a },
    color: '#4a52b4',
    seat: { y: -0.05, x: 0.0, scale: 1.05 },
    anims: { drive: 'idle', hit: 'lit', cheer: 'walk', sad: 'idle', boost: 'lit' },
  },
  {
    id: 'wuehler', name: 'Wühler', kind: 'model', model: 'wuehler', modelOpts: { ground: 'earth' }, hideFirst: true,
    blurb: 'Maulwurf mit Taucherbrille – gräbt sich durch jedes Gelände.',
    stats: { speed: 2, accel: 4, weight: 2, handling: 3, offroad: 5 },
    kart: { main: 0x4a5ab0, accent: 0xff8a1a, trim: 0xa9b6ee, rim: 0x3ae0d0, flag: 0xff8a1a, seat: 0x2a2f4a },
    color: '#4a5ab0',
    seat: { y: -0.1, x: 0.0, scale: 1.05 },
    anims: { drive: 'idle', hit: 'hide', cheer: 'pop', sad: 'hide' },
  },
  {
    id: 'kobold', name: 'Waldkobold', kind: 'model', model: 'fairy_spotter',
    blurb: 'Grüner Kittel, rote Zipfelmütze, Fernglas – sieht jede Abkürzung.',
    stats: { speed: 3, accel: 3, weight: 1, handling: 4, offroad: 4 },
    kart: { main: 0x3f9a2a, accent: 0xe8392d, trim: 0xfff3df, rim: 0xffc21a, flag: 0xe8392d, seat: 0x5a3a1a },
    color: '#3f9a2a',
    seat: { y: -0.05, x: 0.0, scale: 1.2 },
    anims: { drive: 'idle', hit: 'look', cheer: 'cheer', sad: 'idle' },
  },
  {
    id: 'baron', name: 'Baron Brummbär', kind: 'baron', model: 'baron_brummbaer',
    blurb: 'Zylinder, Monokel und roter Roadster – der schwerste und schnellste.',
    stats: { speed: 5, accel: 1, weight: 5, handling: 2, offroad: 2 },
    kart: { main: 0xd8262e, accent: 0xffc21a, trim: 0x2a1a20, rim: 0xffc21a, flag: 0x6a3aa0, seat: 0x2a1a20 },
    color: '#d8262e',
    scale: 0.4,
  },
];

export const RACER_BY_ID = Object.fromEntries(RACERS.map((r) => [r.id, r]));

/** Fahrwerte aus den Stufen (Meter, Sekunden). cc = Klasse (Faktor auf das Tempo). */
export function physicsOf(racer, cc = 1) {
  const s = racer.stats;
  return {
    top: (19.5 + 1.1 * s.speed) * cc,          // m/s
    accel: 6.5 + 2.2 * s.accel,                // m/s² am Start
    weight: 0.6 + 0.35 * s.weight,
    turn: 1.55 + 0.17 * s.handling,            // rad/s
    grip: 5 + 0.8 * s.handling,
    offroad: 0.42 + 0.06 * s.offroad,          // Tempo-Faktor auf Wiese
  };
}
