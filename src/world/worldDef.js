// Die Grüne Blockinsel als zusammenhängende Welt (wie Mario Kart World): einundzwanzig Rennstrecken als Regionen, verbunden
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
import loroparque from '../tracks/loroparque.js';
import piratenbucht from '../tracks/piratenbucht.js';
import dinodschungel from '../tracks/dinodschungel.js';
import wrackriff from '../tracks/wrackriff.js';
import spukinsel from '../tracks/spukinsel.js';
import katzeninsel from '../tracks/katzeninsel.js';
import hasenhuegel from '../tracks/hasenhuegel.js';
import palmencity from '../tracks/palmencity.js';
import mitternacht from '../tracks/mitternacht.js';
import teneriffa from '../tracks/teneriffa.js';
import hafenstadt from '../tracks/hafenstadt.js';
import arena from '../tracks/arena.js';
import schlossring from '../tracks/schlossring.js';
import schlucht from '../tracks/schlucht.js';

export const WORLD = {
  name: 'Grüne Blockinsel',
  // Insel als Ellipse mit welliger Küste
  island: { cx: 70, cz: -10, rx: 1100, rz: 800 },
  bounds: { minX: -1300, maxX: 1740, minZ: -1300, maxZ: 1300 },
  // Nachbarinseln vor der Küste (über Straßen auf dem Wasser erreichbar)
  islets: [
    { name: 'Spukinsel', x: -900, z: -730, rx: 200, rz: 165 },
    { name: 'Katzeninsel', x: -1040, z: 720, rx: 195, rz: 165 },
    { name: 'Palmen-City', x: 1470, z: 300, rx: 235, rz: 195 },
    { name: 'Neon-Insel', x: 1300, z: -430, rx: 240, rz: 190 },
    { name: 'Teneriffa', x: 1180, z: 820, rx: 300, rz: 250 },
    { name: 'Hafenstadt', x: -480, z: 1035, rx: 265, rz: 150 },
    { name: 'Arena', x: 60, z: 1015, rx: 215, rz: 130 },
    { name: 'Schlossberg', x: 560, z: 1040, rx: 270, rz: 170 },
    { name: 'Schluchtinsel', x: -490, z: -1090, rx: 270, rz: 160 },
  ],
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
    { def: loroparque, ox: 600, oz: 410 },
    { def: piratenbucht, ox: -320, oz: 590 },
    { def: dinodschungel, ox: 350, oz: -610 },
    { def: wrackriff, ox: 40, oz: -770 },
    { def: spukinsel, ox: -900, oz: -730 },
    { def: katzeninsel, ox: -1040, oz: 720 },
    { def: hasenhuegel, ox: -870, oz: 40 },
    { def: palmencity, ox: 1470, oz: 300 },
    { def: mitternacht, ox: 1300, oz: -430 },
    { def: teneriffa, ox: 1180, oz: 820 },
    { def: hafenstadt, ox: -480, oz: 1060 },
    { def: arena, ox: 70, oz: 1050 },
    { def: schlossring, ox: 560, oz: 1060 },
    { def: schlucht, ox: -480, oz: -1090 },
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
    { id: 'strand-zoo', a: ['strand', 0.3, -1], b: ['loroparque', 0.82, -1], via: [[400, 500]], hw: 6.5, items: [0.5], coins: [[0.3, 0.4]] },
    { id: 'stadt-zoo', a: ['autobahn', 0.33, -1], b: ['loroparque', 0.15, -1], via: [[740, 330]], hw: 6.5, items: [0.5], coins: [[0.6, 0.7]] },
    { id: 'zirkus-piraten', a: ['manege', 0.66, -1], b: ['piratenbucht', 0.95, -1], via: [[-390, 470]], hw: 6.5, items: [0.5] },
    { id: 'piraten-vulkan', a: ['piratenbucht', 0.84, -1], b: ['vulkan', 0.27, -1], via: [[-540, 540]], hw: 6.5, items: [0.5], coins: [[0.4, 0.5]] },
    { id: 'wald-dino', a: ['herbstwald', 0.375, 1], b: ['dinodschungel', 0.38, -1], via: [[200, -500]], hw: 6.5, items: [0.5], coins: [[0.35, 0.45]] },
    { id: 'dino-gipfel', a: ['dinodschungel', 0.2, -1], b: ['gipfel', 0.5, 1], via: [[480, -470]], hw: 6.5, items: [0.5] },
    { id: 'riff-dino', a: ['wrackriff', 0.14, 1], b: ['dinodschungel', 0.45, -1], via: [[200, -690], [270, -610]], hw: 6.5, items: [0.5], coins: [[0.35, 0.45]] },
    { id: 'burg-riff', a: ['burg', 0.85, -1], b: ['wrackriff', 0.95, 1], via: [[-170, -660]], hw: 6.5, items: [0.5], coins: [[0.55, 0.65]] },
    { id: 'spuk-bonbon', a: ['spukinsel', 0.15, 1], b: ['bonbon', 0.67, 1], via: [], hw: 6.5, items: [0.5], coins: [[0.35, 0.45]] },
    { id: 'katzen-vulkan', a: ['katzeninsel', 0.93, -1], b: ['vulkan', 0.69, -1], via: [], hw: 6.5, items: [0.5], coins: [[0.55, 0.65]] },
    { id: 'hasen-vulkan', a: ['hasenhuegel', 0.91, -1], b: ['vulkan', 0.81, -1], via: [[-835, 335]], hw: 6.5, items: [0.5] },
    { id: 'hasen-grotte', a: ['hasenhuegel', 0.61, -1], b: ['laternengrotte', 0.8, 1], via: [[-700, -45]], hw: 6.5, items: [0.5], coins: [[0.35, 0.45]] },
    { id: 'city-wueste', a: ['palmencity', 0.91, -1], b: ['wueste', 0.25, 1], via: [[1200, 130]], hw: 7, items: [0.35, 0.7], coins: [[0.45, 0.55]] },
    { id: 'nacht-city', a: ['mitternacht', 0.21, 1], b: ['palmencity', 0.97, -1], via: [[1365, -60]], hw: 7, items: [0.3, 0.7], coins: [[0.45, 0.55]] },
    { id: 'nacht-wueste', a: ['mitternacht', 0.97, 1], b: ['wueste', 0.37, 1], via: [[1095, -205]], hw: 7, items: [0.5], coins: [[0.35, 0.45]] },
    { id: 'zoo-teneriffa', a: ['loroparque', 0.35, -1], b: ['teneriffa', 0.75, 1], via: [[960, 640]], hw: 7, items: [0.3, 0.7], coins: [[0.45, 0.55]] },
    { id: 'teneriffa-city', a: ['teneriffa', 0.63, 1], b: ['palmencity', 0.19, 1], via: [[1330, 560]], hw: 7, items: [0.5], coins: [[0.4, 0.5]] },
    { id: 'piraten-strand', a: ['piratenbucht', 0.29, 1], b: ['strand', 0.78, -1], via: [[-60, 560]], hw: 6.5, items: [0.45], coins: [[0.55, 0.65]] },
    // Inseln der Strecken nach dem Vorbild von Mario Kart 8 Deluxe (über das Meer)
    { id: 'piraten-hafen', a: ['piratenbucht', 0.235, 1], b: ['hafenstadt', 0.55, 1], via: [[-260, 760], [-380, 880]], hw: 7, items: [0.3, 0.7], coins: [[0.45, 0.55]] },
    { id: 'hafen-arena', a: ['hafenstadt', 0.377, 1], b: ['arena', 0.923, 1], via: [[-210, 1052]], hw: 7, items: [0.5] },
    { id: 'arena-schloss', a: ['arena', 0.217, 1], b: ['schlossring', 0.958, 1], via: [[280, 1085]], hw: 7, items: [0.5] },
    { id: 'strand-arena', a: ['strand', 0.683, -1], b: ['arena', 0.717, 1], via: [[95, 740]], hw: 7, items: [0.35, 0.7], coins: [[0.5, 0.6]] },
    { id: 'schloss-teneriffa', a: ['schlossring', 0.426, 1], b: ['teneriffa', 0.868, 1], via: [[880, 960]], hw: 7, items: [0.5], coins: [[0.4, 0.5]] },
    { id: 'burg-schlucht', a: ['burg', 0.79, -1], b: ['schlucht', 0.144, 1], via: [[-380, -760]], hw: 7, items: [0.35, 0.7], coins: [[0.5, 0.6]] },
    { id: 'schlucht-spuk', a: ['schlucht', 0.944, 1], b: ['spukinsel', 0.566, -1], via: [[-800, -930]], hw: 7, items: [0.5] },
  ],
  lakes: [
    { x: -40, z: 205, r: 95, depth: 4 },
    { x: 60, z: 260, r: 70, depth: 3 },
    { x: 100, z: 497, r: 12, depth: 1.5 },   // Lagune im Funkelstrand
    { x: 200, z: 728, r: 140, depth: 6 },    // Bucht südlich vom Funkelstrand (offen zum Meer)
    { x: 380, z: 700, r: 110, depth: 6 },
    { x: -212, z: 590, r: 22, depth: 3 },    // Piratenlagune (Schiff)
    { x: 498, z: 985, r: 34, depth: 3 },     // See unter dem Gleitflug am Schlossring
    { x: -500, z: -1110, r: 22, depth: 2.5 }, // Becken unter dem Wasserfall
    { x: -600, z: -1112, r: 18, depth: 2 },   // Becken unter dem zweiten Wasserfall
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
    { x: 645, z: 488, r: 200, h: 3 },        // Loro Parque
    { x: -320, z: 590, r: 190, h: 2 },       // Piratenbucht
    { x: 455, z: -610, r: 200, h: 4 },       // Dino-Dschungel
    { x: 10, z: -742, r: 70, h: 3 },         // Hafen am Wrack-Riff
    { x: -900, z: -730, r: 150, h: 4 },      // Spukinsel
    { x: -1040, z: 720, r: 145, h: 3 },      // Katzeninsel
    { x: -870, z: -100, r: 115, h: 4 },      // Hasenhügel (Nord)
    { x: -870, z: 160, r: 115, h: 3 },       // Hasenhügel (Süd)
    { x: 1470, z: 300, r: 175, h: 3 },       // Palmen-City
    { x: 1300, z: -430, r: 200, h: 3 },      // Mitternachts-Highway
    { x: 1005, z: 885, r: 55, h: 3 },        // Teneriffa: Altstadt
    { x: 1395, z: 850, r: 45, h: 3 },        // Teneriffa: Einkaufszentrum
    { x: 1161, z: 932, r: 55, h: 3.8 },      // Teneriffa: Hotel Bahía Príncipe San Felipe (Auffahrt vorn, Pool hinten)
    { x: 1265, z: 950, r: 55, h: 3.5 },      // Teneriffa: Loro Parque neben dem Hotel
    { x: 1244, z: 1035, r: 28, h: 2.2 },     // Teneriffa: Lago Martiánez
    { x: 55, z: 1015, r: 150, h: 3 },        // Buckelpisten-Arena (Stadionboden)
    { x: 670, z: 975, r: 70, h: 27 },        // Schlossring: Schlossberg
    { x: -420, z: -1180, r: 75, h: 32 },     // Wasserfall-Schlucht: Hochplateau (Ost)
    { x: -560, z: -1168, r: 55, h: 32 },     // Hochplateau (West, Gleiter-Kante)
    { x: -500, z: -1010, r: 95, h: 3 },      // Schluchtgrund am Fluss
  ],
  hills: [
    [180, -120, 70, 14], [-200, -200, 80, 18], [330, -540, 80, 22], [-460, -580, 70, 30], [-650, -300, 120, 45],
    [-640, 120, 110, 30], [620, -260, 120, 38], [780, 80, 90, 20], [160, 420, 80, 12], [-560, 470, 90, 16],
    [400, -560, 90, 26], [120, -620, 90, 24], [-760, -60, 90, 40],
    [860, -300, 70, 55], [520, -390, 70, 50], [740, -360, 70, 40],   // Schneeberge um den Glitzergipfel
    [-880, 330, 70, 62], [-560, 560, 60, 30],   // Vulkankegel und Aschehügel
    [1080, 220, 80, 28], [1000, -260, 70, 26],  // Tafelland der Wüste
    [1220, 760, 115, 42],                       // Teide auf Teneriffa
    [-480, 990, 130, 19],                       // Stadthügel der Hafenstadt
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
    { theme: 'zoo', x: 645, z: 488, r: 190, fade: 80 },
    { theme: 'pirate', x: -320, z: 590, r: 180, fade: 80 },
    { theme: 'jungle', x: 455, z: -610, r: 190, fade: 80 },
    { theme: 'reef', x: 30, z: -880, r: 170, fade: 90 },
    { theme: 'halloween', x: -900, z: -730, r: 200, fade: 90 },
    { theme: 'cats', x: -1040, z: 720, r: 190, fade: 90 },
    { theme: 'bunny', x: -870, z: 40, r: 170, fade: 90 },
    { theme: 'city', x: 1470, z: 300, r: 230, fade: 90 },
    { theme: 'nightcity', x: 1300, z: -430, r: 230, fade: 90 },
    { theme: 'tenerife', x: 1180, z: 820, r: 290, fade: 90 },
    { theme: 'harbor', x: -480, z: 1040, r: 270, fade: 90 },
    { theme: 'arena', x: 60, z: 1015, r: 200, fade: 60 },
    { theme: 'royal', x: 560, z: 1040, r: 260, fade: 80 },
    { theme: 'canyon', x: -490, z: -1090, r: 260, fade: 80 },
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
    [880, 440], [520, 600],
    [-250, 470], [-440, 690],
    [300, -470], [600, -620],
    [-60, -980], [156, -880],
    [-900, -745], [-1040, 650], [-860, 40], [1530, 300], [1330, -470], [1100, 900],
    [-450, 1010], [60, 1005], [640, 975], [-430, -1185],
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
  { id: 'tierpark', name: 'Tierpark-Cup', tracks: ['strand', 'loroparque', 'autobahn', 'wueste'] },
  { id: 'piraten', name: 'Piraten-Cup', tracks: ['manege', 'piratenbucht', 'vulkan', 'laternengrotte'] },
  { id: 'dino', name: 'Dino-Cup', tracks: ['herbstwald', 'dinodschungel', 'gipfel', 'wueste'] },
  { id: 'ozean', name: 'Ozean-Cup', tracks: ['burg', 'wrackriff', 'dinodschungel', 'herbstwald'] },
  { id: 'grusel', name: 'Grusel-Cup', tracks: ['herbstwald', 'burg', 'bonbon', 'spukinsel'] },
  { id: 'kuschel', name: 'Kuschel-Cup', tracks: ['katzeninsel', 'vulkan', 'hasenhuegel', 'laternengrotte'] },
  { id: 'neon', name: 'Neon-Cup', tracks: ['strand', 'autobahn', 'wueste', 'palmencity'] },
  { id: 'nacht', name: 'Mitternachts-Cup', tracks: ['autobahn', 'wueste', 'mitternacht', 'palmencity'] },
  { id: 'kanaren', name: 'Kanaren-Cup', tracks: ['strand', 'loroparque', 'teneriffa', 'palmencity'] },
  // Strecken nach dem Vorbild von Mario Kart 8 Deluxe: Höhenprofile, Kuppensprünge, Gleitflüge
  { id: 'gleiter', name: 'Gleiter-Cup', tracks: ['schlucht', 'hafenstadt', 'arena', 'schlossring'] },
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
  {
    id: 'safari', name: 'Tierpark-Safari',
    stops: ['kraxelwiese', 'strand', 'loroparque', 'autobahn', 'herbstwald'],
    survivors: [9, 6, 4],
  },
  {
    id: 'schatz', name: 'Schatzsuche',
    stops: ['strand', 'piratenbucht', 'manege', 'kraxelwiese'],
    survivors: [8, 4],
  },
  {
    id: 'grusel', name: 'Gruselnacht',
    stops: ['herbstwald', 'burg', 'bonbon', 'spukinsel'],
    survivors: [8, 4],
  },
  {
    id: 'tierfreunde', name: 'Tierfreunde',
    stops: ['katzeninsel', 'vulkan', 'hasenhuegel', 'laternengrotte', 'kraxelwiese'],
    survivors: [9, 6, 4],
  },
  {
    id: 'verfolgung', name: 'Verfolgungsjagd',
    stops: ['kraxelwiese', 'autobahn', 'wueste', 'palmencity'],
    survivors: [8, 4],
  },
  {
    id: 'mitternacht', name: 'Mitternachtsjagd',
    stops: ['autobahn', 'wueste', 'mitternacht', 'palmencity'],
    survivors: [8, 4],
  },
  {
    id: 'kanaren', name: 'Kanaren-Rundfahrt',
    stops: ['strand', 'loroparque', 'teneriffa', 'palmencity'],
    survivors: [8, 4],
  },
  {
    id: 'gleitflug', name: 'Gleitflug-Tour',
    stops: ['strand', 'arena', 'schlossring', 'teneriffa'],
    survivors: [8, 4],
  },
  {
    id: 'tauchgang', name: 'Tauchgang',
    stops: ['herbstwald', 'burg', 'wrackriff', 'dinodschungel', 'gipfel'],
    survivors: [9, 6, 4],
  },
];
