// Shared helpers for level content generation. Content must be deterministic
// per variant, so everything derives from a small seeded PRNG.

export function prng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ALPH = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

// A decoy password-looking string (never a real one).
export function fakePw(rng, len = 16) {
  let s = "";
  for (let i = 0; i < len; i++) s += ALPH[Math.floor(rng() * ALPH.length)];
  return s;
}

export function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const WORDS = [
  "cluster", "compute", "storage", "network", "kernel", "process", "thread",
  "socket", "packet", "buffer", "cache", "memory", "matrix", "vector",
  "tensor", "lattice", "photon", "quantum", "fabric", "switch", "router",
  "daemon", "module", "driver", "signal", "mutex", "queue", "stack", "heap",
  "pointer", "integer", "double", "float", "record", "column", "kernelspace",
  "userspace", "pipeline", "register", "opcode", "runtime", "compiler",
  "linker", "loader", "segment", "cluster2", "phonon", "exciton",
];
