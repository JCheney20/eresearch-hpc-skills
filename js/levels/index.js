import l00 from "./level00.js";
import l01 from "./level01.js";
import l02 from "./level02.js";
import l03 from "./level03.js";
import l04 from "./level04.js";
import l05 from "./level05.js";
import l06 from "./level06.js";
import l07 from "./level07.js";
import l08 from "./level08.js";
import l09 from "./level09.js";
import l10 from "./level10.js";
import l11 from "./level11.js";
import l12 from "./level12.js";
import l13 from "./level13.js";
import l14 from "./level14.js";
import l15 from "./level15.js";
import l16 from "./level16.js";
import l17 from "./level17.js";
import l18 from "./level18.js";
import l19 from "./level19.js";
import l20 from "./level20.js";
import l21 from "./level21.js";
import l22 from "./level22.js";
import l23 from "./level23.js";
import l24 from "./level24.js";
import { GATE } from "./hashes.js";

export const LEVELS = [l00, l01, l02, l03, l04, l05, l06, l07, l08, l09,
  l10, l11, l12, l13, l14, l15, l16, l17, l18, l19,
  l20, l21, l22, l23, l24];

// Levels where the password is produced by a hook (closure), so it won't
// appear in the serialized fs/canned content.
const HOOK_LEVELS = new Set([12, 13, 20, 21]);
// Levels whose password is not present verbatim: 8 stores it base64-encoded,
// 22/23 are computed answers (HPL math) that appear nowhere in the content.
const ANSWER_LEVELS = new Set([8, 22, 23]);

async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

// Authoring self-check: run validateLevels() in the browser console (or via
// tools/validate.mjs). Asserts, for every level x variant: build() works, the
// yielded password hashes into the next level's gate, and the password is
// discoverable in the level's content.
export async function validateLevels() {
  const problems = [];
  for (const level of LEVELS) {
    if (!Array.isArray(level.variants) || level.variants.length < 10) {
      problems.push(`level ${level.n}: fewer than 10 variants`);
    }
    for (let i = 0; i < level.variants.length; i++) {
      const v = level.variants[i];
      let built;
      try {
        built = level.build(v);
      } catch (e) {
        problems.push(`level ${level.n} variant ${i}: build() threw: ${e.message}`);
        continue;
      }
      if (!built.goal || !built.fs) {
        problems.push(`level ${level.n} variant ${i}: build() missing goal/fs`);
      }
      if (!v.pass) {
        problems.push(`level ${level.n} variant ${i}: no pass`);
        continue;
      }
      const gate = GATE[level.n + 1];
      if (!gate) {
        problems.push(`level ${level.n} variant ${i}: no GATE[${level.n + 1}] entry`);
      } else if (!gate.includes(await sha256(v.pass))) {
        problems.push(`level ${level.n} variant ${i}: pass does not hash into GATE[${level.n + 1}]`);
      }
      if (!HOOK_LEVELS.has(level.n) && !ANSWER_LEVELS.has(level.n)) {
        const blob = JSON.stringify(built.fs) + JSON.stringify(built.canned || {})
          + JSON.stringify(built.env || {}) + JSON.stringify(built.histSeed || [])
          + built.goal;
        if (!blob.includes(v.pass)) {
          problems.push(`level ${level.n} variant ${i}: pass not found in level content`);
        }
      }
    }
  }
  if (problems.length === 0) {
    console.log(`validateLevels: OK (${LEVELS.length} levels, all variants consistent)`);
    return true;
  }
  for (const p of problems) console.error("validateLevels:", p);
  return false;
}
