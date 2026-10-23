// Mehrspieler über mehrere Handys: Sitzung des Gastgebers bzw. eines Gasts (Lobby, Start, Rennen, Ergebnisse).
//   Gastgeber: hält die Liste der Gäste (Figur je Gast), startet Rennen und schickt Schnappschüsse.
//   Gast:      wählt seine Figur, wartet auf den Start, fährt mit und bekommt die Ergebnisse.
// Nachrichten (JSON): hello/pick (Gast → Gastgeber), lobby/start/s/done/menu/bye (Gastgeber → Gast), u (Gast-Lage).

import { hostOnline, joinOnline, offerLocal, answerLocal } from './transport.js';
import { hostNearby, findNearby } from './nearby.js';

export class NetSession {
  constructor(role, { onChange = null, onStart = null, onDone = null, onMenu = null, onLost = null } = {}) {
    this.role = role;
    this.guests = [];      // Gastgeber: [{ id, link, racer, name }]
    this.link = null;      // Gast: Verbindung zum Gastgeber
    this.lobby = null;     // Gast: letzter Lobby-Stand
    this.myRacer = null;
    this.code = null;
    this.handlers = { onChange, onStart, onDone, onMenu, onLost };
    this.race = null;      // laufendes Rennen (für Schnappschüsse / Lage der Gäste)
  }

  get isHost() { return this.role === 'host'; }
  emit(name, ...a) { this.handlers[name]?.(...a); }

  // ------------------------------------------------------------------ Gastgeber
  async openOnline() {
    const room = await hostOnline((link) => this.addGuest(link), () => {});
    this.room = room;
    this.code = room.code;
    return room.code;
  }

  /** iPhone-App: Spiel in der Nähe sichtbar machen (Bluetooth/WLAN direkt, auch im Flugmodus). */
  async openNearby(name, onError) {
    this.nearbyName = name;
    this.nearby = await hostNearby(name, (link) => this.addGuest(link), onError);
  }

  /** Ohne Internet: Angebot für einen weiteren Gast (QR). */
  async newOffer() {
    this.offer?.close?.();
    this.offer = await offerLocal(false);
    return this.offer.code;
  }

  async acceptAnswer(text) {
    const link = await this.offer.accept(text);
    this.offer = null;
    this.addGuest(link);
  }

  addGuest(link) {
    const g = { id: link.id, link, racer: null };
    this.guests.push(g);
    link.onMessage = (m) => this.fromGuest(g, m);
    link.onClose = () => this.dropGuest(g);
    this.sendLobby();
    this.emit('onChange');
  }

  dropGuest(g) {
    if (!this.guests.includes(g)) return;
    this.guests.splice(this.guests.indexOf(g), 1);
    // im Rennen übernimmt der Computer das Kart
    const r = this.race?.racers.find((x) => x.netId === g.id);
    if (r) this.race.netDropped(r);
    this.sendLobby();
    this.emit('onChange');
  }

  fromGuest(g, m) {
    if (m.t === 'u') {
      const r = this.race?.racers.find((x) => x.netId === g.id);
      if (r) r.netState = { ...m, at: performance.now() };
      return;
    }
    if (m.t === 'hello' || m.t === 'pick') {
      g.racer = this.freeRacer(m.racer, g);
      this.sendLobby();
      this.emit('onChange');
    }
    if (m.t === 'bye') g.link.close();
  }

  /** Gewünschte Figur, falls frei – sonst die nächste freie. */
  freeRacer(want, g) {
    const taken = new Set([this.myRacer, ...this.guests.filter((x) => x !== g).map((x) => x.racer)]);
    if (want && !taken.has(want)) return want;
    return this.racerIds.find((id) => !taken.has(id));
  }

  setMyRacer(id) {
    this.myRacer = id;
    for (const g of this.guests) if (g.racer === id) g.racer = this.freeRacer(null, g);
    this.sendLobby();
  }

  sendLobby() {
    const players = [{ id: 'host', racer: this.myRacer }, ...this.guests.map((g) => ({ id: g.id, racer: g.racer }))];
    for (const g of this.guests) g.link.send({ t: 'lobby', players, you: g.id, code: this.code });
  }

  broadcast(obj) { for (const g of this.guests) g.link.send(obj); }

  /** Spieler für den Rennstart: Gastgeber (lokale Eingabe) und Gäste (über das Netz). */
  players() {
    return [{ id: this.myRacer, src: 'auto' }, ...this.guests.filter((g) => g.racer).map((g) => ({ id: g.racer, src: `net:${g.id}` }))];
  }

  /** Rennen beim Gastgeber gestartet: allen Gästen die Startdaten schicken. */
  startRace(race, info) {
    this.race = race;
    this.broadcast({ t: 'start', o: info });
  }

  raceDone(res, info = {}) { this.broadcast({ t: 'done', res, ...info }); }
  toMenu() { this.race = null; this.broadcast({ t: 'menu' }); }

  // ------------------------------------------------------------------ Gast
  async joinOnline(code) {
    this.link = await joinOnline(code);
    this.bindHost();
  }

  /** iPhone-App: Spiele in der Nähe suchen; onList([{ id, name }]). */
  async findNearby(name, onList, onError) {
    this.finder = await findNearby(name, onList, onError);
  }

  async joinNearby(id) {
    this.link = await this.finder.join(id);
    this.bindHost();
  }

  /** Ohne Internet: Angebot des Gastgebers einlesen; liefert den Antwort-Code (QR) und verbindet im Hintergrund. */
  async answer(offerText) {
    const a = await answerLocal(offerText, false);
    a.link.then((l) => { this.link = l; this.bindHost(); this.emit('onChange'); }).catch((e) => this.emit('onLost', e.message));
    return a.code;
  }

  bindHost() {
    this.link.onMessage = (m) => this.fromHost(m);
    this.link.onClose = () => this.emit('onLost', 'Verbindung zum Gastgeber verloren');
    this.link.send({ t: 'hello', racer: this.myRacer });
  }

  fromHost(m) {
    switch (m.t) {
      case 'lobby':
        this.lobby = m;
        this.myId = m.you;
        this.myRacer = m.players.find((p) => p.id === m.you)?.racer ?? this.myRacer;
        this.emit('onChange');
        break;
      case 'start': this.emit('onStart', m.o); break;
      case 's': if (this.race) this.race.netSnapshot(m); break;
      case 'done': this.emit('onDone', m); break;
      case 'menu': this.race = null; this.emit('onMenu'); break;
      default: break;
    }
  }

  pick(id) { this.myRacer = id; this.link?.send({ t: 'pick', racer: id }); }
  send(obj) { this.link?.send(obj); }

  close() {
    try { if (this.isHost) { this.broadcast({ t: 'menu' }); for (const g of this.guests) g.link.close(); this.room?.close(); this.offer?.close?.(); } else { this.link?.send({ t: 'bye' }); this.link?.close(); this.link?.peer?.destroy?.(); } } catch (_) { /* egal */ }
    // Nahbereich zuletzt beenden (die Abschiedsnachricht soll noch rausgehen)
    if (this.nearby || this.finder) setTimeout(() => { this.nearby?.close(); this.finder?.close(); }, 150);
  }
}
