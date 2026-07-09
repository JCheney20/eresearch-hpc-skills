import { PW } from "./gen-data.js";

const NAMES = [
  "spaces in this filename", "notes from the admin", "cluster build log",
  "read me please", "final report draft", "my benchmark results",
  "meeting notes june", "do not delete me", "hpc team roster",
  "job output copy", "backup of the readme", "temp file two",
];

export default {
  n: 2,
  title: "Spaces in this filename",
  commands: ["ls", "cat"],
  reading: [{ label: "Cheatsheet: quoting and tab completion", url: "#/cheatsheet" }],
  variants: PW[2].map((pass, i) => ({ pass, name: NAMES[i] })),
  build(v) {
    return {
      goal: `<p>The password is stored in a file called <code>${v.name}</code> —
        spaces included — in your home directory.</p>
        <p>Spaces normally separate arguments, so <code>cat ${v.name}</code> looks like
        ${v.name.split(" ").length} different files to the shell. Quote the name
        (<code>"..."</code>), escape each space with <code>\\</code>, or type the first
        few letters and press <strong>Tab</strong> — the shell completes and escapes it
        for you. Tab completion will save you all game long; learn it now.</p>`,
      fs: {
        "/home/student": {
          [v.name]: { c: `${v.pass}\n` },
        },
      },
    };
  },
};
