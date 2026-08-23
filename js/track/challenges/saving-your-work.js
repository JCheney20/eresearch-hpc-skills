// Challenge 12 — git add and git commit. Saving in two deliberate steps.

import { home } from "./_cluster.js";
import { STATUS_DIRTY, CONFIG, RUN14_NOTES, LOG_ONELINE } from "./_repo.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  ``,
  ` M run.conf
?? notes-run14.md`,
];

export default {
  num: 12,
  slug: "saving-your-work",
  title: "Saving on purpose, in two steps",
  commands: ["git add", "git commit"],
  teaches: ["git add", "git commit", "staging", "commit message"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>You changed the tolerance and wrote some notes about the run.
    <code>git status</code> can see both. Neither is saved.</p>
    <p>Saving happens in two steps on purpose. <code>git add</code> chooses what
    goes into the next commit — you can save one file and leave another for
    later, which is how a history stays readable. <code>git commit -m</code>
    then writes the chosen files down together with a message.</p>
    <p>The message matters more than beginners expect. In six months it is the
    only thing anyone will read, and "fixed stuff" will not help them.</p>`,

  example: [
    { command: "git add run.conf", output: OUT[0], note: "Silence again: it worked. git add chooses, it does not save." },
    { command: "git status -s", output: OUT[1], note: "The short form. The first column is what is staged, the second what is not — so run.conf is chosen and the notes are not." },
  ],

  task: `<p>Save both changes together in one commit, with a message that says
    what it was for.</p>
    <p>Stage both files, then commit them with
    <code>git commit -m "Tighten tolerance and add run 14 notes"</code>.
    <code>git commit</code> answers with the branch, the new commit's short name,
    your message, and a summary line counting what changed.</p>
    <p><strong>How many files does that summary line say were changed?</strong>
    Type the number on its own.</p>`,

  answerLabel: "Files changed in the commit",
  answer: "2",
  alternatives: ["two", "2 files"],
  failures: [
    { match: /^1$/, message: "One is what you get if only <code>run.conf</code> was staged. Both files have to be added before the commit." },
    { match: /^4$/, message: "Four is the number of insertions the summary reports, not the number of files." },
    { match: /^5$/, message: "Five is the number of commits in the history after yours lands. The summary line counts files." },
  ],
  hints: [
    "<code>git add</code> takes a filename, and it takes more than one. A single dot means everything that has changed here.",
    "<code>git add .</code> stages both, then <code>git commit -m \"...\"</code> saves them.",
    "Run <code>git add .</code> then <code>git commit -m \"Tighten tolerance and add run 14 notes\"</code>, and read the last line it prints.",
  ],
  solution: ["git add .", 'git commit -m "Tighten tolerance and add run 14 notes"'],

  build() {
    return {
      fs: home({}, {
        "run.conf": { c: CONFIG },
        "notes-run14.md": { c: RUN14_NOTES },
      }),
      canned: {
        "git status": STATUS_DIRTY,
        "git status -s": " M run.conf\n?? notes-run14.md",
        "git add run.conf": "",
        "git add notes-run14.md": "",
        "git add .": "",
        "git add -A": "",
        "git log --oneline": LOG_ONELINE,
        // Any message is accepted; the summary is what the challenge asks about.
        'git commit -m *':
          "[main a3e7c02] Tighten tolerance and add run 14 notes\n" +
          " 2 files changed, 4 insertions(+), 1 deletion(-)\n" +
          " create mode 100644 notes-run14.md",
        "git commit": {
          out: "",
          err: "This trainer has no editor to write a message in. Put the message on the command line with -m, e.g. git commit -m \"what this change was for\"",
          code: 1,
        },
        "git *": {
          out: "",
          err: "This trainer knows git status, git log, git add, git commit, git clone and git pull.",
          code: 1,
        },
      },
    };
  },
};
