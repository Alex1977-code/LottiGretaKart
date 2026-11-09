// Eingabe: Tastatur, Gamepads und Touch-Steuerung – je Spieler eine Quelle (Mehrspieler im geteilten Bildschirm).
//   Quellen:  'auto'  alles zusammen (Einzelspieler: beide Tastaturhälften, jeder Controller, Touch)
//             'kb1'   Tastatur links:  W A S D, Leertaste/Shift links = Driften, Q/E = Gegenstand
//             'kb2'   Tastatur rechts: Pfeiltasten, Shift rechts/L/Num0 = Driften, Enter/K/Strg rechts = Gegenstand
//             'pad0'…'pad3'  Controller (Standard-Belegung): Stick/Steuerkreuz lenken, A/RT Gas, B/X Bremse,
//                            R/LT… Driften (R1), L1/LT/Y Gegenstand, Start Pause
//             'touch' linke Hälfte = Lenkrad, rechts Knöpfe (GAS – pumpen = Driften; Automatik-Gas wählbar)
//   endFrame() einmal je Bild: kurze Tipper (LATCH) und Touch-Tipps zurücksetzen.

const KEYS = new Set();
const PRESSED = new Set(); // Flanken seit dem letzten readMeta()
const PRESSED_J = new Set(); // Flanken seit dem letzten readJoin() (Mehrspieler-Lobby)
const LATCH = new Set();   // Flanken seit dem letzten Bild – kurze Tipper gehen nicht verloren

const KB = {
  kb1: { left: ['KeyA'], right: ['KeyD'], gas: ['KeyW'], brake: ['KeyS'], drift: ['Space', 'ShiftLeft'], item: ['KeyQ', 'KeyE', 'KeyF', 'ControlLeft'] },
  kb2: { left: ['ArrowLeft'], right: ['ArrowRight'], gas: ['ArrowUp'], brake: ['ArrowDown'], drift: ['ShiftRight', 'KeyL', 'Numpad0', 'Period'], item: ['Enter', 'NumpadEnter', 'KeyK', 'ControlRight', 'Minus'] },
};
KB.auto = {
  left: [...KB.kb1.left, ...KB.kb2.left], right: [...KB.kb1.right, ...KB.kb2.right], gas: [...KB.kb1.gas, ...KB.kb2.gas],
  brake: [...KB.kb1.brake, ...KB.kb2.brake], drift: [...KB.kb1.drift, ...KB.kb2.drift, 'KeyR'], item: [...KB.kb1.item, ...KB.kb2.item, 'KeyX'],
};

// Tippen in ein Eingabefeld (Name, Raum-Code) steuert weder Kart noch Menü
const typing = (e) => { const t = e.target; return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
// Fernbedienungen von Smart-TV, Fire TV und Konsolen-Browsern liefern oft keinen e.code – dann aus e.key bzw.
// e.keyCode ableiten: Steuerkreuz = Pfeile, OK = Enter, Zurück = Escape, Play/Pause = Pause
const KEY_NAMES = {
  ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', Left: 'ArrowLeft', Right: 'ArrowRight', Up: 'ArrowUp', Down: 'ArrowDown',
  Enter: 'Enter', OK: 'Enter', Select: 'Enter', Accept: 'Enter', ' ': 'Space',
  Escape: 'Escape', Esc: 'Escape', GoBack: 'Escape', BrowserBack: 'Escape', Back: 'Escape', XF86Back: 'Escape', Backspace: 'Backspace',
  MediaPlayPause: 'KeyP', MediaPlay: 'KeyP', MediaPause: 'KeyP', Pause: 'KeyP', Play: 'KeyP',
};
const KEY_CODES = { 37: 'ArrowLeft', 38: 'ArrowUp', 39: 'ArrowRight', 40: 'ArrowDown', 13: 'Enter', 27: 'Escape', 8: 'Backspace', 461: 'Escape', 10009: 'Escape', 4: 'Escape', 179: 'KeyP', 415: 'KeyP', 19: 'KeyP', 10252: 'KeyP' };
const REMAP = { BrowserBack: 'Escape', GoBack: 'Escape', MediaPlayPause: 'KeyP', Pause: 'KeyP' };
export const keyCodeOf = (e) => (e.code && e.code !== 'Unidentified' ? REMAP[e.code] ?? e.code : KEY_NAMES[e.key] ?? KEY_CODES[e.keyCode] ?? '');
window.addEventListener('keydown', (e) => {
  if (typing(e)) return;
  const code = keyCodeOf(e);
  if (!code) return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Enter'].includes(code)) e.preventDefault();
  lastDevice = 'keys';
  if (!KEYS.has(code)) { PRESSED.add(code); PRESSED_J.add(code); LATCH.add(code); }
  KEYS.add(code);
});
window.addEventListener('keyup', (e) => KEYS.delete(keyCodeOf(e)));
window.addEventListener('blur', () => KEYS.clear());

const any = (codes) => codes.some((c) => KEYS.has(c) || LATCH.has(c));
const tapped = (...codes) => codes.some((c) => PRESSED.has(c));

export const touch = { driftHold: false, active: false, steer: 0, steerLin: 0, steerId: null, drift: false, item: false, brake: false, gas: false, autoGas: false, itemTap: false, driftTap: false, driftUntil: 0, coastUntil: 0 };
let usingTouch = false;
// zuletzt benutztes Eingabegerät ('touch' | 'pad' | 'keys') – mit Controller verschwinden die Touch-Knöpfe
let lastDevice = '';
const setPadActive = (on) => { if (typeof document !== 'undefined') document.body?.classList.toggle('pad-active', on); };
window.addEventListener('touchstart', () => { usingTouch = true; if (lastDevice !== 'touch') { lastDevice = 'touch'; setPadActive(false); } }, { passive: true });
export const inputDevice = () => lastDevice;

export const isTouch = () => usingTouch || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);

const pads = () => { try { return navigator.getGamepads ? [...navigator.getGamepads()] : []; } catch (_) { return []; } };   // (in fremden Rahmen kann der Browser den Zugriff sperren)

/**
 * Steuerkreuz eines Controllers als { l, r, u, d }. Mit Standard-Belegung sind es die Knöpfe 12–15; viele
 * Bluetooth-Controller ohne Standard-Belegung (mapping '') melden es stattdessen als Achse: als „Hut“ auf Achse 9
 * (acht Richtungen von −1 bis +1, Ruhe außerhalb) oder als zwei Achsen 6/7 bzw. 4/5 mit den Werten −1/0/+1.
 */
const dpadSeen = [];
function dpad(gp) {
  const b = (i) => !!gp.buttons[i]?.pressed;
  const o = { l: b(14), r: b(15), u: b(12), d: b(13) };
  if (gp.mapping === 'standard') return o;
  const ax = gp.axes;
  if (ax.length >= 10) {
    // Hut: genau acht Raster-Werte −1, −5/7 … +1 (0 = oben, im Uhrzeigersinn); alles andere (Ruhe ≈ 1,29 oder 0) zählt nicht
    const k = Math.round((ax[9] + 1) * 3.5);
    if (k >= 0 && k <= 7 && Math.abs(ax[9] - (-1 + (k * 2) / 7)) < 0.05) {
      if (k === 7 || k === 0 || k === 1) o.u = true;
      if (k >= 1 && k <= 3) o.r = true;
      if (k >= 3 && k <= 5) o.d = true;
      if (k >= 5 && k <= 7) o.l = true;
    }
  }
  if (ax.length >= 8) {
    // Achsenpaar 6/7 mit Sprungwerten −1/0/+1 (ein Trigger ruht bei −1 und käme hier nie auf 0 – deshalb zählt das Paar
    // erst, nachdem beide Achsen einmal in Ruhe 0 gemeldet haben)
    const x = ax[6], y = ax[7], st = (dpadSeen[gp.index] ??= { ok: false });
    if (x === 0 && y === 0) st.ok = true;
    const digital = (v) => v === 0 || Math.abs(Math.abs(v) - 1) < 0.01;
    if (st.ok && digital(x) && digital(y)) { if (x < -0.5) o.l = true; if (x > 0.5) o.r = true; if (y < -0.5) o.u = true; if (y > 0.5) o.d = true; }
  }
  return o;
}

/** Controller-Eingabe in inp eintragen (Achse mit Totzone; liefert true, wenn etwas gedrückt/bewegt ist). */
function padInto(gp, inp) {
  let used = false;
  const ax = gp.axes[0] ?? 0;
  if (Math.abs(ax) > 0.15) { inp.steer = -Math.sign(ax) * Math.min(1, (Math.abs(ax) - 0.15) / 0.75); used = true; }
  const b = (i) => !!gp.buttons[i]?.pressed;
  const dp = dpad(gp);
  if (dp.l) { inp.steer = 1; used = true; }
  if (dp.r) { inp.steer = -1; used = true; }
  const rt = Math.max(gp.buttons[7]?.value ?? 0, b(7) ? 1 : 0);
  if (b(0) || rt > 0.3) { inp.throttle = Math.max(inp.throttle, b(0) ? 1 : Math.min(1, rt * 1.3)); used = true; }
  if (b(1) || b(2)) { inp.brake = 1; used = true; }
  if (b(5)) { inp.drift = true; used = true; }
  if (b(4) || b(6) || b(3)) { inp.item = true; used = true; }
  return used;
}

/** Eingabe eines Spielers (jedes Bild); src siehe oben. */
export function readDrive(src = 'auto') {
  if (window.__testInput) return { steer: 0, throttle: 0, brake: 0, drift: false, item: false, ...window.__testInput };
  const inp = { steer: 0, throttle: 0, brake: 0, drift: false, item: false };
  const k = KB[src];
  if (k) {
    if (any(k.left)) inp.steer += 1;
    if (any(k.right)) inp.steer -= 1;
    if (any(k.gas)) inp.throttle = 1;
    if (any(k.brake)) inp.brake = 1;
    if (any(k.drift)) inp.drift = true;
    if (any(k.item)) inp.item = true;
  }
  let padUsed = false;
  if (src === 'auto') { for (const gp of pads()) if (gp && gp.connected && padInto(gp, inp)) padUsed = true; }
  else if (src.startsWith('pad')) { const gp = pads()[Number(src.slice(3))]; if (gp && padInto(gp, inp)) padUsed = true; }
  // mit dem Controller gefahren: Touch-Knöpfe ausblenden (ein Fingertipp holt sie zurück)
  if (padUsed && lastDevice !== 'pad') { lastDevice = 'pad'; setPadActive(true); }
  if ((src === 'auto' || src === 'touch') && touch.active && !(src === 'auto' && lastDevice === 'pad')) {   // (mit Controller zählt die Touch-Automatik nicht)
    if (touch.steer !== 0) inp.steer = touch.steer;
    if (touch.steerId !== null) inp.steerLin = touch.steerLin;   // Daumen liegt auf dem Lenkrad
    // Gas: Knopf GAS (kurz nach dem Loslassen rollt das Kart weiter) oder DRIFT oder Automatik; BREMSE hat Vorrang
    const now = performance.now() / 1000;
    // Drift mit Gas-Pumpen begonnen: solange Gas gehalten wird, läuft der Drift weiter (in Ruhe lenken);
    // Loslassen (länger als eine Pump-Pause) beendet ihn mit Mini-Turbo
    if (touch.driftHold && touch.gas) touch.driftUntil = Math.max(touch.driftUntil, now + 0.12);
    const pumping = touch.driftUntil > now;
    if (!pumping) touch.driftHold = false;
    if (touch.autoGas || touch.gas || touch.drift || pumping || touch.coastUntil > now) inp.throttle = Math.max(inp.throttle, touch.brake ? 0 : 1);
    if (touch.brake) inp.brake = 1;
    // Driften: DRIFT-Knopf (Automatik-Gas) oder Gas pumpen (Gas – los – Gas – los …)
    if (touch.drift || touch.driftTap || pumping) inp.drift = true;
    if (touch.driftTap) inp.driftTap = true;   // neues Pumpen/Drücken: startet auch dann einen Hüpfer, wenn Drift noch „gehalten“ ist
    if (touch.item || touch.itemTap) inp.item = true;
  }
  inp.steer = Math.max(-1, Math.min(1, inp.steer));
  return inp;
}

/** Drift wurde vom Spiel beendet (Richtungswechsel): Gas-Halten hält ihn nicht mehr – neu pumpen startet den nächsten. */
export function endTouchDrift() { touch.driftHold = false; touch.driftUntil = 0; }

/** Am Ende jedes Bildes: kurze Tipper und Touch-Tipps sind verarbeitet. */
export function endFrame() {
  LATCH.clear();
  PRESSED_J.clear();
  touch.itemTap = touch.driftTap = false;
}

/** Controller vibrieren lassen (Treffer, Turbo); auf Android-Handys ohne Controller kurz das Gerät. */
export function rumble(src, strong = 0.6, weak = 0.4, ms = 180) {
  try {
    const list = src && src.startsWith('pad') ? [pads()[Number(src.slice(3))]] : src === 'auto' ? pads() : [];
    let done = false;
    for (const gp of list) {
      if (gp?.vibrationActuator?.playEffect) { gp.vibrationActuator.playEffect('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch?.(() => {}); done = true; }
    }
    if (!done && (src === 'touch' || src === 'auto') && touch.active && navigator.vibrate) navigator.vibrate(Math.min(60, ms / 3));
  } catch (_) { /* egal */ }
}

/** Menü-/Meta-Tasten (Flanken) – Tastatur und alle Controller. */
const lastPad = [], padHold = [];
export function readMeta() {
  const m = {
    pause: tapped('Escape', 'KeyP'),
    mute: tapped('KeyM'),
    confirm: tapped('Enter', 'Space'),
    back: tapped('Escape', 'Backspace'),
    left: tapped('ArrowLeft', 'KeyA'), right: tapped('ArrowRight', 'KeyD'),
    up: tapped('ArrowUp', 'KeyW'), down: tapped('ArrowDown', 'KeyS'),
    any: PRESSED.size > 0,
  };
  pads().forEach((gp, i) => {
    if (!gp) return;
    const now = gp.buttons.map((b) => b.pressed);
    // Stick und Steuerkreuz (auch als Achse gemeldet) als Richtungen
    const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0, dp = dpad(gp);
    now[100] = ax < -0.6 || dp.l; now[101] = ax > 0.6 || dp.r; now[102] = ay < -0.6 || dp.u; now[103] = ay > 0.6 || dp.d;
    const last = lastPad[i] ?? [];
    // Richtung gehalten: nach 0,4 s alle 0,13 s wiederholen (lange Listen: Strecken, Fahrer)
    const hold = (padHold[i] ??= {}), t = performance.now();
    const edge = (k) => {
      if (!now[k]) { hold[k] = 0; return false; }
      if (!last[k]) { hold[k] = t + 400; return true; }
      if (k >= 100 && hold[k] && t >= hold[k]) { hold[k] = t + 130; return true; }
      return false;
    };
    if (edge(9)) m.pause = true;
    if (edge(0)) m.confirm = true;
    if (edge(1)) m.back = true;
    if (edge(100)) m.left = true; if (edge(101)) m.right = true;
    if (edge(102)) m.up = true; if (edge(103)) m.down = true;
    if (now.some((p, k) => p && !last[k])) { m.any = true; if (lastDevice !== 'pad') { lastDevice = 'pad'; setPadActive(true); } }
    lastPad[i] = now;
  });
  PRESSED.clear();
  return m;
}

/**
 * Lobby (Mehrspieler): Ereignisse je Gerät seit dem letzten Aufruf.
 * [{ src, act: 'confirm' | 'back' | 'left' | 'right' }] – confirm tritt bei/bestätigt, left/right wählt die Figur.
 */
const lastJoin = [];
export function readJoin() {
  const ev = [];
  const k = (codes, src, act) => { if (codes.some((c) => PRESSED_J.has(c))) ev.push({ src, act }); };
  k(['Space', 'KeyE'], 'kb1', 'confirm'); k(['KeyQ', 'Tab'], 'kb1', 'back'); k(['KeyA'], 'kb1', 'left'); k(['KeyD'], 'kb1', 'right');
  k(['Enter', 'NumpadEnter'], 'kb2', 'confirm'); k(['Backspace'], 'kb2', 'back'); k(['ArrowLeft'], 'kb2', 'left'); k(['ArrowRight'], 'kb2', 'right');
  PRESSED_J.clear();
  pads().forEach((gp, i) => {
    if (!gp) return;
    const ax = gp.axes[0] ?? 0;
    const dp = dpad(gp);
    const now = { a: gp.buttons[0]?.pressed, b: gp.buttons[1]?.pressed, l: dp.l || ax < -0.6, r: dp.r || ax > 0.6, s: gp.buttons[9]?.pressed };
    const last = lastJoin[i] ?? {};
    const src = `pad${i}`;
    if (now.a && !last.a) ev.push({ src, act: 'confirm' });
    if (now.s && !last.s) ev.push({ src, act: 'confirm' });
    if (now.b && !last.b) ev.push({ src, act: 'back' });
    if (now.l && !last.l) ev.push({ src, act: 'left' });
    if (now.r && !last.r) ev.push({ src, act: 'right' });
    lastJoin[i] = now;
  });
  return ev;
}

/** Name und Symbol eines Geräts für die Anzeige. */
export function deviceLabel(src) {
  if (src === 'kb1') return '⌨️ Tastatur links (WASD)';
  if (src === 'kb2') return '⌨️ Tastatur rechts (Pfeile)';
  if (src === 'touch') return '📱 Touch';
  if (src?.startsWith('pad')) {
    const gp = pads()[Number(src.slice(3))];
    const id = gp?.id ?? '';
    return `🎮 ${padName(id)} ${Number(src.slice(3)) + 1}`;
  }
  return '';
}

/** Ist gerade irgendeine Fahr-Taste gehalten? (Startturbo) */
export function gasHeld(src = 'auto') {
  return readDrive(src).throttle > 0;
}


// ------------------------------------------------------------------ Controller verbinden/trennen, Bildschirm wach halten
const padListeners = [];
/** fn({ type: 'connected' | 'disconnected', index, name }) bei jedem Verbinden/Trennen eines Controllers. */
export function onPadChange(fn) { padListeners.push(fn); }
const padName = (id = '') => (/xbox|xinput|045e/i.test(id) ? 'Xbox-Controller' : /dualsense|dualshock|playstation|054c/i.test(id) ? 'PlayStation-Controller' : /pro controller|joy-con|057e/i.test(id) ? 'Switch-Controller' : /8bitdo|2dc8/i.test(id) ? '8BitDo-Controller' : 'Controller');
window.addEventListener('gamepadconnected', (e) => { for (const fn of padListeners) fn({ type: 'connected', index: e.gamepad.index, name: padName(e.gamepad.id) }); });
window.addEventListener('gamepaddisconnected', (e) => {
  lastPad[e.gamepad.index] = []; lastJoin[e.gamepad.index] = {}; dpadSeen[e.gamepad.index] = null;
  const active = lastDevice === 'pad';   // wurde zuletzt mit Controller gespielt?
  // kein Controller mehr da: Touch-Knöpfe wieder zeigen
  if (!pads().some((g) => g && g.connected && g.index !== e.gamepad.index)) { if (active) lastDevice = ''; setPadActive(false); }
  for (const fn of padListeners) fn({ type: 'disconnected', index: e.gamepad.index, name: padName(e.gamepad.id), active });
});
/** Anzahl der verbundenen Controller. */
export const padCount = () => pads().filter((g) => g && g.connected).length;

/**
 * Bildschirm wach halten: Wer mit dem Controller fährt oder aufs TV überträgt, berührt das Gerät nicht – ohne Sperre
 * dunkelt es ab und schaltet sich aus. Die Sperre gilt nur, solange die Seite sichtbar ist, und wird beim
 * Zurückkehren neu angefordert (das System gibt sie beim Verbergen frei).
 */
let wake = null;
export async function keepAwake() {
  try {
    if (!('wakeLock' in navigator) || document.hidden || (wake && !wake.released)) return !!wake;
    wake = await navigator.wakeLock.request('screen');
    return true;
  } catch (_) { return false; }   // (Stromsparmodus, kein Recht): dann eben ohne
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) keepAwake(); });
for (const ev of ['pointerdown', 'keydown', 'gamepadconnected']) window.addEventListener(ev, () => keepAwake(), { passive: true });
