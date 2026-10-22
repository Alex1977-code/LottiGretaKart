// Verbindungen zwischen Handys (WebRTC-Datenkanal). Zwei Wege:
//   Internet  – Raumcode: der Gastgeber meldet sich beim öffentlichen PeerJS-Vermittler unter „lgkart-<CODE>“ an,
//               Gäste verbinden sich mit dem Code (funktioniert über beliebige Entfernungen).
//   Ohne Netz – gleiches WLAN oder Hotspot (z. B. im Flugzeug): Angebot und Antwort werden als QR-Code (oder Text)
//               ausgetauscht, danach sprechen die Handys direkt miteinander. Kein Server nötig.
// Jede Verbindung ist ein Link { id, send(obj), onMessage, onClose, close() } mit JSON-Nachrichten.

import { Peer } from 'peerjs';

const ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // freier TURN-Dienst als Rückfall für strenge Router (ohne Gewähr)
  { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
];
const PREFIX = 'lgkart-';
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // ohne 0/O und 1/I

export const makeCode = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(Math.random() * ALPHA.length)]).join('');

class Link {
  constructor(id) { this.id = id; this.onMessage = null; this.onClose = null; this.open = false; }
  send(obj) { /* von Unterklassen */ }
  close() { /* von Unterklassen */ }
}

/** Link über eine PeerJS-Verbindung. */
class PeerLink extends Link {
  constructor(conn) {
    super(conn.peer);
    this.conn = conn;
    conn.on('data', (d) => { try { this.onMessage?.(typeof d === 'string' ? JSON.parse(d) : d); } catch (_) { /* kaputte Nachricht */ } });
    conn.on('close', () => { this.open = false; this.onClose?.(); });
    conn.on('error', () => { this.open = false; this.onClose?.(); });
  }
  send(obj) { if (this.conn.open) this.conn.send(JSON.stringify(obj)); }
  close() { try { this.conn.close(); } catch (_) { /* egal */ } }
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
/** Gastgeber: Raum öffnen. onGuest(link) für jeden neuen Gast. Liefert { code, close } oder wirft. */
export function hostOnline(onGuest, onError) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const attempt = () => {
      const code = makeCode();
      const peer = new Peer(PREFIX + code, { config: { iceServers: ICE }, debug: 0 });
      peer.on('open', () => resolve({ code, close: () => peer.destroy(), peer }));
      peer.on('connection', (conn) => {
        conn.on('open', () => { const l = new PeerLink(conn); l.open = true; onGuest(l); });
      });
      peer.on('error', (err) => {
        if (err.type === 'unavailable-id' && tries++ < 4) { peer.destroy(); attempt(); return; }
        if (!peer.open) reject(err); else onError?.(err);
      });
    };
    attempt();
  });
}

/** Gast: mit Raumcode verbinden. Liefert einen offenen Link oder wirft. */
export function joinOnline(code) {
  return new Promise((resolve, reject) => {
    const peer = new Peer(undefined, { config: { iceServers: ICE }, debug: 0 });
    const timer = setTimeout(() => { peer.destroy(); reject(new Error('Zeitüberschreitung – Code prüfen')); }, 15000);
    peer.on('open', () => {
      const conn = peer.connect(PREFIX + code.toUpperCase().trim(), { reliable: true, serialization: 'raw' });
      conn.on('open', () => { clearTimeout(timer); const l = new PeerLink(conn); l.open = true; l.peer = peer; resolve(l); });
      conn.on('error', (e) => { clearTimeout(timer); reject(e); });
    });
    peer.on('error', (e) => { clearTimeout(timer); peer.destroy(); reject(e.type === 'peer-unavailable' ? new Error('Kein Spiel mit diesem Code gefunden') : e); });
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
  const pc = new RTCPeerConnection({ iceServers: online ? ICE.slice(0, 2) : [] });
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
  const pc = new RTCPeerConnection({ iceServers: online ? ICE.slice(0, 2) : [] });
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
