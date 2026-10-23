// Mehrspieler in der Nähe – nur in der iPhone-App (Capacitor): Handys verbinden sich direkt per Bluetooth/WLAN
// von Gerät zu Gerät (Apple MultipeerConnectivity), ohne Internet und ohne Router – auch im Flugmodus, wenn WLAN
// und Bluetooth eingeschaltet sind. Im Browser gibt es das nicht (dort: Raumcode oder QR-Kopplung).
// Liefert Links wie transport.js: { id, send(obj), onMessage, onClose, close() } mit JSON-Nachrichten.

import { Capacitor, registerPlugin } from '@capacitor/core';

const Nearby = registerPlugin('LGKNearby');

export const nearbyAvailable = () => Capacitor.getPlatform() === 'ios' && Capacitor.isPluginAvailable('LGKNearby');

const links = new Map();   // Partner-id → Link
let on = {};               // aktuelle Rückrufe (connected, disconnected, peerFound, peerLost, error)
let listening = false;
let gen = 0;               // jede neue Sitzung zählt hoch – ein spätes close() der alten beendet die neue nicht

class NearbyLink {
  constructor(id, name) { this.id = id; this.name = name; this.open = true; this.onMessage = null; this.onClose = null; }
  send(obj) { if (this.open) Nearby.send({ to: this.id, data: JSON.stringify(obj) }).catch(() => {}); }
  close() {
    if (!this.open) return;
    this.open = false; links.delete(this.id);
    setTimeout(() => this.onClose?.(), 0);   // wie bei WebRTC: Schließen meldet sich etwas später
  }
}

async function listen(handlers) {
  on = handlers;
  if (listening) return;
  listening = true;
  await Nearby.addListener('message', ({ id, data }) => {
    const l = links.get(id);
    if (!l) return;
    try { l.onMessage?.(JSON.parse(data)); } catch (_) { /* kaputte Nachricht */ }
  });
  await Nearby.addListener('connected', (e) => on.connected?.(e));
  await Nearby.addListener('disconnected', (e) => {
    const l = links.get(e.id);
    if (l) { links.delete(e.id); l.open = false; l.onClose?.(); }
    on.disconnected?.(e);
  });
  await Nearby.addListener('peerFound', (e) => on.peerFound?.(e));
  await Nearby.addListener('peerLost', (e) => on.peerLost?.(e));
  await Nearby.addListener('error', (e) => on.error?.(e.message));
}

/** Alles beenden (Sichtbarkeit, Suche, Verbindungen). */
export function stopNearby(g = gen) {
  if (g !== gen) return Promise.resolve();
  for (const l of links.values()) l.open = false;
  links.clear();
  on = {};
  return Nearby.stop().catch(() => {});
}

/** Gastgeber: Spiel unter `name` sichtbar machen; onGuest(link) für jeden verbundenen Gast. */
export async function hostNearby(name, onGuest, onError) {
  const g = ++gen;
  await listen({
    connected: ({ id, name: n }) => { const l = new NearbyLink(id, n); links.set(id, l); onGuest(l); },
    error: onError,
  });
  await Nearby.host({ name });
  return { close: () => stopNearby(g) };
}

/**
 * Gast: Spiele in der Nähe suchen. onList([{ id, name }]) bei jeder Änderung.
 * Liefert { join(id) → Link, close() }.
 */
export async function findNearby(name, onList, onError) {
  const found = new Map();
  let pending = null;   // { id, res, rej, timer }
  const list = () => onList([...found.values()]);
  const g = ++gen;
  await listen({
    peerFound: (p) => { found.set(p.id, p); list(); },
    peerLost: ({ id }) => { found.delete(id); list(); },
    connected: ({ id, name: n }) => {
      if (!pending || pending.id !== id) return;
      clearTimeout(pending.timer);
      const l = new NearbyLink(id, n);
      links.set(id, l);
      pending.res(l); pending = null;
    },
    disconnected: ({ id }) => {
      if (!pending || pending.id !== id) return;
      clearTimeout(pending.timer);
      pending.rej(new Error('Verbindung abgelehnt oder abgebrochen – nochmal antippen')); pending = null;
    },
    error: onError,
  });
  await Nearby.browse({ name });
  return {
    join(id) {
      return new Promise((res, rej) => {
        if (pending) { clearTimeout(pending.timer); pending.rej(new Error('abgebrochen')); }
        const timer = setTimeout(() => { pending = null; rej(new Error('Keine Verbindung – nochmal antippen')); }, 25000);
        pending = { id, res, rej, timer };
        Nearby.join({ id }).catch((e) => { clearTimeout(timer); pending = null; rej(new Error(e.message ?? String(e))); });
      });
    },
    close: () => stopNearby(g),
  };
}
