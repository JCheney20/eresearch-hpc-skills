import { PW } from "./gen-data.js";
import { prng, fakePw } from "./util.js";

export default {
  n: 5,
  title: "find it",
  commands: ["find", "ls", "file", "cat"],
  reading: [{ label: "find(1) — search a directory tree", url: "https://man7.org/linux/man-pages/man1/find.1.html" }],
  variants: PW[5].map((pass, i) => ({ pass, i, size: 1009 + i * 8 })),
  build(v) {
    const rng = prng(500 + v.i);
    const tree = {};
    const dirs = ["maybehere00", "maybehere01", "maybehere02", "maybehere03",
      "maybehere04", "maybehere05", "maybehere06", "maybehere07"];
    const targetDir = dirs[Math.floor(rng() * dirs.length)];
    for (const d of dirs) {
      const sub = {};
      const nfiles = 3 + Math.floor(rng() * 4);
      for (let k = 0; k < nfiles; k++) {
        // decoy sizes never equal the target size
        let sz = 100 + Math.floor(rng() * 2000);
        if (sz === v.size) sz += 1;
        sub[`.file${k}`] = { c: `${fakePw(rng)}\n`, size: sz };
        sub[`spaces file${k}`] = { c: `${fakePw(rng)}\n`, size: sz + 3 };
      }
      if (d === targetDir) sub[".secret-holder"] = { c: `${v.pass}\n`, size: v.size };
      tree["/home/student/inhere/" + d] = sub;
    }
    return {
      goal: `<p>Somewhere under <code>inhere/</code> — which contains ${dirs.length}
        directories full of decoys — is exactly one file with all of these properties:</p>
        <ul><li>human-readable</li><li>exactly <strong>${v.size} bytes</strong> in size</li></ul>
        <p>Opening every file by hand would take all day. <code>find</code> can filter by
        size: <code>find inhere -type f -size ${v.size}c</code> (the <code>c</code> suffix
        means bytes). This is how you locate files on a real cluster too — nobody browses
        <code>/home</code> by hand.</p>`,
      fs: tree,
    };
  },
};
