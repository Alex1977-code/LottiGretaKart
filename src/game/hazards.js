// Strecken-Gefahren mit den Gegnern der Lotti-&-Greta-Welt:
//   walker      Pilzling / Panzerkröte / Krabbelkäfer / Rammbock-Bulle laufen quer über die Fahrbahn
//   stampfstein Steinquader schwebt über der Fahrbahn und kracht herunter, wenn ein Kart kommt
//   cannon      Bombenkanone des Barons neben der Strecke schießt Kickbomben (Landeanzeige am Boden)
//   brummer     dicke Hummel (oder Flatterkäfer, model) fliegt quer über die Strecke
//   snapper     Riesen-Schnappblume am Fahrbahnrand schnappt nach Karts, die vorbeifahren
//   roller      Riesenschneeball rollt quer über die Fahrbahn und plättet, wen er erwischt
// Definition in der Strecke: hazards: [{ kind, u, model?, speed?, lat?, side?, every? }]

import * as THREE from 'three';
import { getModel } from '../lgw/course/models/index.js';

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

export class Hazards {
  constructor(race) {
    this.race = race;
    this.list = [];
    this.bombs = [];
  }

  /** Gefahren aller Strecken der Welt (jede an ihrer eigenen Strecke verankert). */
  build(world) {
    for (const c of world.courses) this.buildFor(c.track, c.def.hazards ?? []);
  }

  buildFor(track, defs) {
    for (const d of defs) {
      const base = track.pointAt(d.u, 0);
      const h = { ...d, base, track, t: Math.random() * 3 };
      switch (d.kind) {
        case 'walker': {
          h.model = getModel(d.model ?? 'pilzling', d.opts ?? {});
          h.holder = new THREE.Group();
          h.holder.add(h.model.root);
          h.holder.scale.setScalar(d.scale ?? 1.3);
          h.lat = (Math.random() * 2 - 1) * base.hw;
          h.dir = Math.random() < 0.5 ? -1 : 1;
          h.speed = d.speed ?? 2.2;
          h.radius = d.radius ?? 0.7;
          h.down = 0;
          break;
        }
        case 'brummer': {
          h.model = getModel(d.model ?? 'brummer', d.opts ?? {});
          h.holder = new THREE.Group();
          h.holder.add(h.model.root);
          h.holder.scale.setScalar(1.6);
          h.lat = 0; h.dir = 1; h.speed = d.speed ?? 4; h.radius = 0.9; h.down = 0;
          break;
        }
        case 'snapper': {
          h.model = getModel('riesenschnappblume');
          h.holder = new THREE.Group();
          h.holder.add(h.model.root);
          h.holder.scale.setScalar(d.scale ?? 0.9);
          h.lat = (d.lat ?? 0.6) * base.hw;
          h.phase = 'idle'; h.pt = 0; h.cool = Math.random(); h.down = 0;
          break;
        }
        case 'roller': {
          const R = d.size ?? 2.2;
          const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(R, 2), new THREE.MeshStandardMaterial({ color: 0xf6f9ff, roughness: 0.9, flatShading: true }));
          // ein paar eingerollte Zweige und Steine, damit man das Rollen sieht
          for (let k = 0; k < 5; k++) {
            const bit = new THREE.Mesh(new THREE.BoxGeometry(R * 0.5, R * 0.12, R * 0.12), new THREE.MeshStandardMaterial({ color: k % 2 ? 0x7a5a3a : 0x8a94a8 }));
            const a = k * 2.4, e = (k / 5 - 0.4) * 2;
            bit.position.set(Math.cos(a) * Math.cos(e) * R * 0.95, Math.sin(e) * R * 0.95, Math.sin(a) * Math.cos(e) * R * 0.95);
            bit.lookAt(0, 0, 0);
            ball.add(bit);
          }
          h.model = { root: ball, update() {}, dispose() { ball.geometry.dispose(); } };
          h.holder = new THREE.Group();
          h.holder.add(ball);
          h.R = R; h.radius = R * 0.85;
          h.lat = (Math.random() * 2 - 1) * base.hw;
          h.dir = Math.random() < 0.5 ? -1 : 1;
          h.speed = d.speed ?? 6;
          break;
        }
        case 'stampfstein': {
          h.model = getModel('stampfstein');
          h.holder = new THREE.Group();
          h.holder.add(h.model.root);
          h.holder.scale.setScalar(d.scale ?? 1.25);
          h.lat = (d.lat ?? 0) * base.hw;
          h.state = 'wait'; h.y = 0; h.hover = d.hover ?? 3.6; h.y = h.hover; h.vy = 0; h.cool = Math.random() * 2;
          h.size = 1.8 * (d.scale ?? 1.25);
          break;
        }
        case 'cannon': {
          const side = d.side ?? 1;
          const dist = track.wallAt(base.i) + 3.5;
          const p = track.pointAt(d.u, side * dist);
          h.model = getModel('bomb_cannon');
          h.holder = new THREE.Group();
          h.holder.add(h.model.root);
          h.holder.scale.setScalar(1.2);
          h.pos = new THREE.Vector3(p.x, p.y, p.z);
          // Rohr zeigt zur Strecke
          h.yaw = p.yaw - side * Math.PI / 2;
          h.timer = 1.5 + Math.random() * 2;
          h.every = d.every ?? 3.4;
          h.phase = 'idle'; h.pt = 0;
          break;
        }
        default: continue;
      }
      h.model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
      this.race.scene.add(h.holder);
      this.list.push(h);
    }
  }

  update(dt, t) {
    const race = this.race, focus = race.focus;
    for (const h of this.list) {
      const track = h.track;
      // weit weg: nicht simulieren, nicht zeichnen
      const hp = h.p ?? h.base ?? h.pos;
      if (focus && hp && (hp.x - focus.x) ** 2 + (hp.z - focus.z) ** 2 > 260 * 260) { h.holder.visible = false; continue; }
      if (h.kind !== 'walker' && h.kind !== 'brummer') h.holder.visible = true;
      else if (!(h.down > 0)) h.holder.visible = true;
      h.t += dt;
      switch (h.kind) {
        case 'walker': case 'brummer': {
          const hw = h.base.hw;
          if (h.down > 0) {
            h.down -= dt;
            h.model.update(dt, 'squashed');
            h.holder.visible = h.down > 3.4 || h.down <= 0;
            break;
          }
          h.lat += h.dir * h.speed * dt;
          if (Math.abs(h.lat) > hw - 0.5) { h.lat = clamp(h.lat, -hw + 0.5, hw - 0.5); h.dir *= -1; }
          const p = track.pointAt(h.u, h.lat, h.p ?? (h.p = {}));
          const fly = h.kind === 'brummer' ? 1.2 + 0.3 * Math.sin(h.t * 3) : 0;
          h.holder.position.set(p.x, p.y + fly, p.z);
          // Blick in Laufrichtung (quer zur Strecke)
          h.holder.rotation.y = p.yaw - h.dir * Math.PI / 2;
          h.model.update(dt, h.kind === 'brummer' ? 'fly' : { anim: h.anim ?? 'walk', speed: h.speed });
          for (const r of race.racers) {
              if (r.out) continue;
            const dx = r.pos.x - p.x, dz = r.pos.z - p.z, rr = r.radius + h.radius;
            if (dx * dx + dz * dz < rr * rr && Math.abs(r.pos.y + fly * 0.5 - p.y) < 2) {
              if (r.invincible) { h.down = 4; race.effects.sparkle(h.holder.position, 0xffffff, 12, 3); if (r.isPlayer) race.audio.sfx('stomp'); }
              else if (r.hit('spin', null)) { /* Gegner läuft weiter */ }
            }
          }
          break;
        }
        case 'snapper': {
          const p = track.pointAt(h.u, h.lat, h.p ?? (h.p = {}));
          h.holder.position.set(p.x, p.y, p.z);
          // Blick zur Fahrbahnmitte (Modelle schauen nach +X)
          h.holder.rotation.y = p.yaw + (h.lat > 0 ? Math.PI / 2 : -Math.PI / 2);
          h.cool -= dt;
          if (h.down > 0) { h.down -= dt; h.model.update(dt, { anim: 'retreat' }); break; }
          if (h.phase === 'idle') {
            if (h.cool <= 0) {
              for (const r of race.racers) {
                if (r.out) continue;
                if ((r.pos.x - p.x) ** 2 + (r.pos.z - p.z) ** 2 < 7 * 7) { h.phase = 'snap'; h.pt = 0; h.bit = false; break; }
              }
            }
            h.model.update(dt, { anim: 'idle' });
          } else {
            h.pt += dt;
            const k = Math.min(1, h.pt / 0.8);
            h.model.update(dt, { anim: 'snap', progress: k });
            if (!h.bit && k > 0.42) {
              h.bit = true;
              // Biss: vor der Blume, Richtung Fahrbahnmitte
              const side = h.lat > 0 ? -1 : 1, bx = p.x - track.tz[p.i] * side * 1.8, bz = p.z + track.tx[p.i] * side * 1.8;
              for (const r of race.racers) {
                if (r.out) continue;
                if ((r.pos.x - bx) ** 2 + (r.pos.z - bz) ** 2 < (1.9 + r.radius) ** 2 && Math.abs(r.pos.y - p.y) < 2.5) {
                  if (r.invincible) { h.down = 4; race.effects.sparkle(h.holder.position, 0xffffff, 12, 3); if (r.isPlayer) race.audio.sfx('stomp'); }
                  else r.hit('spin', null);
                }
              }
              const pl = race.player;
              if (pl && Math.hypot(pl.pos.x - p.x, pl.pos.z - p.z) < 25) race.audio.sfx('stomp');
            }
            if (k >= 1) { h.phase = 'idle'; h.cool = 1.4 + Math.random(); }
          }
          // der Stiel ist ein Hindernis
          for (const r of race.racers) {
            if (r.out) continue;
            const dx = r.pos.x - p.x, dz = r.pos.z - p.z, d = Math.hypot(dx, dz), R = r.radius + 0.9;
            if (d < R && d > 1e-4) { r.pos.x += (dx / d) * (R - d); r.pos.z += (dz / d) * (R - d); if (r.bumpCooldown <= 0) { r.speed *= 0.6; r.bumpCooldown = 0.4; } }
          }
          break;
        }
        case 'roller': {
          const hw = h.base.hw + 1;
          h.lat += h.dir * h.speed * dt;
          if (Math.abs(h.lat) > hw) { h.lat = clamp(h.lat, -hw, hw); h.dir *= -1; }
          const p = track.pointAt(h.u, h.lat, h.p ?? (h.p = {}));
          h.holder.position.set(p.x, p.y + h.R * 0.92, p.z);
          h.holder.rotation.y = p.yaw;
          // rollen: Drehung um die Fahrtrichtung der Strecke
          h.model.root.rotation.x -= h.dir * h.speed * dt / h.R;
          for (const r of race.racers) {
            if (r.out) continue;
            const dx = r.pos.x - p.x, dz = r.pos.z - p.z, rr = r.radius + h.radius;
            if (dx * dx + dz * dz < rr * rr && r.pos.y - p.y < h.R * 1.6) {
              if (r.invincible) { if (!(h.cool > 0)) { race.effects.dust(p.x, p.y + 1, p.z, 0xffffff, 4); h.dir *= -1; h.cool = 1; } }
              else if (r.hit('squish', null)) race.effects.dust(p.x, p.y + 1, p.z, 0xffffff, 4);
            }
          }
          if (h.cool > 0) h.cool -= dt;
          break;
        }
        case 'stampfstein': {
          const p = track.pointAt(h.u, h.lat, h.p ?? (h.p = {}));
          h.cool -= dt;
          if (h.state === 'wait') {
            // Kart in Reichweite (vor dem Stein, auf gleicher Höhe der Strecke)?
            // nur Karts, die auf ihn zufahren (vor dem Stein, höchstens 14 m)
            let near = false;
            const tx = track.tx[p.i], tz = track.tz[p.i];
            for (const r of race.racers) {
              if (r.out) continue;
              const dx = r.pos.x - p.x, dz = r.pos.z - p.z;
              const along = dx * tx + dz * tz;
              if (along < -3 && along > -14 && Math.abs(-dx * tz + dz * tx) < h.size * 1.5) { near = true; break; }
            }
            if (near && h.cool <= 0) { h.state = 'fall'; h.vy = 0; }
          } else if (h.state === 'fall') {
            h.vy += 60 * dt; h.y -= h.vy * dt;
            if (h.y <= 0) {
              h.y = 0; h.state = 'angry'; h.st = 0.9;
              race.effects.dust(p.x, p.y, p.z, 0xc8c0d8, 3);
              for (let k = 0; k < 6; k++) race.effects.dust(p.x + (Math.random() - 0.5) * h.size * 2, p.y, p.z + (Math.random() - 0.5) * h.size * 2, 0xc8c0d8, 2.2);
              const pl = race.player;
              const dd = pl ? Math.hypot(pl.pos.x - p.x, pl.pos.z - p.z) : 99;
              if (dd < 35) { race.audio.sfx('slam'); race.shake = Math.max(race.shake ?? 0, 0.8 * (1 - dd / 35)); }
              for (const r of race.racers) {
              if (r.out) continue;
                const dx = r.pos.x - p.x, dz = r.pos.z - p.z;
                if (Math.abs(dx) < h.size * 0.75 + r.radius * 0.6 && Math.abs(dz) < h.size * 0.75 + r.radius * 0.6) r.hit('squish', null);
              }
            }
          } else if (h.state === 'angry') {
            h.st -= dt;
            if (h.st <= 0) h.state = 'rise';
          } else if (h.state === 'rise') {
            h.y += 2.2 * dt;
            if (h.y >= h.hover) { h.y = h.hover; h.state = 'wait'; h.cool = 2.2; }
          }
          h.holder.position.set(p.x, p.y + h.y, p.z);
          h.holder.rotation.y = p.yaw + Math.PI;
          h.model.update(dt, h.state);
          // auf dem Boden ist er eine Wand: Karts prallen ab
          if (h.y < 1.2) {
            const tx = track.tx[p.i], tz = track.tz[p.i];
            for (const r of race.racers) {
              if (r.out) continue;
              const dx = r.pos.x - p.x, dz = r.pos.z - p.z, half = h.size * 0.5 + r.radius * 0.7;
              const along = dx * tx + dz * tz, side = -dx * tz + dz * tx;
              if (Math.abs(along) < half && Math.abs(side) < half) {
                // aus dem Stein heraus: zur näheren Seite (vorn/hinten bzw. links/rechts)
                const pa = half - Math.abs(along), ps = half - Math.abs(side);
                // seitlich hinaus, wenn das kürzer ist; sonst nach hinten zurückprallen (einmaliger Stoß, keine Falle)
                if (ps < pa * 1.5) { const k = (Math.sign(side) || 1) * ps * 1.02; r.pos.x += -tz * k; r.pos.z += tx * k; }
                else { const k = (Math.sign(along) || 1) * pa * 1.02; r.pos.x += tx * k; r.pos.z += tz * k; }
                if (r.bumpCooldown <= 0) { r.speed *= 0.35; r.vlat += (Math.sign(side) || 1) * 4; r.bumpCooldown = 0.5; if (r.isPlayer) race.audio.sfx('land'); }
              }
            }
          }
          break;
        }
        case 'cannon': {
          h.holder.position.copy(h.pos);
          h.holder.rotation.y = h.yaw;
          // nur feuern, wenn das Feld voll ist (nicht vor dem Start)
          if (race.state === 'race' || race.state === 'finish') h.timer -= dt;
          if (h.phase === 'idle' && h.timer <= 0.7) { h.phase = 'charge'; h.pt = 0; }
          if (h.phase === 'charge') {
            h.pt += dt;
            if (h.timer <= 0) { h.phase = 'fire'; h.pt = 0; h.timer = h.every + Math.random() * 1.5; this.fireBomb(h); }
          } else if (h.phase === 'fire') {
            h.pt += dt;
            if (h.pt > 0.5) h.phase = 'idle';
          }
          h.model.update(dt, { anim: h.phase, aim: 0.75, progress: h.phase === 'charge' ? clamp(h.pt / 0.7, 0, 1) : clamp(h.pt / 0.5, 0, 1) });
          break;
        }
        default: break;
      }
    }
    // fliegende Bomben der Kanonen
    for (const b of this.bombs) {
      b.t += dt;
      const k = clamp(b.t / b.dur, 0, 1);
      b.holder.position.set(b.from.x + (b.to.x - b.from.x) * k, b.from.y + (b.to.y - b.from.y) * k + Math.sin(k * Math.PI) * 9, b.from.z + (b.to.z - b.from.z) * k);
      b.model.update(dt, { anim: 'lit', fuse: k });
      b.marker.update(dt, { k });
      if (k >= 1) {
        race.items.explode(b.to, 4.2, null);
        b.dead = true;
        b.model.dispose(); b.holder.removeFromParent();
        b.marker.dispose();
      }
    }
    this.bombs = this.bombs.filter((b) => !b.dead);
  }

  fireBomb(h) {
    const race = this.race, track = h.track;
    // Ziel: zufällige Stelle auf der Fahrbahn, bevorzugt vor der Spitzengruppe nahe der Kanone
    const du = (Math.random() * 2 - 1) * (22 / track.length);
    const tp = track.pointAt(h.u + du, (Math.random() * 2 - 1) * h.base.hw * 0.8);
    const model = getModel('kickbombe');
    const holder = new THREE.Group();
    holder.add(model.root);
    holder.scale.setScalar(1.3);
    race.scene.add(holder);
    const marker = getModel('boss_marker');
    marker.root.position.set(tp.x, tp.y + 0.09, tp.z);
    marker.root.scale.setScalar(2.4);
    race.scene.add(marker.root);
    const from = h.pos.clone(); from.y += 2.4;
    this.bombs.push({ model, holder, marker, from, to: new THREE.Vector3(tp.x, tp.y, tp.z), t: 0, dur: 1.5 });
    const pl = race.player;
    if (pl && Math.hypot(pl.pos.x - h.pos.x, pl.pos.z - h.pos.z) < 60) race.audio.sfx('slam');
  }

  dispose() {
    for (const h of this.list) { h.model.dispose(); h.holder.removeFromParent(); }
    for (const b of this.bombs) { b.model.dispose(); b.holder.removeFromParent(); b.marker.dispose(); }
    this.list.length = 0; this.bombs.length = 0;
  }
}
