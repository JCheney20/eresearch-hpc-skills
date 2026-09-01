// Fill in the worked examples' output: node tools/fill-examples.mjs [slug...]
//
// A worked example promises a beginner "type this, see that". Getting that
// wrong is the worst bug this trainer can have, and it is not a bug a human
// can reliably avoid by typing output by hand — 400-line logs, column
// alignment, trailing spaces.
//
// So the outputs are not typed by hand. A challenge file declares its
// examples' output as entries in one `const OUT = [...]` block, this tool
// runs each example command through the real shell against the real world,
// and rewrites that block with what actually came back. Nothing else in the
// file is touched: the rewrite is bounded to the block between the marker
// comment and its closing `];`.
//
// tools/track-validate.mjs then checks the same thing independently, so a
// hand-edit that drifts is still caught.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CHALLENGES } from "../js/track/challenges/index.js";
import { makeSession, silentTerm } from "../js/track/session.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, "..", "js", "track", "challenges");
const MARKER = "const OUT = [";

const wanted = process.argv.slice(2);
const slugs = wanted.length ? wanted : Object.keys(CHALLENGES);

function backtickSafe(s) {
  return s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
}

let changed = 0, skipped = 0;

for (const slug of slugs) {
  const challenge = CHALLENGES[slug];
  if (!challenge || challenge.kind === "reading" || !challenge.example) { skipped++; continue; }

  const file = path.join(DIR, `${slug}.js`);
  const src = fs.readFileSync(file, "utf8");
  const start = src.indexOf(MARKER);
  if (start === -1) {
    console.log(`skip - ${slug}: no "${MARKER}" block to fill`);
    skipped++;
    continue;
  }
  const end = src.indexOf("\n];", start);
  if (end === -1) { console.log(`skip - ${slug}: unterminated OUT block`); skipped++; continue; }

  const outputs = challenge.example.map((ex, i) => {
    // A fresh world per example: an example is what a learner sees when they
    // type that command, not what they see after the previous one.
    const { shell } = makeSession(challenge, silentTerm());
    const r = shell.run(ex.command);
    const text = ((r.out || "") + (r.err || "")).replace(/\n$/, "");
    if (!text) console.log(`warn - ${slug} example[${i}] "${ex.command}" printed nothing`);
    return text;
  });

  const block = MARKER + "\n" +
    outputs.map(o => "  `" + backtickSafe(o) + "`,").join("\n") +
    "\n];";
  const next = src.slice(0, start) + block + src.slice(end + 3);

  if (next !== src) {
    fs.writeFileSync(file, next);
    console.log(`ok   - ${slug}: filled ${outputs.length} example output(s)`);
    changed++;
  } else {
    console.log(`ok   - ${slug}: already current`);
  }
}

console.log(`\n${changed} file(s) rewritten, ${skipped} skipped`);
