// Challenge 17 — watch. The last of the cluster route: stop retyping a
// command to see whether anything has happened yet.

import { home } from "./_cluster.js";
import { SINFO, SQUEUE, SQUEUE_ME_RUNNING } from "./_slurm.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `Every 2s: squeue --me

             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)
             49150   compute inversio student  R       0:37      4 cn33-cn36

(the real watch redraws this until you press Ctrl-C; the trainer runs it once)`,
  `Every 10s: sinfo

PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST
compute*     up 3-00:00:00      6  down* cn13,cn20,cn31,cn38,cn44,cn47
compute*     up 3-00:00:00     29  alloc cn01-cn12,cn14-cn19,cn21-cn26,cn28-cn30,cn32
compute*     up 3-00:00:00     13   idle cn33-cn37,cn39-cn43,cn45-cn46
bigmem       up 1-00:00:00      2  alloc cn49-cn50
gpu          up 1-00:00:00      1   idle cn51

(the real watch redraws this until you press Ctrl-C; the trainer runs it once)`,
];

const JOB_OUT = [
  "srun: job 49150 queued and waiting for resources",
  "srun: job 49150 has been allocated resources",
  "inversion: reading data/ (2 shots, 412 stations)",
  "inversion: iteration 1  misfit=0.482  rms=1.191",
  "inversion: iteration 2  misfit=0.311  rms=0.977",
].join("\n") + "\n";

export default {
  num: 17,
  slug: "watching-it-change",
  title: "Watching without retyping",
  commands: ["watch"],
  teaches: ["watch", "polling", "-n interval"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>Your job is in the queue. The only way to know when it starts is
    to look, and the way beginners look is to press the up arrow and Enter, over
    and over, for twenty minutes.</p>
    <p><code>watch</code> does that for you. It runs a command every couple of
    seconds and redraws the screen with the latest answer, with a header saying
    what it is running and how often. <code>-n</code> changes the interval:
    <code>watch -n 10 squeue --me</code> looks every ten seconds, which is
    plenty for a queue.</p>
    <p>On a real terminal it keeps going until you press Ctrl-C. This trainer
    runs it once and says so, because a browser tab that never gives the prompt
    back is a trap rather than a lesson.</p>`,

  example: [
    { command: "watch squeue --me", output: OUT[0], note: "The header names the command and the interval; below it is that command's output, refreshed." },
    { command: "watch -n 10 sinfo", output: OUT[1], note: "-n sets the seconds. Ten is polite on a shared machine; two is the default and is more often than anything really changes." },
  ],

  task: `<p>Your job has started. Watch your own queue and see where the
    scheduler put it — the NODELIST column stops being a reason in brackets and
    becomes real machine names the moment a job begins running.</p>
    <p><strong>Which node does your job start on?</strong> That is the first
    name in its node list. Type it on its own.</p>`,

  answerLabel: "First node your job is on",
  answer: "cn33",
  alternatives: ["cn33-cn36"],
  failures: [
    { match: /^cn36$/, message: "cn36 is the <em>last</em> node in the range. The list is written first-to-last: the one you want is on the left of the dash." },
    { match: /^49150$/, message: "That is your job ID. The question asks which machine it landed on, which is the last column." },
    { match: /^\(?(priority|resources)\)?$/, message: "That is what the column says while a job is still pending. Yours is running now — the column holds node names instead." },
    { match: /^cn0?1$/, message: "cn01 belongs to somebody else's job in the shared queue. Look at your own with <code>squeue --me</code>." },
  ],
  hints: [
    "<code>watch</code> takes a whole command after it, and the command you want is the one that shows your own jobs.",
    "Run <code>watch squeue --me</code>. Read the NODELIST column of the row that comes back.",
    "Run <code>watch squeue --me</code>. The job is on <code>cn33-cn36</code>, so it starts on the first of those.",
  ],
  solution: ["watch squeue --me"],

  build() {
    return {
      fs: home({}, { "slurm-49150.out": { c: JOB_OUT } }),
      canned: {
        "squeue --me": SQUEUE_ME_RUNNING,
        "squeue -u student": SQUEUE_ME_RUNNING,
        "squeue": SQUEUE,
        "sinfo": SINFO,
      },
    };
  },
};
