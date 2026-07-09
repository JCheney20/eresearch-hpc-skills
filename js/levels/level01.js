import { PW } from "./gen-data.js";
import { prng, fakePw } from "./util.js";

export default {
  n: 1,
  title: "A file called -",
  commands: ["ls", "cat", "man"],
  reading: [
    { label: "Google: \"dashed filename\"", url: "https://www.google.com/search?q=dashed+filename" },
    { label: "Docs: paths and special filenames", url: "#/docs/linux" },
  ],
  variants: PW[1].map((pass, i) => ({ pass, i })),
  build(v) {
    const rng = prng(100 + v.i);
    return {
      goal: `<p>The password for the next level is stored in a file called <code>-</code>
        (a single dash) in your home directory.</p>
        <p>Most commands treat <code>-</code> as "read from standard input" rather than a
        filename. You need a way to tell <code>cat</code> that you really mean a
        <em>file</em> named <code>-</code>. Hint: paths can be relative to the current
        directory.</p>`,
      fs: {
        "/home/student": {
          "-": { c: `${v.pass}\n` },
          "notes.txt": { c: `Decoy file. Nothing here.\n${fakePw(rng)} is not a password you need.\n` },
        },
      },
    };
  },
};
