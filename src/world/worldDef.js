// Die Grüne Blockinsel als zusammenhängende Welt (wie Mario Kart World): fünf Rennstrecken als Regionen, verbunden
// durch Landstraßen, ein See (darauf fährt man über das Wasser), Berge, Küste. Koordinaten in Metern, x = Osten,
// z = Süden, Meeresspiegel y = 0.
//
// courses     Strecke (Definition aus src/tracks) + Verschiebung in die Welt.
// connectors  Verbindungsstraße zwischen zwei Strecken: an jeder Strecke ein Tor (u = Rundenanteil, side = Seite
//             relativ zur Fahrtrichtung, +1 rechts / −1 links), dazwischen Wegpunkte. Befahrbar in beide Richtungen.
// regions     Stimmung (Himmel, Licht, Bodenfarben) mit Mittelpunkt und Radius – wird beim Fahren übergeblendet.
// flats       ebene Flächen (Stadion, Zelt, Höhle, Stadt), damit Bauten und Strecken nicht auf Hügeln stehen.
// rails       Grind-Schienen (Polylinie, Höhe über Boden bzw. über dem Wasser).

import kraxelwiese from '../tracks/kraxelwiese.js';
import herbstwald from '../tracks/herbstwald.js';
import laternengrotte from '../tracks/laternengrotte.js';
import manege from '../tracks/manege.js';
import autobahn from '../tracks/autobahn.js';

export const WORLD = {
  name: 'Grüne Blockinsel',
  // Insel als Ellipse mit welliger Küste
  island: { cx: 70, cz: -10, rx: 800, rz: 560 },
  bounds: { minX: -900, maxX: 1050, minZ: -760, maxZ: 740 },
  courses: [
    { def: kraxelwiese, ox: -20, oz: -60 },
    { def: herbstwald, ox: 0, oz: -278 },
    { def: laternengrotte, ox: -414, oz: 18 },
    { def: manege, ox: -335, oz: 280 },
    { def: autobahn, ox: 430, oz: 120 },
  ],
  connectors: [
    { id: 'wiese-wald', a: ['kraxelwiese', 0.075, -1], b: ['herbstwald', 0.045, 1], via: [[40, -140], [10, -190]], hw: 6.5, items: [0.5], coins: [[0.3, 0.4]] },
    { id: 'wiese-stadt', a: ['kraxelwiese', 0.24, -1], b: ['autobahn', 0.86, -1], via: [[175, 30], [180, 110]], hw: 6.5, items: [0.5], coins: [[0.6, 0.7]] },
    { id: 'wiese-grotte', a: ['kraxelwiese', 0.78, -1], b: ['laternengrotte', 0.2, 1], via: [[-190, -40], [-240, -10]], hw: 6.5, items: [0.45] },
    { id: 'wiese-zirkus', a: ['kraxelwiese', 0.585, -1], b: ['manege', 0.2, -1], via: [[-60, 140], [-110, 230], [-150, 300]], hw: 7, items: [0.55], coins: [[0.25, 0.4]] },
    { id: 'wald-grotte', a: ['herbstwald', 0.66, 1], b: ['laternengrotte', 0.69, 1], via: [[-260, -300], [-360, -220], [-470, -160]], hw: 6.5, items: [0.35, 0.7], coins: [[0.5, 0.6]] },
    { id: 'grotte-zirkus', a: ['laternengrotte', 0.04, 1], b: ['manege', 0.05, -1], via: [[-360, 110], [-330, 190]], hw: 6.5, items: [0.5] },
    { id: 'wald-stadt', a: ['herbstwald', 0.2, 1], b: ['autobahn', 0.05, -1], via: [[260, -300], [380, -180], [470, -40]], hw: 7, items: [0.3, 0.7], coins: [[0.45, 0.55]] },
  ],
  lakes: [
    { x: -40, z: 205, r: 95, depth: 4 },
    { x: 60, z: 260, r: 70, depth: 3 },
  ],
  flats: [
    { x: 0, z: 0, r: 175, h: 3 },            // Kraxelwiese-Stadion
    { x: -420, z: -40, r: 175, h: 4 },       // Höhlenberg innen
    { x: -320, z: 330, r: 165, h: 2.5 },     // Zirkuszelt
    { x: 455, z: 192, r: 290, h: 3 },        // Stadt und Autobahn
    { x: 0, z: -330, r: 175, h: 6 },         // Herbstwald (leicht erhöht)
  ],
  hills: [
    [180, -120, 70, 14], [-200, -200, 80, 18], [250, -420, 90, 22], [-120, -470, 80, 20], [-650, -300, 120, 45],
    [-640, 120, 110, 30], [620, -260, 120, 38], [780, 80, 90, 20], [160, 420, 80, 12], [-560, 470, 90, 16],
    [380, -540, 100, 30], [-330, -560, 90, 26], [120, -600, 90, 24], [-760, -60, 90, 40],
  ],
  // Höhle im Berg und Zirkuszelt als Bauwerke über den Strecken (Eingänge entstehen an den Verbindungsstraßen)
  structures: [
    { kind: 'cave', x: -420, z: -40, r: 168, h: 46 },
    { kind: 'tent', x: -320, z: 330, r: 150, h: 18, roof: 34 },
  ],
  regions: [
    { theme: 'grass', x: 0, z: 0, r: 260, base: true },
    { theme: 'autumn', x: 0, z: -330, r: 220 },
    { theme: 'cave', x: -420, z: -40, r: 150, fade: 30 },
    { theme: 'circus', x: -320, z: 330, r: 135, fade: 30 },
    { theme: 'highway', x: 455, z: 192, r: 300 },
  ],
  // Grind-Schienen: über den See (Abkürzung) und neben der Waldstraße
  rails: [
    { pts: [[-150, 300], [-110, 250], [-60, 200], [-20, 160]], h: 1.6 },
    { pts: [[52, -128], [22, -168], [8, -205]], h: 0.9 },
    { pts: [[300, -270], [380, -190], [440, -110]], h: 0.9 },
  ],
  // Sternmünzen für die Freie Fahrt (versteckt über die Insel)
  starCoins: [
    [60, 120], [-150, 40], [230, -60], [-60, -180], [120, -250], [-250, -330], [300, -320], [-520, -40], [-420, 60],
    [-300, 230], [-430, 400], [-200, 420], [-40, 290], [80, 300], [250, 120], [380, 40], [560, 120], [650, 260],
    [420, 300], [520, -120], [-600, 220], [-100, -380], [0, -440], [170, -400], [700, -50], [-700, -150],
    [200, 330], [-560, -220], [330, -430], [-260, 120],
  ],
};

/** Cups im Grand Prix: von Strecke zu Strecke (ab dem zweiten Rennen mit Anfahrt über die Verbindungsstraße). */
export const WORLD_CUPS = [
  { id: 'beeren', name: 'Beeren-Cup', tracks: ['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege'] },
  { id: 'brummbaer', name: 'Brummbär-Cup', tracks: ['manege', 'kraxelwiese', 'autobahn', 'herbstwald'] },
];

/** K.-o.-Tour: Rallye quer über die Insel; an jedem Checkpoint scheiden die Letzten aus. */
export const KO_TOURS = [
  {
    id: 'insel', name: 'Große Inseltour',
    // Folge von Strecken; zwischen zwei Strecken wird die Verbindungsstraße gefahren
    stops: ['kraxelwiese', 'autobahn', 'herbstwald', 'laternengrotte', 'manege', 'kraxelwiese'],
    survivors: [10, 8, 6, 4],
  },
  {
    id: 'kurz', name: 'Kleine Runde',
    stops: ['manege', 'laternengrotte', 'herbstwald', 'kraxelwiese'],
    survivors: [8, 4],
  },
];
