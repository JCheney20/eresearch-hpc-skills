// Challenge 3 — ls -l and ll. The same command, asked a harder question.

import { home, RUN_LOG_BYTES } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `-rw-r--r-- 1 student student     34 Jul  9 09:00 notes.txt
drwxr-xr-x 1 student student   4096 Jul  9 09:00 project`,
  `drwxr-xr-x 1 student student   4096 Jul  9 09:00 data
-rw-r--r-- 1 student student     77 Jul  9 09:00 README
-rw-r--r-- 1 student student  34146 Jul  9 09:00 run.log
-rwxr-xr-x 1 student student    131 Jul  9 09:00 submit.sh`,
];

export default {
  num: 3,
  slug: "same-command-more-questions",
  title: "The same command, asked more",
  commands: ["ls -l", "ll", "ls -a"],
  teaches: ["flag", "long listing", "hidden files", "permissions"],
  variants: [{ i: 0 }],

  scenario: `<p><code>ls</code> gave you names. Names are not always enough: you
    will want to know how big a file is, who owns it, and whether it is a
    directory or a file.</p>
    <p>A <strong>flag</strong> is a short option you add to a command to ask it
    for something different. <code>ls -l</code> — a lower-case L, for "long" —
    prints one entry per line with its permissions, owner, size in bytes and the
    date it last changed. <code>ll</code> is the same thing; almost every Linux
    account ships with it as a shorthand.</p>
    <p><code>ls -a</code> adds a different thing: entries whose names begin with
    a dot. Those are hidden by convention, not by security — <code>ls</code>
    simply skips them unless you ask.</p>`,

  example: [
    { command: "ls -l", output: OUT[0], note: "The first character says what it is: d for a directory, - for an ordinary file." },
    { command: "ll project", output: OUT[1], note: "Same output, shorter to type. The fifth column is the size in bytes." },
  ],

  task: `<p>Look at <code>project</code> in long form. One of the four entries is
    a directory and the rest are files; one of the files is marked executable,
    which is what the <code>x</code> characters in the permissions mean.</p>
    <p><strong>How many bytes is <code>run.log</code>?</strong> Type the number
    on its own, exactly as the listing prints it.</p>`,

  answerLabel: "Size of run.log in bytes",
  answer: String(RUN_LOG_BYTES),   // derived from the log itself
  alternatives: [`${RUN_LOG_BYTES} bytes`],
  failures: [
    { match: /^4096$/, message: "4096 is the size of <code>data</code>, which is a directory. Directories are nearly always 4096 — that number tells you nothing about what is inside." },
    { match: /^413$/, message: "413 is the number of <em>lines</em> in the file. The listing reports its size in bytes, which is a much larger number." },
    { match: /^(77|131)$/, message: "That is the size of <code>README</code> or <code>submit.sh</code>. Find the row whose name is <code>run.log</code>." },
  ],
  hints: [
    "<code>ls</code> on its own will not tell you a size. Add the flag that asks for the long form.",
    "<code>ls -l project</code> or <code>ll project</code>. Each row is one entry, and the size is the fifth column.",
    "Run <code>ll project</code> and read across the <code>run.log</code> row until you reach the number just before the date.",
  ],
  solution: ["ll project"],

  build() {
    return { fs: home() };
  },
};
