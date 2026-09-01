// Contrast check over css/tokens.css: node tools/contrast.mjs
//
// The palette is written in OKLCH, which is easy to reason about and
// impossible to eyeball for contrast. This parses the tokens out of the
// stylesheet, converts OKLCH (and the hex terminal tokens) to sRGB, and
// asserts the WCAG 2.1 ratio for every pair the design actually puts
// together, at the level that pair needs:
//
//     AAA (7:1)   body ink on its own ground
//     AA  (4.5:1) any other text
//     UI  (3:1)   borders and marks that carry meaning without words
//
// Run it after changing any lightness in css/tokens.css.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOKENS = path.join(HERE, "..", "css", "tokens.css");

let failed = false;

function oklchToRgb(L, C, hDeg) {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
  return lin.map(x => {
    const v = Math.min(1, Math.max(0, x));
    return v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055;
  });
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
}

function luminance(rgb) {
  const [r, g, b] = rgb.map(c => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function hexOf(rgb) {
  return "#" + rgb.map(c => Math.round(c * 255).toString(16).padStart(2, "0").toUpperCase()).join("");
}

const css = fs.readFileSync(TOKENS, "utf8");
const T = {};
for (const m of css.matchAll(/--([a-z0-9-]+):\s*oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/g)) {
  T[m[1]] = oklchToRgb(Number(m[2]) / 100, Number(m[3]), Number(m[4]));
}
for (const m of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\b/g)) {
  T[m[1]] = hexToRgb(m[2]);
}

function check(fg, bg, need, note = "") {
  if (!T[fg] || !T[bg]) {
    console.log(`FAIL - ${fg} on ${bg}: token missing from css/tokens.css`);
    failed = true;
    return;
  }
  const r = ratio(T[fg], T[bg]);
  const ok = r >= need;
  if (!ok) failed = true;
  console.log(
    `${ok ? "ok  " : "FAIL"} - ${fg} on ${bg}: ${r.toFixed(2)}:1 (needs ${need}) ` +
    `${hexOf(T[fg])} on ${hexOf(T[bg])}${note ? `  -- ${note}` : ""}`
  );
}

console.log(`contrast.mjs -- ${Object.keys(T).length} colour tokens read from css/tokens.css\n`);

console.log("-- the reading pane, on paper --");
check("ink", "ground", 7.0, "body text");
check("navy", "ground", 7.0, "every heading");
check("ink-muted", "ground", 4.5, "captions and notes");
check("gold-text", "ground", 4.5, "the eyebrow");

console.log("\n-- the reading pane, on the tinted surfaces --");
check("ink", "surface", 7.0);
check("navy", "surface", 4.5);
check("ink-muted", "surface", 4.5);
check("gold-text", "surface", 4.5);
check("ink", "gold-wash", 7.0, "an open hint");
check("gold-text", "gold-wash", 4.5, "a hint's label");
check("navy", "gold-wash", 4.5);
check("ink", "surface-2", 7.0, "inline code");

console.log("\n-- the navy topbar --");
check("on-navy", "navy", 7.0);
check("on-navy-dim", "navy", 4.5, "the crumb");
check("gold", "navy", 4.5, "the topic name");

console.log("\n-- verdicts --");
check("ok", "ok-wash", 4.5);
check("warn", "warn-wash", 4.5);

console.log("\n-- the terminal --");
check("term-ink", "term-ground", 7.0);
check("term-dim", "term-ground", 4.5);
check("term-accent", "term-ground", 4.5, "the prompt and the cursor");
check("term-err", "term-ground", 4.5);

console.log("\n-- non-text UI, 3:1 --");
check("gold-ui", "ground", 3.0, "the focus ring");
check("ink-muted", "ground", 3.0, "a dashed locked border, a graph wire");
// UWC's gold is 2.6:1 on paper and cannot be darkened without ceasing to be
// UWC's gold. It is therefore confined to decoration — a head rule, the fill
// inside a pip — and anything that carries meaning is outlined in --gold-ui,
// which clears 3:1. This pair is recorded rather than enforced.
check("gold", "ground", 2.5, "DECORATION ONLY: meaning is carried by --gold-ui");

console.log("\ncontrast.mjs: " + (failed ? "FAILED" : "all pairs pass"));
process.exit(failed ? 1 : 0);
