// Challenge 4 — man and tldr. The habit that makes every later challenge
// solvable without this trainer.

import { home } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `tail — print the last lines of a file.

  tail run.log          the last 10 lines
  tail -n 1 run.log     just the last line`,
  `ls - list directory contents.

usage: ls [-a] [-l] [-n] [FILE]

  -a  include hidden entries (names starting with .)
  -l  long format: permissions, owner, size, name
  -n  like -l but numeric user/group IDs

example: ls -la ~/inhere`,
];

export default {
  num: 4,
  slug: "ask-the-machine",
  title: "Asking the machine instead of asking a person",
  commands: ["man", "tldr"],
  teaches: ["man", "tldr", "reading a flag"],
  variants: [{ i: 0 }],

  scenario: `<p>You have met one flag. There are thousands, and nobody memorises
    them. What people actually do is look them up, on the machine, in the second
    it takes to ask.</p>
    <p><code>man</code> — "manual" — prints the reference page for a command:
    its flags, its forms, precisely worded. <code>tldr</code> prints the other
    thing: three or four examples of what people actually type. Reach for
    <code>tldr</code> when you want to get moving and <code>man</code> when you
    need to be sure.</p>
    <p>The pages in this trainer are short. On a real machine a
    <code>man</code> page runs to hundreds of lines and opens in a pager you
    scroll with the arrow keys and leave by pressing <code>q</code> — worth
    knowing before it happens to you.</p>
    <p>This is the single most useful habit in this trainer. Every challenge
    after this one can be solved by asking the machine what a command does.</p>`,

  example: [
    { command: "tldr tail", output: OUT[0], note: "Examples first. This is usually all you need." },
    { command: "man ls", output: OUT[1], note: "The reference: every flag this trainer understands for ls, and what each one does. The real page is longer and reads the same way." },
  ],

  task: `<p><code>ls -a</code> showed you hidden entries in the last challenge.
    Look up <code>ls</code> and find the flag that prints the long listing but
    uses <strong>numeric</strong> user and group IDs instead of names.</p>
    <p><strong>Which flag is it?</strong> Type it with its dash, as the manual
    writes it.</p>`,

  answerLabel: "The flag for numeric IDs",
  answer: "-n",
  alternatives: ["n", "ls -n"],
  failures: [
    { match: /^-?l$/, message: "<code>-l</code> is the long listing, but it prints owner <em>names</em>. The one you want prints the same layout with numbers instead." },
    { match: /^-?a$/, message: "<code>-a</code> is the one that shows hidden entries. Read further down the page." },
    { match: /^-?h$/, message: "<code>-h</code> is human-readable sizes on many commands, but it is not the flag this page describes for numeric IDs." },
  ],
  hints: [
    "Ask the machine about the command you are asking about: <code>man ls</code>.",
    "The page lists its flags one per line, each with a sentence saying what it does. Look for the one that mentions numeric IDs.",
    "Run <code>man ls</code>. Under the flags, <code>-n</code> is described as \"like -l but numeric user/group IDs\".",
  ],
  solution: ["man ls"],

  build() {
    return { fs: home() };
  },
};
