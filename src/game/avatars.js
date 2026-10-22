// Phaser-freie Avatar-Zuordnung (Ersatz für src/three/avatars/index.js der Lotti-&-Greta-Welt):
// nur die Figuren, die im Kart sitzen.
import { HeroAvatar, PflaumeAvatar } from '../lgw/three/avatars/hero.js';

const BY_KEY = { lotti: HeroAvatar, greta: HeroAvatar, pflaume: PflaumeAvatar };

export function createAvatarFor(view, obj) {
  const C = BY_KEY[obj.texture?.key];
  return C ? new C(view, obj) : null;
}
