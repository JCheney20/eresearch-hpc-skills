// Challenge 1 — pwd and ls. The two questions everybody asks first.

import { home, PROJECT } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `/home/student`,
  `notes.txt  project/`,
];

export default {
  num: 1,
  slug: "where-am-i",
  title: "Where am I, and what is here",
  commands: ["pwd", "ls"],
  teaches: ["pwd", "ls", "directory", "home"],
  variants: [{ i: 0 }],

  scenario: `<p>The prompt tells you a lot and it does not tell you everything.
    You know who you are and which machine you are on. You do not yet know where
    on that machine you are standing, or what is in front of you.</p>
    <p>Two commands answer that. <code>pwd</code> — "print working directory" —
    prints the full address of the directory you are in. <code>ls</code> — "list"
    — prints what is in it.</p>
    <p>You start in your <strong>home directory</strong>, the one place on a
    shared machine that belongs to you. Everyone with an account has one, and
    yours is where your work lives.</p>`,

  example: [
    { command: "pwd", output: OUT[0], note: "The full address, starting at / — the top of the whole filesystem." },
    { command: "ls", output: OUT[1], note: "Names only, in alphabetical order, across the line. A name with a slash after it is a directory — you can go into that one." },
  ],

  task: `<p>Have a look at what is in your home directory, then go one level in:
    <code>ls project</code> lists what is inside <code>project</code> without
    moving you there.</p>
    <p><strong>How many things does <code>ls project</code> list?</strong> Count
    everything it prints, files and directories alike, and type the number on its
    own.</p>`,

  answerLabel: "Number of entries in project",
  answer: String(Object.keys(PROJECT).length),   // derived, so it cannot drift
  answerCheck: "countWords",
  alternatives: ["four", "4 things", "4 files"],
  failures: [
    { match: /^2$/, message: "Two is what <code>ls</code> shows in your home directory, not in <code>project</code>. Give <code>ls</code> the directory you want: <code>ls project</code>." },
    { match: /^3$/, message: "Close. One of the four is a directory rather than a file — <code>ls</code> lists it just the same, and it counts." },
    { match: /^(413|412)$/, message: "That is the number of lines in <code>run.log</code>, which is one of the four things in <code>project</code>." },
  ],
  hints: [
    "<code>ls</code> on its own lists the directory you are standing in. Give it a name and it lists that one instead.",
    "Run <code>ls project</code>. Everything it prints counts, whether it is a file or a directory.",
    "<code>ls project</code> prints <code>data/  README  run.log  submit.sh</code>. The slash on <code>data/</code> marks it as a directory, and it counts. That is four.",
  ],
  solution: ["ls project"],

  build() {
    return { fs: home() };
  },
};
