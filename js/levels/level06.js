import { PW } from "./gen-data.js";
import { prng, fakePw, pick, WORDS } from "./util.js";

const NEEDLES = ["millionth", "exaflop", "teraflop", "gigaflop", "petabyte",
  "infiniband", "scheduler", "allocation", "checkpoint", "partition",
  "interconnect", "benchmark"];

export default {
  n: 6,
  title: "grep the haystack",
  commands: ["grep", "cat", "wc"],
  reading: [
    { label: "grep(1) — print lines matching a pattern", url: "https://man7.org/linux/man-pages/man1/grep.1.html" },
    { label: "Cheatsheet: searching text", url: "#/cheatsheet" },
  ],
  variants: PW[6].map((pass, i) => ({ pass, i, needle: NEEDLES[i] })),
  build(v) {
    const rng = prng(600 + v.i);
    const lines = [];
    for (let k = 0; k < 999; k++) {
      let w = pick(rng, WORDS);
      if (w === v.needle) w = "haystack";
      lines.push(`${w} ${fakePw(rng)}`);
    }
    lines.splice(Math.floor(rng() * lines.length), 0, `${v.needle} ${v.pass}`);
    return {
      goal: `<p><code>data.txt</code> in your home directory holds 1000 lines of
        word–password pairs. The password you want is on the one line containing the word
        <code>${v.needle}</code>.</p>
        <p>Check the size of the problem with <code>wc -l data.txt</code>, then let
        <code>grep</code> do the reading: it prints only the lines that match a pattern.
        You will use <code>grep</code> constantly on real log files — this is the single
        most valuable command in this whole game.</p>`,
      fs: {
        "/home/student": { "data.txt": { c: lines.join("\n") + "\n" } },
      },
    };
  },
};
