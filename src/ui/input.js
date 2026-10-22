// Eingabe: Tastatur, Gamepad und Touch-Steuerung zu einem Zustand zusammengeführt.
//   Tastatur: ←/→ bzw. A/D lenken, ↑/W Gas, ↓/S Bremse/rückwärts, Leertaste/Shift Driften (Hüpfer),
//             X/E/Strg Gegenstand, Esc/P Pause, M Ton.
//   Gamepad:  linker Stick lenken, A Gas, B/X Bremse, R/RT Driften, L/LT/Y Gegenstand, Start Pause.
//   Touch:    linke Hälfte = Lenkrad (Daumen nach links/rechts ziehen), rechts Knöpfe Drift, Gegenstand,
//             Bremse; Gas automatisch (abschaltbar).

const KEYS = new Set();
const PRESSED = new Set(); // Flanken seit dem letzten poll()

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Tab', 'Enter'].includes(e.key)) e.preventDefault();
  if (!KEYS.has(e.code)) PRESSED.add(e.code);
  KEYS.add(e.code);
});
window.addEventListener('keyup', (e) => KEYS.delete(e.code));
window.addEventListener('blur', () => KEYS.clear());

const any = (...codes) => codes.some((c) => KEYS.has(c));
const tapped = (...codes) => codes.some((c) => PRESSED.has(c));

export const touch = { active: false, steer: 0, drift: false, item: false, brake: false, gas: false, autoGas: true };
let lastPadButtons = [];
let usingTouch = false;
window.addEventListener('touchstart', () => { usingTouch = true; }, { passive: true });

export const isTouch = () => usingTouch || (navigator.maxTouchPoints > 0 && matchMedia('(pointer: coarse)').matches);

/** Eingabe für die Spielerin (jedes Bild). */
export function readDrive() {
  if (window.__testInput) return { steer: 0, throttle: 0, brake: 0, drift: false, item: false, ...window.__testInput };
  const inp = { steer: 0, throttle: 0, brake: 0, drift: false, item: false };
  if (any('ArrowLeft', 'KeyA')) inp.steer += 1;
  if (any('ArrowRight', 'KeyD')) inp.steer -= 1;
  if (any('ArrowUp', 'KeyW')) inp.throttle = 1;
  if (any('ArrowDown', 'KeyS')) inp.brake = 1;
  if (any('Space', 'ShiftLeft', 'ShiftRight', 'KeyR')) inp.drift = true;
  if (any('KeyX', 'KeyE', 'ControlLeft', 'ControlRight', 'KeyF', 'Enter')) inp.item = true;
  // Gamepad
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue;
    const ax = gp.axes[0] ?? 0;
    if (Math.abs(ax) > 0.15) inp.steer = -Math.sign(ax) * Math.min(1, (Math.abs(ax) - 0.15) / 0.75);
    const b = (i) => !!gp.buttons[i]?.pressed;
    if (b(14)) inp.steer = 1; if (b(15)) inp.steer = -1;
    if (b(0) || (gp.buttons[7]?.value ?? 0) > 0.3) inp.throttle = 1;
    if (b(1) || b(2)) inp.brake = 1;
    if (b(5)) inp.drift = true;
    if (b(4) || b(6) || b(3)) inp.item = true;
    break;
  }
  // Touch
  if (touch.active) {
    if (touch.steer !== 0) inp.steer = touch.steer;
    if (touch.autoGas || touch.gas) inp.throttle = Math.max(inp.throttle, touch.brake ? 0 : 1);
    if (touch.brake) inp.brake = 1;
    if (touch.drift) inp.drift = true;
    if (touch.item) inp.item = true;
  }
  inp.steer = Math.max(-1, Math.min(1, inp.steer));
  return inp;
}

/** Menü-/Meta-Tasten (Flanken). */
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
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  for (const gp of pads) {
    if (!gp) continue;
    const now = gp.buttons.map((b) => b.pressed);
    const edge = (i) => now[i] && !lastPadButtons[i];
    if (edge(9)) m.pause = true;
    if (edge(0)) m.confirm = true;
    if (edge(1)) m.back = true;
    if (edge(14)) m.left = true; if (edge(15)) m.right = true;
    if (edge(12)) m.up = true; if (edge(13)) m.down = true;
    if (now.some((p, i) => p && !lastPadButtons[i])) m.any = true;
    lastPadButtons = now;
    break;
  }
  PRESSED.clear();
  return m;
}

/** Wird gerade irgendeine Fahr-Taste gehalten? (Startturbo) */
export function gasHeld() {
  return readDrive().throttle > 0;
}
