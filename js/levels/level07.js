import { PW } from "./gen-data.js";
import { prng, fakePw, shuffle } from "./util.js";

export default {
  n: 7,
  title: "The only line that appears once",
  commands: ["sort", "uniq", "grep", "wc"],
  reading: [
    { label: "uniq(1) — it only sees ADJACENT duplicates", url: "https://man7.org/linux/man-pages/man1/uniq.1.html" },
    { label: "Cheatsheet: pipes", url: "#/cheatsheet" },
  ],
  variants: PW[7].map((pass, i) => ({ pass, i })),
  build(v) {
    const rng = prng(700 + v.i);
    let lines = [];
    for (let k = 0; k < 40; k++) {
      const dup = fakePw(rng);
      const times = 2 + Math.floor(rng() * 3);
      for (let t = 0; t < times; t++) lines.push(dup);
    }
    lines.push(v.pass);
    lines = shuffle(rng, lines);
    return {
      goal: `<p><code>data.txt</code> contains ${lines.length} candidate passwords. Every
        one of them appears <em>several times</em> — except the real password, which occurs
        exactly once.</p>
        <p>This is a job for a <strong>pipe</strong>: the <code>|</code> character feeds one
        command's output into the next. <code>uniq -u</code> keeps only non-repeated lines,
        but it can only spot duplicates that are <em>next to each other</em> — so
        <code>sort</code> the data first:</p>
        <pre>sort data.txt | uniq -u</pre>`,
      fs: {
        "/home/student": { "data.txt": { c: lines.join("\n") + "\n" } },
      },
    };
  },
};
