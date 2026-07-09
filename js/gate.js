// Password gating: sha256(input) must match one of the level's accepted
// hashes (one per variant of the previous level). Progress in localStorage.

import { GATE } from "./levels/hashes.js";

const KEY = "uwc_hpc_progress";

export async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export function getProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY)) || {};
    return { unlocked: p.unlocked || [0], passwords: p.passwords || {}, solved: p.solved || [] };
  } catch {
    return { unlocked: [0], passwords: {}, solved: [] };
  }
}

function save(p) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function isUnlocked(n) {
  return n === 0 || getProgress().unlocked.includes(n);
}

export function isSolved(n) {
  return getProgress().solved.includes(n);
}

export async function tryUnlock(n, password) {
  const input = password.trim();
  if (!input) return false;
  const hashes = GATE[n] || [];
  const h = await sha256(input);
  if (!hashes.includes(h)) return false;
  const p = getProgress();
  if (!p.unlocked.includes(n)) p.unlocked.push(n);
  p.passwords[n] = input;
  if (!p.solved.includes(n - 1)) p.solved.push(n - 1);
  save(p);
  return true;
}

// Check an answer typed into level n's "password for the next level" box.
export async function checkAnswer(n, password) {
  return tryUnlock(n + 1, password);
}

export function storedPassword(n) {
  return getProgress().passwords[n] || null;
}

export function resetProgress() {
  localStorage.removeItem(KEY);
}
