// Everything, in one command: node tools/check.mjs
//
//   contrast.mjs        every colour pair the design puts together
//   track-validate.mjs  the content: solvable, and honest about its examples
//   render-smoke.mjs    the screens: they build, in every state that matters
//
// Exits non-zero if any of them do.

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const suites = ["contrast.mjs", "track-validate.mjs", "render-smoke.mjs"];

let failed = 0;
for (const suite of suites) {
  const r = spawnSync(process.execPath, [path.join(HERE, suite)], { encoding: "utf8" });
  const tail = (r.stdout || "").trim().split("\n").pop();
  const bad = r.status !== 0;
  if (bad) {
    failed++;
    process.stdout.write(r.stdout || "");
    process.stderr.write(r.stderr || "");
  }
  console.log(`${bad ? "FAIL" : "ok  "} - ${suite.padEnd(20)} ${tail}`);
}

console.log(failed ? `\n${failed} of ${suites.length} suites failed` : `\nall ${suites.length} suites passed`);
process.exit(failed ? 1 : 0);
