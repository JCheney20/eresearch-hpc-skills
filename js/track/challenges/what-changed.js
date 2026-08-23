// Challenge 11 — git status and git log. Reading a history before touching it.

import { home } from "./_cluster.js";
import { LOG, LOG_ONELINE, STATUS_DIRTY, CONFIG, RUN14_NOTES } from "./_repo.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   run.conf

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	notes-run14.md

no changes added to commit (use "git add" and/or "git commit -a")`,
  `9f2c1ab Tighten the tolerance for run 14
7b1d0e3 Add the 2026 station list
4a8c2e6 Submit script for four nodes
1c5e9a3 First working inversion`,
];

export default {
  num: 11,
  slug: "what-changed",
  title: "What changed, and who changed it",
  commands: ["git status", "git log"],
  teaches: ["git status", "git log", "commit", "working tree"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>This project is shared. Thandi edits it, you edit it, and
    neither of you wants to discover on a Monday that the other quietly changed
    the tolerance. A <strong>repository</strong> is what keeps that honest: every
    saved version of the project, in order, with a name and a date on it.</p>
    <p>Two commands read it, and you should type both before you type anything
    else. <code>git status</code> answers "what have I changed since the last
    save" — it lists files you have edited and files git has never seen.
    <code>git log</code> answers "what has happened here" — one entry per saved
    version, newest first.</p>
    <p>A saved version is called a <strong>commit</strong>. Each one has a long
    hexadecimal name, an author, a date, and a one-line message saying what it
    was for.</p>`,

  example: [
    { command: "git status", output: OUT[0], note: "Two kinds of change: a file git already knows about and has seen you edit, and a file it has never been told about at all." },
    { command: "git log --oneline", output: OUT[1], note: "The same history in one line each — the short name and the message. Easier to scan than the full form." },
  ],

  task: `<p>Read the history of this project. There are four commits and two
    people.</p>
    <p><strong>How many of the four commits did Thandi make?</strong> Type the
    number on its own.</p>`,

  answerLabel: "Commits by Thandi",
  answer: "2",
  alternatives: ["two", "2 commits"],
  failures: [
    { match: /^4$/, message: "Four is the whole history, by both people. Read the <code>Author:</code> line on each commit." },
    { match: /^1$/, message: "One is how many files <code>git status</code> shows as modified, not how many commits Thandi made." },
    { match: /^3$/, message: "Three is the number of iterations in <code>run.conf</code>. The question is about the history, not the settings." },
  ],
  hints: [
    "<code>git log</code> prints every commit. The one-line form leaves the author out, so use the full form for this.",
    "Run <code>git log</code> on its own. Each entry has an <code>Author:</code> line under its commit name.",
    "Run <code>git log</code> and count the entries whose author is Thandi Mokoena. There are two.",
  ],
  solution: ["git log"],

  build() {
    return {
      fs: home({}, {
        "run.conf": { c: CONFIG },
        "notes-run14.md": { c: RUN14_NOTES },
      }),
      canned: {
        "git status": STATUS_DIRTY,
        "git status -s": " M run.conf\n?? notes-run14.md",
        "git log": LOG,
        "git log --oneline": LOG_ONELINE,
        "git log -n 1": LOG.split("\n\n").slice(0, 2).join("\n\n"),
        "git diff": "diff --git a/run.conf b/run.conf\nindex 3f8a1c2..9d4e7b1 100644\n--- a/run.conf\n+++ b/run.conf\n@@ -1,4 +1,4 @@\n [run]\n name = inversion\n-iterations = 2\n+iterations = 3\n tolerance = 1e-6",
        "git *": {
          out: "",
          err: "This trainer knows git status, git log, git add, git commit, git clone and git pull.",
          code: 1,
        },
      },
    };
  },
};
