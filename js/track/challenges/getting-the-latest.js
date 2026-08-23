// Challenge 13 — git clone and git pull. Someone else's work, on your machine.

import { home } from "./_cluster.js";
import { CONFIG } from "./_repo.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `Cloning into 'analysis'...
remote: Enumerating objects: 118, done.
remote: Counting objects: 100% (118/118), done.
remote: Compressing objects: 100% (74/74), done.
Receiving objects: 100% (118/118), 41.20 KiB | 2.06 MiB/s, done.
Resolving deltas: 100% (39/39), done.`,
  `remote: Enumerating objects: 11, done.
From git.uwc.ac.za:hpc/analysis
   9f2c1ab..c4d8e12  main       -> origin/main`,
];

export default {
  num: 13,
  slug: "getting-the-latest",
  title: "Somebody else's work, on your machine",
  commands: ["git clone", "git pull"],
  teaches: ["git clone", "git pull", "remote", "fast-forward"],
  variants: [{ i: 0 }],

  cwd: "/home/student",

  scenario: `<p>So far the history has been yours. The point of a repository is
    that it is not: Thandi has been committing to the same project from her own
    machine, and the version you are holding is now behind hers.</p>
    <p><code>git clone</code> is how a project arrives on a machine for the
    first time — you give it an address and it makes a directory with the whole
    history in it. You do that once.</p>
    <p><code>git pull</code> is the one you run constantly. It fetches whatever
    has been committed since you last looked and applies it to your copy. When
    your copy has no changes of its own, git can simply move you forward onto
    hers, which it calls a <strong>fast-forward</strong>.</p>`,

  example: [
    { command: "git clone git@git.uwc.ac.za:hpc/analysis.git", output: OUT[0], note: "Once per machine. It creates the directory, downloads every commit, and leaves you a working copy." },
    { command: "git pull --dry-run", output: OUT[1], note: "A rehearsal: it says what would arrive without changing anything. Not a habit you need, but a good way to look before you leap." },
  ],

  task: `<p>Bring your copy of the project up to date with the shared one.
    <code>git pull</code> prints a summary of what arrived, ending in a line
    counting the files that changed and the insertions and deletions.</p>
    <p><strong>How many files changed?</strong> Type the number on its own.</p>`,

  answerLabel: "Files changed by the pull",
  answer: "3",
  alternatives: ["three", "3 files"],
  failures: [
    { match: /^2$/, message: "Two is the number of new commits that arrived. The summary counts files separately, and one commit can touch several." },
    { match: /^(37|21)$/, message: "That is an insertion or deletion count. The file count is the first number on that line." },
    { match: /^4$/, message: "Four is the length of the history you had before pulling. Read the summary line the pull itself printed." },
  ],
  hints: [
    "You are already inside a repository that has a shared copy behind it. One command asks for whatever is new.",
    "Run <code>git pull</code> inside <code>project</code>. It prints what arrived and then a summary line.",
    "Run <code>cd project</code> then <code>git pull</code>, and read the line that begins <code>3 files changed</code>.",
  ],
  solution: ["cd project", "git pull"],

  build() {
    return {
      fs: home({}, { "run.conf": { c: CONFIG } }),
      canned: {
        "git clone git@git.uwc.ac.za:hpc/analysis.git":
          "Cloning into 'analysis'...\n" +
          "remote: Enumerating objects: 118, done.\n" +
          "remote: Counting objects: 100% (118/118), done.\n" +
          "remote: Compressing objects: 100% (74/74), done.\n" +
          "Receiving objects: 100% (118/118), 41.20 KiB | 2.06 MiB/s, done.\n" +
          "Resolving deltas: 100% (39/39), done.",
        "git pull --dry-run":
          "remote: Enumerating objects: 11, done.\n" +
          "From git.uwc.ac.za:hpc/analysis\n" +
          "   9f2c1ab..c4d8e12  main       -> origin/main",
        "git pull":
          "remote: Enumerating objects: 11, done.\n" +
          "remote: Counting objects: 100% (11/11), done.\n" +
          "Unpacking objects: 100% (7/7), 1.84 KiB | 940.00 bytes/s, done.\n" +
          "From git.uwc.ac.za:hpc/analysis\n" +
          "   9f2c1ab..c4d8e12  main       -> origin/main\n" +
          "Updating 9f2c1ab..c4d8e12\n" +
          "Fast-forward\n" +
          " README            |  6 +++++-\n" +
          " data/stations.csv | 31 +++++++++++++++++++++++++++++++\n" +
          " run.conf          | 21 ++++++++++-----------\n" +
          " 3 files changed, 37 insertions(+), 21 deletions(-)",
        "git log --oneline":
          "c4d8e12 Add the eastern stations\n" +
          "b0a6f45 Document the tolerance change\n" +
          "9f2c1ab Tighten the tolerance for run 14",
        "git *": {
          out: "",
          err: "This trainer knows git status, git log, git add, git commit, git clone and git pull.",
          code: 1,
        },
      },
    };
  },
};
