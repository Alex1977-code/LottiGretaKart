// Kleinster MQTT-3.1.1-Client über WebSocket (nur, was das Spiel braucht: verbinden, abonnieren, QoS-0-Nachrichten
// senden und empfangen, Lebenszeichen). Dient als Vermittler für den Raumcode und – wenn zwei Handys keine direkte
// Verbindung aufbauen können (z. B. beide im Mobilfunk) – als Umleitung für die Spieldaten.
// Öffentliche Broker, kostenlos und ohne Anmeldung; der Raumcode legt fest, welcher benutzt wird.

const OWN = (() => { try { return localStorage.getItem('lgk.broker'); } catch (_) { return null; } })();   // eigener Vermittler (Tests)
export const BROKERS = OWN ? [OWN] : [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

const enc = new TextEncoder(), dec = new TextDecoder();

function str(s) { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; }
function packet(type, flags, body) {
  const len = [];
  let n = body.length;
  do { let d = n % 128; n = Math.floor(n / 128); if (n > 0) d |= 128; len.push(d); } while (n > 0);
  const out = new Uint8Array(1 + len.length + body.length);
  out[0] = (type << 4) | flags; out.set(len, 1); out.set(body, 1 + len.length);
  return out;
}

export class Mqtt {
  /** Verbinden (wirft nach `timeout` ms oder bei Fehler). onMessage(topic, text). */
  static connect(url, { timeout = 8000 } = {}) {
    return new Promise((resolve, reject) => {
      const m = new Mqtt();
      let ws;
      try { ws = new WebSocket(url, 'mqtt'); } catch (e) { reject(e); return; }
      ws.binaryType = 'arraybuffer';
      m.ws = ws; m.url = url;
      const timer = setTimeout(() => { try { ws.close(); } catch (_) { /* egal */ } reject(new Error('Vermittler antwortet nicht')); }, timeout);
      ws.onopen = () => {
        const id = `lgk-${Math.random().toString(36).slice(2, 12)}`;
        ws.send(packet(1, 0, [...str('MQTT'), 4, 0x02, 0, 60, ...str(id)]));
      };
      ws.onerror = () => { clearTimeout(timer); reject(new Error('Vermittler nicht erreichbar')); };
      ws.onclose = () => {
        clearTimeout(timer); clearInterval(m.ping);
        const was = m.closed;
        m.closed = true;
        reject(new Error('Vermittler hat die Verbindung beendet'));
        if (!was) m.onClose?.();   // nur unerwartetes Trennen melden
      };
      ws.onmessage = (e) => m.feed(new Uint8Array(e.data), () => {
        clearTimeout(timer);
        m.ping = setInterval(() => m.raw(new Uint8Array([0xc0, 0])), 25000);
        resolve(m);
      }, (rc) => { clearTimeout(timer); reject(new Error(`Vermittler lehnt ab (${rc})`)); });
    });
  }

  constructor() { this.buf = new Uint8Array(0); this.subs = new Map(); this.pid = 1; this.closed = false; this.onClose = null; }

  raw(bytes) { if (!this.closed && this.ws.readyState === 1) this.ws.send(bytes); }

  /** Thema abonnieren; fn(text, topic) für jede Nachricht (Thema darf mit /# enden). */
  subscribe(topic, fn) {
    this.subs.set(topic, fn);
    const id = this.pid++ & 0xffff || 1;
    this.raw(packet(8, 2, [id >> 8, id & 255, ...str(topic), 0]));
  }

  publish(topic, text) { this.raw(packet(3, 0, [...str(topic), ...enc.encode(text)])); }

  close() {
    if (this.closed) return;
    this.raw(new Uint8Array([0xe0, 0]));
    this.closed = true;
    clearInterval(this.ping);
    try { this.ws.close(); } catch (_) { /* egal */ }
  }

  /** Eingehende Bytes zu Paketen zusammensetzen (ein WebSocket-Rahmen kann Teile oder mehrere Pakete enthalten). */
  feed(bytes, onConnack, onRefused) {
    const b = new Uint8Array(this.buf.length + bytes.length);
    b.set(this.buf); b.set(bytes, this.buf.length);
    let p = 0;
    while (p + 2 <= b.length) {
      let len = 0, mul = 1, q = p + 1, d;
      do { if (q >= b.length) { d = -1; break; } d = b[q++]; len += (d & 127) * mul; mul *= 128; } while (d & 128);
      if (d === -1 || q + len > b.length) break;
      this.handle(b[p] >> 4, b.subarray(q, q + len), onConnack, onRefused);
      p = q + len;
    }
    this.buf = b.slice(p);
  }

  handle(type, body, onConnack, onRefused) {
    if (type === 2) { if (body[1] === 0) onConnack(); else onRefused(body[1]); return; }
    if (type !== 3) return;   // nur PUBLISH (QoS 0) interessiert
    const tl = (body[0] << 8) | body[1];
    const topic = dec.decode(body.subarray(2, 2 + tl));
    const text = dec.decode(body.subarray(2 + tl));
    for (const [t, fn] of this.subs) {
      if (t === topic || (t.endsWith('/#') && topic.startsWith(t.slice(0, -1)))) { try { fn(text, topic); } catch (_) { /* Fehler im Empfänger */ } }
    }
  }
}
