// Eingabe: Tastatur, Gamepads und Touch-Steuerung – je Spieler eine Quelle (Mehrspieler im geteilten Bildschirm).
//   Quellen:  'auto'  alles zusammen (Einzelspieler: beide Tastaturhälften, jeder Controller, Touch)
//             'kb1'   Tastatur links:  W A S D, Leertaste/Shift links = Driften, Q/E = Gegenstand
//             'kb2'   Tastatur rechts: Pfeiltasten, Shift rechts/L/Num0 = Driften, Enter/K/Strg rechts = Gegenstand
//             'pad0'…'pad3'  Controller (Standard-Belegung): Stick/Steuerkreuz lenken, A/RT Gas, B/X Bremse,
//                            R/LT… Driften (R1), L1/LT/Y Gegenstand, Start Pause
//             'touch' linke Hälfte = Lenkrad, rechts Knöpfe (Gas automatisch, abschaltbar)
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

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'Enter'].includes(e.key)) e.preventDefault();
  if (!KEYS.has(e.code)) { PRESSED.add(e.code); PRESSED_J.add(e.code); LATCH.add(e.code); }
  KEYS.add(e.code);
});
window.addEventListener('keyup', (e) => KEYS.delete(e.code));
window.addEventListener('blur', () => KEYS.clear());

const any = (codes) => codes.some((c) => KEYS.has(c) || LATCH.has(c));
const tapped = (...codes) => codes.some((c) => PRESSED.has(c));

export const touch = { active: false, steer: 0, drift: false, item: false, brake: false, gas: false, autoGas: false, itemTap: false, driftTap: false, driftHold: false, coastUntil: 0 };
let usingTouch = false;
window.addEventListener('touchstart', () => { usingTouch = true; }, { passive: true });

export const isTouch = () => usingTouch || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);

const pads = () => (navigator.getGamepads ? [...navigator.getGamepads()] : []);

/** Controller-Eingabe in inp eintragen (Standard-Belegung, Achse mit Totzone). */
function padInto(gp, inp) {
  const ax = gp.axes[0] ?? 0;
  if (Math.abs(ax) > 0.15) inp.steer = -Math.sign(ax) * Math.min(1, (Math.abs(ax) - 0.15) / 0.75);
  const b = (i) => !!gp.buttons[i]?.pressed;
  if (b(14)) inp.steer = 1; if (b(15)) inp.steer = -1;
  const rt = gp.buttons[7]?.value ?? 0;
  if (b(0) || rt > 0.3) inp.throttle = Math.max(inp.throttle, b(0) ? 1 : Math.min(1, rt * 1.3));
  if (b(1) || b(2)) inp.brake = 1;
  if (b(5)) inp.drift = true;
  if (b(4) || b(6) || b(3)) inp.item = true;
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
  if (src === 'auto') { for (const gp of pads()) if (gp && gp.connected) padInto(gp, inp); }
  else if (src.startsWith('pad')) { const gp = pads()[Number(src.slice(3))]; if (gp) padInto(gp, inp); }
  if ((src === 'auto' || src === 'touch') && touch.active) {
    if (touch.steer !== 0) inp.steer = touch.steer;
    // Gas: Knopf GAS (kurz nach dem Loslassen rollt das Kart weiter) oder DRIFT oder Automatik; BREMSE hat Vorrang
    const coast = (touch.coastUntil ?? 0) > performance.now() / 1000;
    if (touch.autoGas || touch.gas || touch.drift || coast) inp.throttle = Math.max(inp.throttle, touch.brake ? 0 : 1);
    if (touch.brake) inp.brake = 1;
    // Driften: DRIFT-Knopf (Automatik-Gas) oder Gas kurz loslassen und wieder drücken (solange gehalten)
    if (touch.drift || touch.driftTap || touch.driftHold) inp.drift = true;
    if (touch.item || touch.itemTap) inp.item = true;
  }
  inp.steer = Math.max(-1, Math.min(1, inp.steer));
  return inp;
}

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
const lastPad = [];
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
    // Stick als Steuerkreuz
    const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0;
    now[100] = ax < -0.6; now[101] = ax > 0.6; now[102] = ay < -0.6; now[103] = ay > 0.6;
    const last = lastPad[i] ?? [];
    const edge = (k) => now[k] && !last[k];
    if (edge(9)) m.pause = true;
    if (edge(0)) m.confirm = true;
    if (edge(1)) m.back = true;
    if (edge(14) || edge(100)) m.left = true; if (edge(15) || edge(101)) m.right = true;
    if (edge(12) || edge(102)) m.up = true; if (edge(13) || edge(103)) m.down = true;
    if (now.some((p, k) => p && !last[k])) m.any = true;
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
    const now = { a: gp.buttons[0]?.pressed, b: gp.buttons[1]?.pressed, l: gp.buttons[14]?.pressed || ax < -0.6, r: gp.buttons[15]?.pressed || ax > 0.6, s: gp.buttons[9]?.pressed };
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
    const name = /xbox|xinput/i.test(id) ? 'Xbox-Controller' : /dualsense|dualshock|playstation|054c/i.test(id) ? 'PlayStation-Controller' : /pro controller|joy-con|057e/i.test(id) ? 'Switch-Controller' : 'Controller';
    return `🎮 ${name} ${Number(src.slice(3)) + 1}`;
  }
  return '';
}

/** Ist gerade irgendeine Fahr-Taste gehalten? (Startturbo) */
export function gasHeld(src = 'auto') {
  return readDrive(src).throttle > 0;
}
