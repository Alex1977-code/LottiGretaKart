// Gegenstände: Funkel-Kisten (Glücksrad), Bitcoins auf der Strecke, Turbo-Felder, Sprungschanzen und alle
// Geschosse. Die Modelle stammen aus der Lotti-&-Greta-Welt (Kurs-Modelle, Maßstab Meter, Blick +X).
//
// Gegenstände (id → Wirkung):
//   beere / beere3  Turbo-Beere (Wachstumsbeere): kurzer Turbo, dreifach für die Hinteren
//   panzer          Panzer der Panzerkröte: fliegt geradeaus, prallt von Banden ab
//   goldpanzer      goldener Panzer: sucht sich die Fahrerin vor dir
//   kaefer          Krabbelkäfer: wird hinten abgesetzt, wer drüberfährt, schleudert
//   kickbombe       Kickbombe des Barons: wird nach vorn geworfen und explodiert
//   funken          Funkenblüte: drei hüpfende Funkenbälle
//   stern           Funkelstern: unverwundbar und schneller
//   riese           Riesentrank: riesengroß, plättet alle, die man berührt
//   zauberkugel     Zauberkugel der Zauberkröte: fliegt zur Spitze und explodiert dort

import * as THREE from 'three';
import { getModel } from '../lgw/course/models/index.js';
import { coinBodyGeo, coinFacesGeo, coinMaterials } from '../lgw/course/models/lib/kit.js';

export const ITEMS = {
  beere: { name: 'Turbo-Beere', model: 'powerup_wachstumsbeere', charges: 1 },
  beere3: { name: '3 Turbo-Beeren', model: 'powerup_wachstumsbeere', charges: 3, icon: 'beere', badge: '×3' },
  panzer: { name: 'Panzer', model: 'panzer', charges: 1 },
  goldpanzer: { name: 'Goldpanzer', model: 'panzer', opts: { gold: true }, charges: 1 },
  kaefer: { name: 'Krabbelkäfer', model: 'krabbelkaefer', opts: { color: 'red' }, charges: 1 },
  kickbombe: { name: 'Kickbombe', model: 'kickbombe', charges: 1 },
  funken: { name: 'Funkenblüte', model: 'powerup_funken', charges: 3 },
  stern: { name: 'Funkelstern', model: 'powerup_stern', charges: 1 },
  riese: { name: 'Riesentrank', model: 'powerup_riese', charges: 1 },
  zauberkugel: { name: 'Zauberkugel', model: 'zauberkugel', charges: 1 },
};
export const ITEM_IDS = Object.keys(ITEMS);

/** Gewichte nach Platzierung (f = 0 vorn … 1 hinten). */
function weights(f, race) {
  const bell = Math.exp(-((f - 0.5) ** 2) / 0.08);
  const w = {
    beere: 10 + 22 * f,
    beere3: Math.max(0, 30 * f - 9),
    panzer: 24 - 10 * f,
    goldpanzer: 4 + 18 * bell,
    kaefer: 30 * (1 - f) ** 2 + 2,
    kickbombe: 3 + 9 * bell,
    funken: 6 + 4 * bell,
    stern: Math.max(0, 18 * f - 7),
    riese: Math.max(0, 13 * f - 5),
    zauberkugel: f > 0.4 && !race.items.anyActive('zauberkugel') ? 4 : 0,
  };
  return w;
}

const tmpV = new THREE.Vector3();
const TAU = Math.PI * 2;

export class Items {
  constructor(race) {
    this.race = race;
    this.scene = race.scene;
    this.boxes = [];
    this.coins = [];
    this.pads = [];
    this.ramps = [];
    this.projectiles = [];
    this.rnd = race.rnd;
  }

  // ------------------------------------------------------------------ Aufbau
  build(def) {
    const track = this.race.track;
    // Kisten-Reihen
    for (const u of def.items ?? []) {
      const p = track.pointAt(u, 0);
      const n = p.hw > 8 ? 5 : 4;
      for (let k = 0; k < n; k++) {
        const lat = (k - (n - 1) / 2) * (p.hw * 1.5 / (n - 1));
        const q = track.pointAt(u, lat);
        const model = getModel('question_block');
        const holder = new THREE.Group();
        holder.add(model.root);
        model.root.position.set(0, -0.5, 0);
        holder.position.set(q.x, q.y + 1.05, q.z);
        holder.scale.setScalar(0.85);
        model.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
        this.scene.add(holder);
        this.boxes.push({ holder, model, active: true, respawn: 0, phase: this.rnd() * TAU, pos: new THREE.Vector3(q.x, q.y + 0.6, q.z), pop: 1 });
      }
    }
    // Bitcoins als Instanzen (zwei Zeichenaufrufe für alle)
    const coinList = [];
    for (const [u0, u1, lat0, lat1 = lat0, n = 6] of def.coins ?? []) {
      for (let k = 0; k < n; k++) {
        const f = n === 1 ? 0 : k / (n - 1);
        const p = track.pointAt(u0 + (u1 - u0) * f, (lat0 + (lat1 - lat0) * f));
        coinList.push(new THREE.Vector3(p.x, p.y + 0.75, p.z));
      }
    }
    if (coinList.length) {
      const mats = coinMaterials('coin');
      this.coinBody = new THREE.InstancedMesh(coinBodyGeo(32), mats.body, coinList.length);
      this.coinFace = new THREE.InstancedMesh(coinFacesGeo(28), mats.face, coinList.length);
      this.coinBody.castShadow = true;
      for (const m of [this.coinBody, this.coinFace]) { m.frustumCulled = false; this.scene.add(m); }
      this.coins = coinList.map((pos) => ({ pos, active: true, respawn: 0 }));
    }
    // Turbo-Felder (Pfeile)
    for (const [u, lat = 0, len = 3] of def.boosts ?? []) {
      const p = track.pointAt(u, lat * track.hw[track.wrap(Math.round(u * track.N))]);
      const m = getModel('boost_arrow', { length: len, width: 2.2 });
      m.root.position.set(p.x, p.y + 0.07, p.z);
      m.root.rotation.y = p.yaw;
      // Pfeilfeld beginnt am Ursprung und zeigt nach +X: mittig setzen
      m.root.translateX(-len / 2);
      this.scene.add(m.root);
      this.pads.push({ model: m, x: p.x, z: p.z, yaw: p.yaw, len, w: 2.2, i: p.i });
    }
    // Sprungschanzen (Trampolin-Rampen)
    for (const [u, lat = 0, w = 5] of def.ramps ?? []) {
      const hw = track.hw[track.wrap(Math.round(u * track.N))];
      const p = track.pointAt(u, lat * hw);
      const g = rampModel(w, this.race.theme);
      g.position.set(p.x, p.y + 0.05, p.z);
      g.rotation.y = p.yaw;
      this.scene.add(g);
      this.ramps.push({ g, x: p.x, z: p.z, yaw: p.yaw, w, len: 2.6 });
    }
  }

  anyActive(id) {
    return this.projectiles.some((p) => p.kind === id) || this.race.racers.some((r) => r.item?.id === id);
  }

  // ------------------------------------------------------------------ Glücksrad
  roll(racer) {
    const n = this.race.racers.length;
    const f = n > 1 ? (racer.place - 1) / (n - 1) : 0;
    const w = weights(f, this.race);
    let sum = 0;
    for (const k of ITEM_IDS) sum += w[k];
    let r = this.rnd() * sum;
    for (const k of ITEM_IDS) { r -= w[k]; if (r <= 0) return k; }
    return 'beere';
  }

  giveItem(racer) {
    if (racer.item || racer.roulette > 0) return;
    const id = this.roll(racer);
    racer.roulette = racer.isPlayer ? 1.4 : 0.9;
    racer.pendingItem = id;
    if (racer.isPlayer) this.race.audio.sfx('berry');
  }

  // ------------------------------------------------------------------ Benutzen
  use(racer) {
    if (!racer.item || racer.roulette > 0) return;
    const id = racer.item.id;
    const fx = Math.cos(racer.yaw), fz = -Math.sin(racer.yaw);
    const audio = this.race.audio, me = racer.isPlayer;
    switch (id) {
      case 'beere': case 'beere3':
        racer.boost(1.25, 0xff6a3a, 1.25);
        break;
      case 'stern':
        racer.starT = 7.5;
        if (me) { audio.sfx('star'); this.race.onStar?.(racer, true); }
        break;
      case 'riese':
        racer.giantT = 7;
        if (me) audio.sfx('powerup');
        break;
      case 'panzer': case 'goldpanzer':
        this.spawnShell(racer, id === 'goldpanzer');
        racer.throwT = 0.45;
        if (me) audio.sfx('fireball');
        break;
      case 'kaefer':
        this.spawnBug(racer);
        if (me) audio.sfx('step');
        break;
      case 'kickbombe':
        this.spawnBomb(racer, fx, fz);
        racer.throwT = 0.45;
        if (me) audio.sfx('fireball');
        break;
      case 'funken':
        this.spawnFireball(racer, fx, fz);
        racer.throwT = 0.35;
        if (me) audio.sfx('fireball');
        break;
      case 'zauberkugel':
        this.spawnMagic(racer);
        if (me) audio.sfx('swoop');
        break;
      default: break;
    }
    racer.item.charges--;
    if (racer.item.charges <= 0) racer.item = null;
  }

  addProjectile(p) {
    const m = getModel(p.modelName, p.opts ?? {});
    m.root.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    p.model = m;
    p.holder = new THREE.Group();
    p.holder.add(m.root);
    p.holder.scale.setScalar(p.scale ?? 1);
    this.scene.add(p.holder);
    p.age = 0;
    this.projectiles.push(p);
    return p;
  }

  spawnShell(racer, gold) {
    const fx = Math.cos(racer.yaw), fz = -Math.sin(racer.yaw);
    const sp = 40 + Math.max(0, racer.speed) * 0.3;
    const target = gold ? this.race.racerAhead(racer) : null;
    this.addProjectile({
      kind: gold ? 'goldpanzer' : 'panzer', modelName: 'panzer', opts: gold ? { gold: true } : {}, scale: 1.0,
      pos: new THREE.Vector3(racer.pos.x + fx * 1.6 * racer.giantScale, racer.pos.y, racer.pos.z + fz * 1.6 * racer.giantScale),
      vx: fx * sp, vz: fz * sp, speed: sp, owner: racer, target, life: gold ? 10 : 7, bounces: 0, i: racer.loc.i, radius: 0.6,
    });
  }

  spawnBug(racer) {
    const fx = Math.cos(racer.yaw), fz = -Math.sin(racer.yaw);
    const x = racer.pos.x - fx * 2.0 * racer.giantScale, z = racer.pos.z - fz * 2.0 * racer.giantScale;
    // höchstens 16 Käfer gleichzeitig auf der Strecke
    const bugs = this.projectiles.filter((p) => p.kind === 'kaefer');
    if (bugs.length >= 16) this.remove(bugs[0]);
    this.addProjectile({ kind: 'kaefer', modelName: 'krabbelkaefer', opts: { color: 'red' }, scale: 1.25, pos: new THREE.Vector3(x, this.race.track.heightAt(x, z), z), yaw: racer.yaw, owner: racer, life: 9999, radius: 0.55, i: racer.loc.i });
  }

  spawnBomb(racer, fx, fz) {
    const sp = Math.max(0, racer.speed) + 14;
    this.addProjectile({
      kind: 'kickbombe', modelName: 'kickbombe', scale: 1.2,
      pos: new THREE.Vector3(racer.pos.x + fx * 1.5, racer.pos.y + 1.2, racer.pos.z + fz * 1.5),
      vx: fx * sp, vz: fz * sp, vy: 6, owner: racer, life: 6, fuse: 1.5, landed: false, radius: 0.6, i: racer.loc.i, yaw: racer.yaw,
    });
  }

  spawnFireball(racer, fx, fz) {
    const sp = Math.max(0, racer.speed) + 22;
    this.addProjectile({
      kind: 'funkenball', modelName: 'funkenball', scale: 1.4,
      pos: new THREE.Vector3(racer.pos.x + fx * 1.6, racer.pos.y + 0.4, racer.pos.z + fz * 1.6),
      vx: fx * sp, vz: fz * sp, vy: 0, owner: racer, life: 2.6, radius: 0.55, i: racer.loc.i, yaw: racer.yaw,
    });
  }

  spawnMagic(racer) {
    this.addProjectile({
      kind: 'zauberkugel', modelName: 'zauberkugel', scale: 2.2,
      pos: new THREE.Vector3(racer.pos.x, racer.pos.y + 2, racer.pos.z), owner: racer, life: 25, radius: 0.9,
      i: racer.loc.i, s: racer.loc.s, lapOffset: 0, phase: 'fly',
    });
  }

  remove(p) {
    p.dead = true;
    p.model.dispose();
    p.holder.removeFromParent();
  }

  explode(pos, radius, by) {
    this.race.effects.explosion(pos, radius);
    for (const r of this.race.racers) {
      const d = Math.hypot(r.pos.x - pos.x, r.pos.z - pos.z);
      if (d < radius + r.radius && Math.abs(r.pos.y - pos.y) < 4) r.hit('tumble', by);
    }
    const pl = this.race.player;
    const dd = pl ? Math.hypot(pl.pos.x - pos.x, pl.pos.z - pos.z) : 99;
    if (dd < 40) { this.race.audio.sfx('slam'); this.race.shake = Math.max(this.race.shake ?? 0, 1 - dd / 40); }
  }

  // ------------------------------------------------------------------ Simulation
  update(dt, t) {
    const race = this.race, track = race.track;
    // Kisten
    for (const b of this.boxes) {
      if (!b.active) {
        b.respawn -= dt;
        if (b.respawn <= 0) { b.active = true; b.pop = 0; b.holder.visible = true; b.model.update(0, 'idle'); }
        continue;
      }
      b.pop = Math.min(1, b.pop + dt * 3);
      const s = 0.85 * (b.pop < 1 ? Math.sin(b.pop * Math.PI * 0.75) / Math.sin(Math.PI * 0.75) : 1);
      b.holder.scale.setScalar(Math.max(0.01, s));
      b.holder.rotation.y = t * 1.2 + b.phase;
      b.holder.rotation.x = 0.25 * Math.sin(t * 1.3 + b.phase);
      b.holder.position.y = b.pos.y + 0.45 + 0.18 * Math.sin(t * 2.2 + b.phase);
      b.model.update(dt, 'idle');
      for (const r of race.racers) {
        const dx = r.pos.x - b.pos.x, dz = r.pos.z - b.pos.z;
        if (dx * dx + dz * dz < (1.2 + r.radius * 0.6) ** 2 && Math.abs(r.pos.y - b.pos.y) < 2.5) {
          b.active = false; b.respawn = 2.4; b.holder.visible = false;
          race.effects.sparkle(b.holder.position, 0xfff2a0, 16, 4);
          if (r.isPlayer) race.audio.sfx('blockhit');
          this.giveItem(r);
          break;
        }
      }
    }
    // Glücksrad der Fahrer
    for (const r of race.racers) {
      if (r.roulette > 0) {
        r.roulette -= dt;
        if (r.roulette <= 0) {
          const id = r.pendingItem;
          r.item = { id, charges: ITEMS[id].charges };
          r.pendingItem = null;
          if (r.isPlayer) race.audio.sfx('powerup');
          if (r.ai) r.ai.itemWait = 0.8 + r.ai.rnd() * 2.5;
        }
      }
    }
    // Bitcoins
    if (this.coins.length) {
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = new THREE.Vector3();
      this.coins.forEach((c, k) => {
        if (!c.active) { c.respawn -= dt; if (c.respawn <= 0) c.active = true; }
        if (c.active) {
          for (const r of race.racers) {
            const dx = r.pos.x - c.pos.x, dz = r.pos.z - c.pos.z;
            if (dx * dx + dz * dz < (0.9 + r.radius * 0.5) ** 2 && Math.abs(r.pos.y + 0.6 - c.pos.y) < 1.6) {
              c.active = false; c.respawn = 14;
              if (r.coins < 10) r.coins++;
              if (r.isPlayer) race.audio.sfx('coin');
              r.boost(0.18, 0xffc21a, 1.0);
              race.effects.sparkle(c.pos, 0xffc040, 8, 2);
              break;
            }
          }
        }
        e.set(0, t * 3 + k * 0.4, 0);
        q.setFromEuler(e);
        sc.setScalar(c.active ? 1.25 : 0.0001);
        tmpV.copy(c.pos); tmpV.y += 0.08 * Math.sin(t * 3 + k);
        m.compose(tmpV, q, sc);
        this.coinBody.setMatrixAt(k, m);
        this.coinFace.setMatrixAt(k, m);
      });
      this.coinBody.instanceMatrix.needsUpdate = true;
      this.coinFace.instanceMatrix.needsUpdate = true;
    }
    // Turbo-Felder und Schanzen
    for (const r of race.racers) {
      for (const p of this.pads) {
        if (inRect(r.pos.x, r.pos.z, p.x, p.z, p.yaw, p.len / 2 + 0.3, p.w / 2 + 0.3) && !r.air) r.boost(1.1, 0xffc21a, 1.25);
      }
      for (const p of this.ramps) {
        if (inRect(r.pos.x, r.pos.z, p.x, p.z, p.yaw, p.len / 2, p.w / 2) && r.speed > 5) r.launch(8.5 + Math.min(3, r.speed * 0.08));
      }
    }
    for (const p of this.pads) p.model.update(dt, 'idle');
    // Geschosse
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.age += dt;
      if (p.age > p.life) { this.remove(p); continue; }
      this.step(p, dt, t);
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
  }

  step(p, dt, t) {
    const race = this.race, track = race.track;
    const loc = track.locate(p.pos.x, p.pos.z, p.i, p.loc ?? (p.loc = {}));
    p.i = loc.i;
    const ground = track.heightAt(p.pos.x, p.pos.z);
    switch (p.kind) {
      case 'panzer': case 'goldpanzer': {
        if (p.kind === 'goldpanzer' && p.target && !p.target.finished) {
          // Zielsuche: der Strecke folgen, nahe am Ziel direkt darauf zu
          const tg = p.target;
          const dx = tg.pos.x - p.pos.x, dz = tg.pos.z - p.pos.z, dist = Math.hypot(dx, dz);
          let ax, az;
          if (dist < 22) { ax = dx / dist; az = dz / dist; }
          else {
            const q = track.pointAt(track.wrap(loc.i + 10) / track.N, tg.loc.lat * 0.6);
            ax = q.x - p.pos.x; az = q.z - p.pos.z; const l = Math.hypot(ax, az) || 1; ax /= l; az /= l;
          }
          const vl = Math.hypot(p.vx, p.vz) || 1;
          const k = 1 - Math.exp(-6 * dt);
          p.vx = (p.vx / vl + (ax - p.vx / vl) * k) * p.speed;
          p.vz = (p.vz / vl + (az - p.vz / vl) * k) * p.speed;
        }
        p.pos.x += p.vx * dt; p.pos.z += p.vz * dt; p.pos.y = ground;
        // Bande: abprallen
        track.locate(p.pos.x, p.pos.z, loc.i, loc);
        const wall = track.wallAt(loc.i) - 0.4;
        if (Math.abs(loc.lat) > wall) {
          const sgn = Math.sign(loc.lat), nx = sgn * track.tz[loc.i], nz = -sgn * track.tx[loc.i];
          const vn = p.vx * nx + p.vz * nz;
          if (vn < 0) { p.vx -= 2 * vn * nx; p.vz -= 2 * vn * nz; }
          p.pos.x += nx * (Math.abs(loc.lat) - wall); p.pos.z += nz * (Math.abs(loc.lat) - wall);
          p.bounces++;
          race.effects.sparks(p.pos, nx, nz, 0xffffff, 5);
          if (p.bounces > 5) { this.remove(p); return; }
        }
        p.model.update(dt, { anim: 'spin', speed: 12 });
        break;
      }
      case 'kaefer':
        p.pos.y = ground;
        p.model.update(dt, { anim: 'idle' });
        p.holder.rotation.y = p.yaw + Math.sin(t * 2 + p.age) * 0.4;
        break;
      case 'kickbombe': {
        if (!p.landed) {
          p.vy -= 22 * dt;
          p.pos.x += p.vx * dt; p.pos.z += p.vz * dt; p.pos.y += p.vy * dt;
          if (p.pos.y <= ground) { p.pos.y = ground; p.landed = true; p.vy = 0; }
        } else {
          p.vx *= Math.exp(-3 * dt); p.vz *= Math.exp(-3 * dt);
          p.pos.x += p.vx * dt; p.pos.z += p.vz * dt; p.pos.y = ground;
          p.fuse -= dt;
          if (p.fuse <= 0) { this.explode(p.pos, 5.5, p.owner); this.remove(p); return; }
        }
        // in der Bande bleiben
        track.locate(p.pos.x, p.pos.z, loc.i, loc);
        const wall = track.wallAt(loc.i) - 0.5;
        if (Math.abs(loc.lat) > wall) { p.vx *= -0.4; p.vz *= -0.4; const sgn = Math.sign(loc.lat); p.pos.x += sgn * track.tz[loc.i] * 0.3; p.pos.z -= sgn * track.tx[loc.i] * 0.3; }
        p.model.update(dt, p.landed ? { anim: 'lit', fuse: 1 - p.fuse / 1.5 } : { anim: 'kicked', speed: 6 });
        break;
      }
      case 'funkenball': {
        p.pos.x += p.vx * dt; p.pos.z += p.vz * dt;
        p.pos.y = ground + 0.3 + Math.abs(Math.sin(p.age * 9)) * 1.0;
        track.locate(p.pos.x, p.pos.z, loc.i, loc);
        if (Math.abs(loc.lat) > track.wallAt(loc.i) - 0.3) { race.effects.sparks(p.pos, 0, 0, 0xff8a2a, 8); this.remove(p); return; }
        race.effects.trail(p.pos.x, p.pos.y, p.pos.z, 0xff7a2a, 0.6);
        p.model.update(dt, 'idle');
        break;
      }
      case 'zauberkugel': {
        const leader = race.leader();
        if (p.phase === 'fly') {
          // entlang der Strecke vorwärts in 7 m Höhe, bis die Spitze erreicht ist
          const step = Math.round((60 * dt) / track.ds);
          p.i = track.wrap(p.i + step);
          const q = track.pointAt(p.i / track.N, 0);
          p.pos.set(q.x, q.y + 7 + Math.sin(p.age * 6) * 0.4, q.z);
          if (leader) {
            const ahead = track.wrap(leader.loc.i - p.i);
            if ((leader === p.owner && p.age > 0.6) || (leader !== p.owner && ahead < step + 10)) { p.phase = 'dive'; p.target = leader; p.diveT = 0; }
          }
        } else {
          p.diveT += dt;
          const tg = p.target;
          const k = Math.min(1, p.diveT / 0.9);
          p.pos.x += (tg.pos.x - p.pos.x) * Math.min(1, dt * 8);
          p.pos.z += (tg.pos.z - p.pos.z) * Math.min(1, dt * 8);
          p.pos.y = tg.pos.y + 7 * (1 - k) + 0.6 + (k < 1 ? Math.sin(p.diveT * 30) * 0.3 * (1 - k) : 0);
          if (k >= 1) { this.explode(p.pos, 5, p.owner); this.remove(p); return; }
        }
        race.effects.trail(p.pos.x, p.pos.y, p.pos.z, 0x3ae0d0, 0.9);
        p.model.update(dt, 'idle');
        break;
      }
      default: break;
    }
    p.holder.position.copy(p.pos);
    if (p.kind === 'panzer' || p.kind === 'goldpanzer') p.holder.rotation.y = 0;
    else if (p.kind === 'kickbombe' || p.kind === 'funkenball') p.holder.rotation.y = Math.atan2(-p.vz, p.vx);

    // Treffer
    for (const r of race.racers) {
      if (p.dead) break;
      if (r === p.owner && p.age < 0.35) continue;
      if (p.kind === 'zauberkugel') continue;
      const dx = r.pos.x - p.pos.x, dz = r.pos.z - p.pos.z;
      const rr = r.radius + p.radius;
      if (dx * dx + dz * dz < rr * rr && Math.abs(r.pos.y + 0.4 - p.pos.y) < 1.6 + (r.giantScale - 1)) {
        if (p.kind === 'kickbombe') { this.explode(p.pos, 5.5, p.owner); this.remove(p); break; }
        r.hit('spin', p.owner);
        race.effects.sparkle(p.pos, 0xffffff, 10, 3);
        this.remove(p);
      }
    }
    // Geschosse gegeneinander (Panzer räumt Käfer weg)
    if (!p.dead && (p.kind === 'panzer' || p.kind === 'goldpanzer' || p.kind === 'funkenball')) {
      for (const o of this.projectiles) {
        if (o === p || o.dead || o.kind === 'zauberkugel') continue;
        const dx = o.pos.x - p.pos.x, dz = o.pos.z - p.pos.z;
        if (dx * dx + dz * dz < (o.radius + p.radius) ** 2) {
          if (o.kind === 'kickbombe') this.explode(o.pos, 5.5, o.owner);
          else race.effects.sparkle(o.pos, 0xffffff, 10, 3);
          this.remove(o); this.remove(p);
          break;
        }
      }
    }
  }

  dispose() {
    for (const b of this.boxes) { b.model.dispose(); b.holder.removeFromParent(); }
    for (const p of this.projectiles) if (!p.dead) this.remove(p);
    for (const p of this.pads) p.model.dispose();
    for (const r of this.ramps) r.g.removeFromParent();
    this.coinBody?.removeFromParent(); this.coinFace?.removeFromParent();
    this.coinBody?.dispose(); this.coinFace?.dispose();
  }
}

/** Liegt (x,z) im gedrehten Rechteck um (cx,cz) mit Halbachsen hx (entlang yaw) und hz (quer)? */
function inRect(x, z, cx, cz, yaw, hx, hz) {
  const dx = x - cx, dz = z - cz;
  const fx = Math.cos(yaw), fz = -Math.sin(yaw);
  const a = dx * fx + dz * fz, b = -dx * fz + dz * fx;
  return Math.abs(a) < hx && Math.abs(b) < hz;
}

/** Sprungschanze: Keil mit Pfeilstreifen (Spielzeug-Look). */
function rampModel(w, theme) {
  const g = new THREE.Group();
  const len = 2.6, h = 0.55;
  const shape = new THREE.Shape();
  shape.moveTo(-len / 2, 0); shape.lineTo(len / 2, h); shape.lineTo(len / 2, 0); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  geo.translate(0, 0, -w / 2);
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffc21a, roughness: 0.45 }));
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  // Streifen
  for (let k = -2; k <= 2; k++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.03, 0.25), new THREE.MeshStandardMaterial({ color: 0xe8392d, roughness: 0.5 }));
    s.position.set(0.1, h * 0.6 + 0.02, k * (w / 5));
    s.rotation.z = Math.atan2(h, len);
    g.add(s);
  }
  return g;
}
