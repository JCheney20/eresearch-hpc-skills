import { PW } from "./gen-data.js";
import { prng } from "./util.js";

export default {
  n: 4,
  title: "Human-readable",
  commands: ["ls", "file", "cat"],
  reading: [{ label: "file(1) — determine file type", url: "https://man7.org/linux/man-pages/man1/file.1.html" }],
  variants: PW[4].map((pass, i) => ({ pass, i })),
  build(v) {
    const rng = prng(400 + v.i);
    const textIdx = Math.floor(rng() * 10);
    const files = {};
    for (let k = 0; k < 10; k++) {
      const name = `file0${k}`;
      files[name] = k === textIdx
        ? { c: `${v.pass}\n` }
        : { c: "\x00\x01binary\x02junk", binary: true, size: 33 + Math.floor(rng() * 900) };
    }
    return {
      goal: `<p>The password is in the only <em>human-readable</em> file in the
        <code>inhere/</code> directory. The other nine are binary data —
        <code>cat</code>ing them just sprays garbage at your terminal.</p>
        <p>The <code>file</code> command tells you what a file contains before you open
        it. It accepts several files at once, and the shell's <code>*</code> glob expands
        to every name in a directory: <code>file inhere/*</code>.</p>`,
      fs: { "/home/student/inhere": files },
    };
  },
};
