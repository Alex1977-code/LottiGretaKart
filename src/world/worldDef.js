// Die Grüne Blockinsel als zusammenhängende Welt (wie Mario Kart World): elf Rennstrecken als Regionen, verbunden
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
import strand from '../tracks/strand.js';
import gipfel from '../tracks/gipfel.js';
import burg from '../tracks/burg.js';
import wueste from '../tracks/wueste.js';
import vulkan from '../tracks/vulkan.js';
import bonbon from '../tracks/bonbon.js';

export const WORLD = {
  name: 'Grüne Blockinsel',
  // Insel als Ellipse mit welliger Küste
  island: { cx: 70, cz: -10, rx: 1100, rz: 800 },
  bounds: { minX: -1180, maxX: 1320, minZ: -920, maxZ: 900 },
  courses: [
    { def: kraxelwiese, ox: -20, oz: -60 },
    { def: herbstwald, ox: 0, oz: -278 },
    { def: laternengrotte, ox: -414, oz: 18 },
    { def: manege, ox: -335, oz: 280 },
    { def: autobahn, ox: 430, oz: 120 },
    { def: strand, ox: 140, oz: 445 },
    { def: gipfel, ox: 620, oz: -190 },
    { def: burg, ox: -200, oz: -515 },
    { def: wueste, ox: 880, oz: 60 },
    { def: vulkan, ox: -700, oz: 380 },
    { def: bonbon, ox: -690, oz: -340 },
  ],
  connectors: [
    { id: 'wiese-wald', a: ['kraxelwiese', 0.075, -1], b: ['herbstwald', 0.045, 1], via: [[40, -140], [10, -190]], hw: 6.5, items: [0.5], coins: [[0.3, 0.4]] },
    { id: 'wiese-stadt', a: ['kraxelwiese', 0.24, -1], b: ['autobahn', 0.86, -1], via: [[175, 30], [180, 110]], hw: 6.5, items: [0.5], coins: [[0.6, 0.7]] },
    { id: 'wiese-grotte', a: ['kraxelwiese', 0.78, -1], b: ['laternengrotte', 0.2, 1], via: [[-190, -40], [-240, -10]], hw: 6.5, items: [0.45] },
    { id: 'wiese-zirkus', a: ['kraxelwiese', 0.585, -1], b: ['manege', 0.2, -1], via: [[-60, 140], [-110, 230], [-150, 300]], hw: 7, items: [0.55], coins: [[0.25, 0.4]] },
    { id: 'wald-grotte', a: ['herbstwald', 0.66, 1], b: ['laternengrotte', 0.69, 1], via: [[-260, -300], [-360, -220], [-470, -160]], hw: 6.5, items: [0.35, 0.7], coins: [[0.5, 0.6]] },
    { id: 'grotte-zirkus', a: ['laternengrotte', 0.04, 1], b: ['manege', 0.05, -1], via: [[-360, 110], [-330, 190]], hw: 6.5, items: [0.5] },
    { id: 'wald-stadt', a: ['herbstwald', 0.2, 1], b: ['autobahn', 0.05, -1], via: [[260, -300], [380, -180], [470, -40]], hw: 7, items: [0.3, 0.7], coins: [[0.45, 0.55]] },
    { id: 'wiese-strand', a: ['kraxelwiese', 0.4, -1], b: ['strand', 0.9, -1], via: [[110, 120], [165, 200], [162, 300], [120, 380]], hw: 6.5, items: [0.5], coins: [[0.3, 0.4]] },
    { id: 'strand-stadt', a: ['strand', 0.2, -1], b: ['autobahn', 0.66, -1], via: [[330, 370]], hw: 6.5, items: [0.5] },
    { id: 'stadt-gipfel', a: ['autobahn', 0.15, -1], b: ['gipfel', 0.9, 1], via: [[600, 40], [575, -60]], hw: 6.5, items: [0.5], coins: [[0.6, 0.7]] },
    { id: 'wald-gipfel', a: ['herbstwald', 0.3, 1], b: ['gipfel', 0.68, 1], via: [[230, -440], [340, -420], [430, -320]], hw: 6.5, items: [0.35, 0.7], coins: [[0.5, 0.6]] },
    { id: 'wald-burg', a: ['herbstwald', 0.6, 1], b: ['burg', 0.28, -1], via: [], hw: 6.5 },
    { id: 'stadt-wueste', a: ['autobahn', 0.25, -1], b: ['wueste', 0.8, 1], via: [[732, 90]], hw: 7, items: [0.5] },
    { id: 'gipfel-wueste', a: ['gipfel', 0.2, 1], b: ['wueste', 0.7, 1], via: [[790, -170]], hw: 6.5, items: [0.5], coins: [[0.4, 0.5]] },
    { id: 'zirkus-vulkan', a: ['manege', 0.8, -1], b: ['vulkan', 0.2, -1], via: [[-505, 375]], hw: 6.5, items: [0.5] },
    { id: 'grotte-vulkan', a: ['laternengrotte', 0.85, 1], b: ['vulkan', 0.9, -1], via: [[-600, 120], [-700, 260]], hw: 6.5, items: [0.35, 0.7], coins: [[0.5, 0.6]] },
    { id: 'burg-bonbon', a: ['burg', 0.7, -1], b: ['bonbon', 0.2, 1], via: [[-430, -440]], hw: 6.5, items: [0.5], coins: [[0.4, 0.5]] },
    { id: 'grotte-bonbon', a: ['laternengrotte', 0.75, 1], b: ['bonbon', 0.9, 1], via: [[-650, -110], [-730, -240]], hw: 6.5, items: [0.4, 0.75] },
  ],
  lakes: [
    { x: -40, z: 205, r: 95, depth: 4 },
    { x: 60, z: 260, r: 70, depth: 3 },
    { x: 100, z: 497, r: 12, depth: 1.5 },   // Lagune im Funkelstrand
    { x: 200, z: 728, r: 140, depth: 6 },    // Bucht südlich vom Funkelstrand (offen zum Meer)
    { x: 380, z: 700, r: 110, depth: 6 },
  ],
  flats: [
    { x: 0, z: 0, r: 175, h: 3 },            // Kraxelwiese-Stadion
    { x: -420, z: -40, r: 175, h: 4 },       // Höhlenberg innen
    { x: -320, z: 330, r: 165, h: 2.5 },     // Zirkuszelt
    { x: 455, z: 192, r: 290, h: 3 },        // Stadt und Autobahn
    { x: 0, z: -330, r: 175, h: 6 },         // Herbstwald (leicht erhöht)
    { x: 182, z: 490, r: 130, h: 2 },        // Funkelstrand
    { x: 620, z: -215, r: 150, h: 20 },      // Glitzergipfel (Hochplateau)
    { x: -200, z: -500, r: 135, h: 10 },     // Brummbär-Burg auf der Nordklippe
    { x: 925, z: 0, r: 190, h: 3 },          // Sonnenschlucht
    { x: -700, z: 428, r: 145, h: 5 },       // Feuerberg
    { x: -690, z: -398, r: 150, h: 8 },      // Zuckerwatten-Allee
  ],
  hills: [
    [180, -120, 70, 14], [-200, -200, 80, 18], [330, -540, 80, 22], [-460, -580, 70, 30], [-650, -300, 120, 45],
    [-640, 120, 110, 30], [620, -260, 120, 38], [780, 80, 90, 20], [160, 420, 80, 12], [-560, 470, 90, 16],
    [400, -560, 90, 26], [120, -620, 90, 24], [-760, -60, 90, 40],
    [860, -300, 70, 55], [520, -390, 70, 50], [740, -360, 70, 40],   // Schneeberge um den Glitzergipfel
    [-880, 330, 70, 62], [-560, 560, 60, 30],   // Vulkankegel und Aschehügel
    [1080, 220, 80, 28], [1000, -260, 70, 26],  // Tafelland der Wüste
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
    { theme: 'beach', x: 182, z: 500, r: 170, fade: 90 },
    { theme: 'snow', x: 620, z: -215, r: 160, fade: 90 },
    { theme: 'castle', x: -200, z: -500, r: 130, fade: 70 },
    { theme: 'desert', x: 950, z: 0, r: 200, fade: 90 },
    { theme: 'volcano', x: -700, z: 428, r: 150, fade: 80 },
    { theme: 'candy', x: -690, z: -398, r: 150, fade: 80 },
  ],
  // Grind-Schienen: über den See (Abkürzung) und neben der Waldstraße
  rails: [
    { pts: [[-150, 300], [-110, 250], [-60, 200], [-20, 160]], h: 1.6 },
    { pts: [[52, -128], [22, -168], [8, -205]], h: 0.9 },
    { pts: [[300, -270], [380, -190], [440, -110]], h: 0.9 },
    { pts: [[180, 190], [178, 250], [174, 300]], h: 0.9 },
  ],
  // Sternmünzen für die Freie Fahrt (versteckt über die Insel)
  starCoins: [
    [60, 120], [-150, 40], [230, -60], [-60, -180], [120, -250], [-250, -330], [300, -320], [-520, -40], [-420, 60],
    [-300, 230], [-430, 400], [-200, 420], [-40, 290], [80, 300], [250, 120], [380, 40], [560, 120], [650, 260],
    [420, 300], [520, -120], [-600, 220], [-100, -380], [0, -440], [170, -400], [700, -50], [-700, -150],
    [200, 330], [-560, -220], [330, -430], [-260, 120],
    [100, 497], [420, 470], [610, -225], [450, -440], [-330, -430], [0, -500],
    [1000, -130], [700, 40], [-700, 432], [-560, 300], [-690, -400], [-840, -250],
  ],
};

/** Cups im Grand Prix: von Strecke zu Strecke (ab dem zweiten Rennen mit Anfahrt über die Verbindungsstraße). */
export const WORLD_CUPS = [
  { id: 'beeren', name: 'Beeren-Cup', tracks: ['kraxelwiese', 'herbstwald', 'laternengrotte', 'manege'] },
  { id: 'brummbaer', name: 'Brummbär-Cup', tracks: ['manege', 'kraxelwiese', 'autobahn', 'herbstwald'] },
  { id: 'muschel', name: 'Muschel-Cup', tracks: ['manege', 'kraxelwiese', 'strand', 'autobahn'] },
  { id: 'kronen', name: 'Kronen-Cup', tracks: ['autobahn', 'gipfel', 'herbstwald', 'burg'] },
  { id: 'bonbon', name: 'Bonbon-Cup', tracks: ['burg', 'bonbon', 'laternengrotte', 'vulkan'] },
  { id: 'wuesten', name: 'Wüsten-Cup', tracks: ['gipfel', 'wueste', 'autobahn', 'strand'] },
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
  {
    id: 'kueste', name: 'Küste und Gipfel',
    stops: ['strand', 'autobahn', 'gipfel', 'herbstwald', 'burg'],
    survivors: [9, 6, 4],
  },
  {
    id: 'wild', name: 'Wilde Weltreise',
    stops: ['wueste', 'gipfel', 'herbstwald', 'burg', 'bonbon', 'laternengrotte', 'vulkan'],
    survivors: [10, 8, 6, 5, 4],
  },
];
