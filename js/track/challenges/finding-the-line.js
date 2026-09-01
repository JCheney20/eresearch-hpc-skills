// Challenge 6 — grep. Four hundred lines, one that matters.

import { home } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `2026-08-14 16:02:41 slurmd[1187]: job=48812 step=epilog node=cn02 state=completed exit=0`,
  `103`,
];

export default {
  num: 6,
  slug: "finding-the-line",
  title: "Four hundred lines, one that matters",
  commands: ["grep", "wc -l"],
  teaches: ["grep", "matching", "counting matches"],
  variants: [{ i: 0 }],

  scenario: `<p><code>head</code> and <code>tail</code> gave you the ends of a
    file. Most of the time what you want is in the middle, and you do not know
    where.</p>
    <p><code>grep</code> prints only the lines that contain something. You give
    it the thing to look for and the file to look in, and it prints every line
    that matches and nothing else. On a 413-line log that is the difference
    between reading and finding.</p>
    <p>Two flags earn their keep immediately. <code>-i</code> ignores upper and
    lower case, because logs are inconsistent about it. <code>-c</code> counts
    the matching lines instead of printing them.</p>`,

  example: [
    { command: "grep epilog run.log", output: OUT[0], note: "One line out of 413. Everything that does not match is simply not printed." },
    { command: "grep -c cn01 run.log", output: OUT[1], note: "-c gives the count rather than the lines. Useful when the answer is 'how many', not 'which'." },
  ],

  task: `<p>The run moved through six steps over and over, on four nodes. One of
    those steps is <code>launch</code>, which is where the actual work starts on
    a node.</p>
    <p><strong>How many lines in <code>run.log</code> record a
    <code>launch</code> step?</strong> Type the number on its own.</p>`,

  answerLabel: "Lines recording a launch step",
  answer: "69",
  alternatives: ["69 lines"],
  failures: [
    { match: /^413$/, message: "413 is every line in the file. <code>grep</code> counts only the ones that match." },
    { match: /^1$/, message: "One is what <code>grep epilog</code> finds. <code>launch</code> happens many times." },
    { match: /^6$/, message: "Six is the number of different step names in the log, not the number of times <code>launch</code> appears." },
  ],
  hints: [
    "You have both halves already: <code>grep</code> finds the lines, and one flag makes it count them instead of printing them.",
    "<code>grep -c</code> prints how many lines matched. It takes the same two arguments as before: what to look for, then where.",
    "Run <code>grep -c launch run.log</code>.",
  ],
  solution: ["grep -c launch run.log"],

  cwd: "/home/student/project",
  build() {
    return { fs: home() };
  },
};
