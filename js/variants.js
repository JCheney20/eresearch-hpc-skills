// Seeded variant selection: one playthrough seed in localStorage decides which
// variant of every level you get. "New playthrough" rerolls the seed.

const SEED_KEY = "uwc_hpc_seed";

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getSeed() {
  let s = localStorage.getItem(SEED_KEY);
  if (s === null) {
    s = String((Math.random() * 0xffffffff) >>> 0);
    localStorage.setItem(SEED_KEY, s);
  }
  return Number(s);
}

export function rerollSeed() {
  localStorage.setItem(SEED_KEY, String((Math.random() * 0xffffffff) >>> 0));
}

// Deterministic variant index for level n given the playthrough seed.
export function variantIndex(n, count) {
  const rng = mulberry32(getSeed() + n * 2654435761);
  return Math.floor(rng() * count) % count;
}
