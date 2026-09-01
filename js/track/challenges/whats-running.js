// Challenge 15 — sinfo and squeue. Reading the machine before asking it for
// anything.

import { home } from "./_cluster.js";
import { SINFO, SQUEUE } from "./_slurm.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST
compute*     up 3-00:00:00      6  down* cn13,cn20,cn31,cn38,cn44,cn47
compute*     up 3-00:00:00     29  alloc cn01-cn12,cn14-cn19,cn21-cn26,cn28-cn30,cn32
compute*     up 3-00:00:00     13   idle cn33-cn37,cn39-cn43,cn45-cn46
bigmem       up 1-00:00:00      2  alloc cn49-cn50
gpu          up 1-00:00:00      1   idle cn51`,
  `             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)
             49118   compute  meshgen   sipho  R    2:14:07      8 cn01-cn08
             49120   compute      hpl  thandi  R    1:48:31     12 cn09-cn12,cn14-cn19,cn21-cn22
             49131   bigmem   assemble    nadia  R      41:02      2 cn49-cn50
             49134   compute  inverse   sipho  R      22:55      6 cn23-cn26,cn28-cn29
             49137   compute   segyqc  thandi  R      11:40      1 cn30
             49141   compute  meshgen   nadia PD       0:00     16 (Resources)
             49142   compute      hpl   sipho PD       0:00     24 (Priority)`,
];

export default {
  num: 15,
  slug: "whats-running",
  title: "Who else is using this",
  commands: ["sinfo", "squeue"],
  teaches: ["sinfo", "squeue", "partition", "queue", "job state"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>A cluster is shared, and you cannot simply run something the way
    you would on your laptop. You ask a <strong>scheduler</strong> — here,
    Slurm — for some machines, and it gives them to you when they are free. Two
    commands tell you what you are asking into.</p>
    <p><code>sinfo</code> describes the machines: which
    <strong>partitions</strong> exist (a partition is a named group of nodes),
    how long a job may run in each, and how many nodes are busy, idle or
    broken.</p>
    <p><code>squeue</code> describes the work: one row per job, with who owns
    it, how long it has been going, and its state. <code>R</code> means running
    and <code>PD</code> means pending — waiting, with the reason in the last
    column.</p>`,

  example: [
    { command: "sinfo", output: OUT[0], note: "The star on compute marks the default partition — the one you get if you do not ask for another." },
    { command: "squeue", output: OUT[1], note: "Everyone's jobs, not just yours. Two at the bottom are pending: one waiting for machines, one waiting its turn." },
  ],

  task: `<p>Before you submit anything, find out how much of the cluster is
    actually free right now. <code>sinfo</code> groups the compute partition's
    nodes by state.</p>
    <p><strong>How many compute nodes are idle?</strong> Type the number on its
    own.</p>`,

  answerLabel: "Idle nodes in the compute partition",
  answer: "13",
  alternatives: ["13 nodes"],
  failures: [
    { match: /^29$/, message: "29 is the <code>alloc</code> row — nodes already handed out to somebody's job. Idle is the row below it." },
    { match: /^6$/, message: "Six is the <code>down*</code> row: nodes that are broken or unreachable. They are not available either, but they are not idle." },
    { match: /^48$/, message: "48 is every compute node the cluster has. Only some of them are free at this moment." },
    { match: /^14$/, message: "14 is the idle count plus the one idle GPU node. The question is about the compute partition." },
  ],
  hints: [
    "One of the two commands describes machines rather than jobs. That is the one to run.",
    "Run <code>sinfo</code>. Each row is a state — <code>down*</code>, <code>alloc</code>, <code>idle</code> — and the NODES column counts them.",
    "Run <code>sinfo</code> and read the NODES column on the <code>compute</code> row whose STATE is <code>idle</code>.",
  ],
  solution: ["sinfo"],

  build() {
    return {
      fs: home(),
      canned: {
        "sinfo": SINFO,
        "sinfo -s": "PARTITION AVAIL  TIMELIMIT   NODES(A/I/O/T)  NODELIST\ncompute*     up 3-00:00:00       29/13/6/48  cn01-cn48\nbigmem       up 1-00:00:00          2/0/0/2  cn49-cn50\ngpu          up 1-00:00:00          0/1/0/1  cn51",
        "squeue": SQUEUE,
        "squeue -u student": "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
        "squeue --me": "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
      },
    };
  },
};
