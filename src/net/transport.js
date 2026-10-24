// Verbindungen zwischen Handys. Zwei Wege:
//   Internet  – Raumcode: Gastgeber und Gäste treffen sich über einen öffentlichen MQTT-Vermittler (mqtt.js) unter
//               „lottigretakart/v1/<CODE>“. Dort tauschen sie die WebRTC-Verbindungsdaten aus und sprechen danach
//               direkt miteinander. Klappt das nicht innerhalb weniger Sekunden (z. B. beide Handys im Mobilfunk,
//               strenge Router), laufen die Spieldaten einfach über den Vermittler weiter (Umleitung, etwas träger).
//   Ohne Netz – gleiches WLAN oder Hotspot: Angebot und Antwort werden als QR-Code (oder Text) ausgetauscht,
//               danach sprechen die Handys direkt miteinander. Kein Server nötig.
// Jede Verbindung ist ein Link { id, send(obj), onMessage, onClose, close(), relay? } mit JSON-Nachrichten.

import { Mqtt, BROKERS } from './mqtt.js';

const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];
const TOPIC = 'lottigretakart/v1';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // ohne 0/O und 1/I
const RTC_WAIT = 7000;     // ms: so lange wird eine direkte Verbindung versucht, dann Umleitung
// Test/Notfall: ?relay=1 (oder localStorage lgk.relay=1) erzwingt die Umleitung über den Vermittler
const forceRelay = () => { try { return /[?&]relay=1/.test(location.search) || localStorage.getItem('lgk.relay') === '1'; } catch (_) { return false; } };

/** Raumcode; der erste Buchstabe legt den Vermittler fest (Gäste finden so denselben). */
export const makeCode = (broker = 0) => {
  const first = [...ALPHA].filter((c, i) => i % BROKERS.length === broker);
  return first[Math.floor(Math.random() * first.length)] + Array.from({ length: 3 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');
};
const brokerOf = (code) => { const i = ALPHA.indexOf(code[0]); return i < 0 ? -1 : i % BROKERS.length; };
const rid = () => Math.random().toString(36).slice(2, 10);

class Link {
  constructor(id) { this.id = id; this.onMessage = null; this.onClose = null; this.open = false; }
  send(obj) { /* von Unterklassen */ }
  close() { /* von Unterklassen */ }
}

/** Link über den Vermittler (Umleitung): Nachrichten gehen als MQTT-Nachricht an das Thema des Partners. */
class RelayLink extends Link {
  constructor(id, out) {
    super(id);
    this.out = out;          // (obj) → senden
    this.relay = true;
    this.open = true;
    this.seen = Date.now();
    // Lebenszeichen: alle 3 s; 15 s nichts gehört = Partner weg
    this.beat = setInterval(() => {
      if (!this.open) return;
      this.out({ k: 'p' });
      if (Date.now() - this.seen > 15000) this.lost();
    }, 3000);
  }
  /** Eingang vom Vermittler. */
  take(msg) {
    this.seen = Date.now();
    if (msg.k === 'm') { try { this.onMessage?.(msg.d); } catch (e) { console.warn(e); } }
    else if (msg.k === 'bye') this.lost();
  }
  send(obj) { if (this.open) this.out({ k: 'm', d: obj }); }
  lost() { if (!this.open) return; this.open = false; clearInterval(this.beat); this.onGone?.(); this.onClose?.(); }
  close() {
    if (!this.open) return;
    this.out({ k: 'bye' });
    this.open = false; clearInterval(this.beat); this.onGone?.();
    setTimeout(() => this.onClose?.(), 0);   // wie bei WebRTC: Schließen meldet sich etwas später
  }
}

/** Link über einen eigenen RTCDataChannel (QR-Kopplung). */
class ChannelLink extends Link {
  constructor(id, pc, ch) {
    super(id);
    this.pc = pc; this.ch = ch;
    ch.onmessage = (e) => { try { this.onMessage?.(JSON.parse(e.data)); } catch (_) { /* kaputte Nachricht */ } };
    ch.onclose = () => { this.open = false; this.onClose?.(); };
    pc.onconnectionstatechange = () => { if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) { this.open = false; this.onClose?.(); } };
  }
  send(obj) { if (this.ch.readyState === 'open') this.ch.send(JSON.stringify(obj)); }
  close() { try { this.ch.close(); this.pc.close(); } catch (_) { /* egal */ } }
}

// ------------------------------------------------------------------ Internet (Raumcode)
/** Ersten erreichbaren Vermittler verbinden (ab Index `from`). */
async function anyBroker(from = 0) {
  let last = null;
  for (let k = 0; k < BROKERS.length; k++) {
    const i = (from + k) % BROKERS.length;
    try { return { mq: await Mqtt.connect(BROKERS[i]), i }; } catch (e) { last = e; }
  }
  throw new Error(`Kein Vermittler erreichbar – Internet prüfen (${last?.message ?? ''})`);
}

/** Gastgeber: Raum öffnen. onGuest(link) für jeden neuen Gast. Liefert { code, close } oder wirft. */
export async function hostOnline(onGuest, onError) {
  const { mq, i } = await anyBroker(Math.floor(Math.random() * BROKERS.length));
  const code = makeCode(i), T = `${TOPIC}/${code}`;
  const guests = new Map();   // gid → { pc, ch, link, mode, timer }
  const toGuest = (gid, obj) => mq.publish(`${T}/g/${gid}`, JSON.stringify(obj));
  const decide = (gid, g, mode) => {
    if (g.mode) return;
    g.mode = mode;
    clearTimeout(g.timer);
    if (mode === 'rtc') {
      toGuest(gid, { k: 'rtc' });
      g.link = new ChannelLink(gid, g.pc, g.ch);
      g.link.open = true;
    } else {
      try { g.pc?.close(); } catch (_) { /* egal */ }
      toGuest(gid, { k: 'relay' });
      g.link = new RelayLink(gid, (o) => toGuest(gid, o));
    }
    const l = g.link;
    l.onGone = () => guests.delete(gid);
    onGuest(l);
    const userClose = l.onClose;   // von der Sitzung gesetzt
    l.onClose = () => { guests.delete(gid); userClose?.(); };
  };
  mq.subscribe(`${T}/h`, async (text) => {
    let m; try { m = JSON.parse(text); } catch (_) { return; }
    const gid = m.g;
    if (!gid) return;
    let g = guests.get(gid);
    if (m.k === 'hi') {
      toGuest(gid, { k: 'hi' });
      if (g) return;   // doppeltes Hallo
      g = { mode: null };
      guests.set(gid, g);
      if (forceRelay() || typeof RTCPeerConnection === 'undefined') { decide(gid, g, 'relay'); return; }
      g.timer = setTimeout(() => decide(gid, g, 'relay'), RTC_WAIT);
      try {
        g.pc = new RTCPeerConnection({ iceServers: ICE });
        g.ch = g.pc.createDataChannel('lg', { ordered: true });
        g.ch.onopen = () => decide(gid, g, 'rtc');
        await g.pc.setLocalDescription(await g.pc.createOffer());
        await gathered(g.pc);
        if (!g.mode) toGuest(gid, { k: 'offer', d: g.pc.localDescription.sdp });
      } catch (_) { decide(gid, g, 'relay'); }
      return;
    }
    if (!g) return;
    if (m.k === 'answer' && g.pc && !g.mode) { try { await g.pc.setRemoteDescription({ type: 'answer', sdp: m.d }); } catch (_) { decide(gid, g, 'relay'); } return; }
    if (g.link?.relay) g.link.take(m);
  });
  mq.onClose = () => { for (const g of guests.values()) g.link?.relay && g.link.lost(); onError?.(new Error('Vermittler getrennt')); };
  return { code, close: () => { for (const g of guests.values()) g.link?.close(); mq.close(); } };
}

/** Gast: mit Raumcode verbinden. Liefert einen offenen Link oder wirft. */
export async function joinOnline(code) {
  code = code.toUpperCase().trim();
  const b = brokerOf(code);
  if (code.length !== 4 || b < 0) throw new Error('Bitte den vierstelligen Raumcode prüfen');
  let mq;
  try { mq = await Mqtt.connect(BROKERS[b]); } catch (e) { throw new Error(`Vermittler nicht erreichbar – Internet prüfen (${e.message})`); }
  const gid = rid(), T = `${TOPIC}/${code}`;
  const toHost = (obj) => mq.publish(`${T}/h`, JSON.stringify({ g: gid, ...obj }));
  return await new Promise((resolve, reject) => {
    let pc = null, ch = null, relay = null, greeted = false, done = false;
    const finish = (err, link) => {
      if (done) return;
      done = true;
      clearInterval(hello); clearTimeout(timer);
      if (err) { try { pc?.close(); } catch (_) { /* egal */ } mq.close(); reject(err); return; }
      resolve(link);
    };
    const hello = setInterval(() => toHost({ k: 'hi' }), 1500);
    const timer = setTimeout(() => finish(new Error(greeted ? 'Verbindung kam nicht zustande – nochmal versuchen' : 'Kein Spiel mit diesem Code gefunden (Gastgeber noch im Menü „Spiel erstellen“?)')), greeted ? 25000 : 9000);
    mq.subscribe(`${T}/g/${gid}`, async (text) => {
      let m; try { m = JSON.parse(text); } catch (_) { return; }
      if (relay) { relay.take(m); return; }
      if (m.k === 'hi') { if (!greeted) { greeted = true; clearInterval(hello); clearTimeout(timer); setTimeout(() => finish(new Error('Verbindung kam nicht zustande – nochmal versuchen')), 25000); } return; }
      if (m.k === 'offer' && !pc) {
        try {
          pc = new RTCPeerConnection({ iceServers: ICE });
          pc.ondatachannel = (e) => { ch = e.channel; };
          await pc.setRemoteDescription({ type: 'offer', sdp: m.d });
          await pc.setLocalDescription(await pc.createAnswer());
          await gathered(pc);
          toHost({ k: 'answer', d: pc.localDescription.sdp });
        } catch (_) { /* dann entscheidet der Gastgeber auf Umleitung */ }
        return;
      }
      if (m.k === 'rtc') {
        const use = () => { const l = new ChannelLink('host', pc, ch); l.open = true; mq.close(); finish(null, l); };
        if (ch?.readyState === 'open') use();
        else {
          const wait = setInterval(() => { if (ch?.readyState === 'open') { clearInterval(wait); use(); } }, 50);
          setTimeout(() => clearInterval(wait), 5000);
        }
        return;
      }
      if (m.k === 'relay') {
        try { pc?.close(); } catch (_) { /* egal */ }
        relay = new RelayLink('host', (o) => toHost(o));
        relay.onGone = () => setTimeout(() => mq.close(), 200);
        finish(null, relay);
      }
    });
    mq.onClose = () => { if (relay) relay.lost(); else finish(new Error('Vermittler getrennt')); };
    toHost({ k: 'hi' });
  });
}

// ------------------------------------------------------------------ Ohne Internet (QR-Kopplung im selben WLAN)
async function pack(type, sdp) {
  // nur nötige Zeilen, dann deflate + base64url → kurz genug für einen QR-Code
  const keep = sdp.split('\r\n').filter((l) => l && !/^a=(extmap|rtcp|ssrc|msid-semantic)/.test(l)).join('\n');
  let bytes = new TextEncoder().encode(keep);
  if (typeof CompressionStream !== 'undefined') {
    const cs = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    bytes = new Uint8Array(await new Response(cs).arrayBuffer());
    type += 'z';
  }
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return `LGK1${type}:${btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
}

async function unpack(text) {
  const m = /^LGK1([OA])(z?):(.+)$/.exec(text.trim());
  if (!m) throw new Error('Das ist kein Lotti-&-Greta-Kart-Code');
  const bin = atob(m[3].replace(/-/g, '+').replace(/_/g, '/'));
  let bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  if (m[2]) {
    const ds = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    bytes = new Uint8Array(await new Response(ds).arrayBuffer());
  }
  const sdp = new TextDecoder().decode(bytes).split('\n').join('\r\n') + '\r\n';
  return { type: m[1] === 'O' ? 'offer' : 'answer', sdp };
}

function gathered(pc) {
  return new Promise((res) => {
    if (pc.iceGatheringState === 'complete') { res(); return; }
    const t = setTimeout(res, 2500);
    pc.addEventListener('icegatheringstatechange', () => { if (pc.iceGatheringState === 'complete') { clearTimeout(t); res(); } });
  });
}

/**
 * Gastgeber (ohne Internet): neues Angebot für einen Gast. Liefert { code (Text für den QR), accept(answerText) → Link }.
 * Ohne Server: nur Verbindungen im selben Netz (WLAN, Hotspot).
 */
export async function offerLocal(online = false) {
  const pc = new RTCPeerConnection({ iceServers: online ? ICE : [] });
  const ch = pc.createDataChannel('lg', { ordered: true });
  await pc.setLocalDescription(await pc.createOffer());
  await gathered(pc);
  const code = await pack('O', pc.localDescription.sdp);
  const id = `qr-${Math.random().toString(36).slice(2, 7)}`;
  return {
    code,
    async accept(answerText) {
      const a = await unpack(answerText);
      if (a.type !== 'answer') throw new Error('Bitte den Antwort-Code des Gasts scannen');
      await pc.setRemoteDescription({ type: 'answer', sdp: a.sdp });
      return await new Promise((res, rej) => {
        const t = setTimeout(() => rej(new Error('Keine Verbindung – sind beide im selben WLAN?')), 15000);
        const done = () => { clearTimeout(t); const l = new ChannelLink(id, pc, ch); l.open = true; res(l); };
        if (ch.readyState === 'open') done(); else ch.onopen = done;
      });
    },
    close() { try { pc.close(); } catch (_) { /* egal */ } },
  };
}

/** Gast (ohne Internet): Angebot einlesen, Antwort-Code erzeugen; link wartet auf die Verbindung. */
export async function answerLocal(offerText, online = false) {
  const o = await unpack(offerText);
  if (o.type !== 'offer') throw new Error('Bitte den Code des Gastgebers scannen');
  const pc = new RTCPeerConnection({ iceServers: online ? ICE : [] });
  const link = new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error('Keine Verbindung – sind beide im selben WLAN?')), 60000);
    pc.ondatachannel = (e) => {
      const ch = e.channel;
      const done = () => { clearTimeout(t); const l = new ChannelLink('host', pc, ch); l.open = true; res(l); };
      if (ch.readyState === 'open') done(); else ch.onopen = done;
    };
  });
  await pc.setRemoteDescription({ type: 'offer', sdp: o.sdp });
  await pc.setLocalDescription(await pc.createAnswer());
  await gathered(pc);
  return { code: await pack('A', pc.localDescription.sdp), link };
}
