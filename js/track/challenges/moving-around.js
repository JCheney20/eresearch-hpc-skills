// Challenge 2 — cd. Standing somewhere else, and getting back.

import { home } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  ``,
  ``,
];

export default {
  num: 2,
  slug: "moving-around",
  title: "Standing somewhere else",
  commands: ["cd"],
  teaches: ["cd", "relative path", "parent directory"],
  variants: [{ i: 0 }],

  scenario: `<p>Listing a directory from outside it works, and it gets tiring:
    every command has to carry the directory's name. <code>cd</code> — "change
    directory" — moves you into it, and from then on you can talk about what is
    inside by name alone.</p>
    <p>Three forms cover almost everything. <code>cd project</code> goes in.
    <code>cd ..</code> goes back up one level — two dots always mean "the
    directory above this one". <code>cd</code> on its own returns you home from
    wherever you have got to.</p>
    <p>The prompt changes when you move, which is how you always know where you
    are without asking.</p>`,

  example: [
    { command: "cd project", output: OUT[0], note: "Silence. On the command line, nothing to say means it worked — watch the prompt instead." },
    { command: "cd project/data", output: OUT[1], note: "One command, two levels: a path is directory names joined by slashes." },
  ],

  task: `<p>Go into <code>project/data</code> and look at what is there. It holds
    the inputs the last run used — two seismic shot files and one small table.</p>
    <p><strong>What is the name of the file that is not a shot file?</strong>
    Type the name exactly as <code>ls</code> prints it.</p>`,

  answerLabel: "Name of the odd file out",
  answer: "stations.csv",
  alternatives: ["stations", "data/stations.csv", "project/data/stations.csv"],
  failures: [
    { match: /^shot00[12](\.segy)?$/, message: "That is one of the two shot files. The one you want is the third entry, and it is not a <code>.segy</code>." },
    { match: /^data$/, message: "<code>data</code> is the directory you are looking in, not a file inside it." },
    { match: /^stations\.cvs$/, message: "Nearly — the extension is <code>csv</code>, not <code>cvs</code>. Spelling counts on a command line." },
  ],
  hints: [
    "You can get there in one move or two: <code>cd project/data</code>, or <code>cd project</code> and then <code>cd data</code>.",
    "Once you are there, <code>ls</code> with no arguments lists where you are standing.",
    "Run <code>cd project/data</code> then <code>ls</code>. Two names end in <code>.segy</code>; the third is the answer.",
  ],
  solution: ["cd project/data", "ls"],

  build() {
    return { fs: home() };
  },
};
