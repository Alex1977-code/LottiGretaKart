// Alle Strecken.
import kartstadion from './kartstadion.js';
import blumenring from './blumenring.js';
import laternengrotte from './laternengrotte.js';
import discohalle from './discohalle.js';
import flughafen from './flughafen.js';
import seepark from './seepark.js';
import gipfelabfahrt from './gipfelabfahrt.js';
import burg from './burg.js';
import wueste from './wueste.js';
import vulkan from './vulkan.js';
import zuckerschlucht from './zuckerschlucht.js';
import loroparque from './loroparque.js';
import piratenbucht from './piratenbucht.js';
import tempelruinen from './tempelruinen.js';
import delfinlagune from './delfinlagune.js';
import spukvilla from './spukvilla.js';
import katzeninsel from './katzeninsel.js';
import hasenhuegel from './hasenhuegel.js';
import palmencity from './palmencity.js';
import mitternacht from './mitternacht.js';
import teneriffa from './teneriffa.js';
import hafenstadt from './hafenstadt.js';
import arena from './arena.js';
import schlossring from './schlossring.js';
import schlucht from './schlucht.js';

export const TRACKS = [kartstadion, seepark, zuckerschlucht, tempelruinen, blumenring, hafenstadt, spukvilla, schlucht, flughafen, delfinlagune, discohalle, gipfelabfahrt, arena, schlossring, laternengrotte, burg, wueste, vulkan, loroparque, piratenbucht, katzeninsel, hasenhuegel, palmencity, mitternacht, teneriffa];
export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
