import { PW } from "./gen-data.js";

const HIDDEN = [".hidden", ".secret", ".passwd", ".config-old", ".stash",
  ".dotfile", ".key", ".cache-x", ".tucked-away", ".quiet", ".unseen", ".hpcrc"];

export default {
  n: 3,
  title: "Hidden in plain sight",
  commands: ["ls", "cat", "cd"],
  reading: [{ label: "ls(1) — the -a flag", url: "https://man7.org/linux/man-pages/man1/ls.1.html" }],
  variants: PW[3].map((pass, i) => ({ pass, name: HIDDEN[i] })),
  build(v) {
    return {
      goal: `<p>The password is stored in a <em>hidden</em> file in the
        <code>inhere/</code> directory.</p>
        <p>On Linux, any filename that starts with a dot is hidden from a plain
        <code>ls</code>. There is a flag that shows <strong>a</strong>ll files.
        Change into the directory with <code>cd inhere</code> first, or point
        <code>ls</code> at it directly.</p>`,
      fs: {
        "/home/student/inhere": {
          [v.name]: { c: `${v.pass}\n` },
          "nothing-to-see": { c: "Just a regular, visible, empty-ish file.\n" },
        },
      },
    };
  },
};
