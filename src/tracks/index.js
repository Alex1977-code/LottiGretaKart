// Alle Strecken.
import kraxelwiese from './kraxelwiese.js';
import herbstwald from './herbstwald.js';
import laternengrotte from './laternengrotte.js';
import manege from './manege.js';
import autobahn from './autobahn.js';
import strand from './strand.js';
import gipfel from './gipfel.js';
import burg from './burg.js';
import wueste from './wueste.js';
import vulkan from './vulkan.js';
import bonbon from './bonbon.js';
import loroparque from './loroparque.js';
import piratenbucht from './piratenbucht.js';
import dinodschungel from './dinodschungel.js';
import wrackriff from './wrackriff.js';
import spukinsel from './spukinsel.js';
import katzeninsel from './katzeninsel.js';
import hasenhuegel from './hasenhuegel.js';
import palmencity from './palmencity.js';
import mitternacht from './mitternacht.js';
import teneriffa from './teneriffa.js';
import hafenstadt from './hafenstadt.js';
import arena from './arena.js';
import schlossring from './schlossring.js';
import schlucht from './schlucht.js';

export const TRACKS = [kraxelwiese, herbstwald, laternengrotte, manege, autobahn, strand, gipfel, burg, wueste, vulkan, bonbon, loroparque, piratenbucht, dinodschungel, wrackriff, spukinsel, katzeninsel, hasenhuegel, palmencity, mitternacht, teneriffa, hafenstadt, arena, schlossring, schlucht];
export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
