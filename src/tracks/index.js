// Alle Strecken.
import kartstadion from './kartstadion.js';
import blumenring from './blumenring.js';
import wolkenstrasse from './wolkenstrasse.js';
import discohalle from './discohalle.js';
import flughafen from './flughafen.js';
import seepark from './seepark.js';
import gipfelabfahrt from './gipfelabfahrt.js';
import sternenbahn from './sternenbahn.js';
import knochenduenen from './knochenduenen.js';
import lavafestung from './lavafestung.js';
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

export const TRACKS = [kartstadion, seepark, zuckerschlucht, tempelruinen, blumenring, hafenstadt, spukvilla, schlucht, flughafen, delfinlagune, discohalle, gipfelabfahrt, arena, schlossring, wolkenstrasse, sternenbahn, knochenduenen, lavafestung, loroparque, piratenbucht, katzeninsel, hasenhuegel, palmencity, mitternacht, teneriffa];
export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
