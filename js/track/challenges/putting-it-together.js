// Challenge 18 — the finale. Nothing new is taught; the point is that all
// three routes are needed at once, which is what using a cluster is actually
// like.

import { home } from "./_cluster.js";
import { SQUEUE_ME_RUNNING, SQUEUE } from "./_slurm.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `inversion: warning: station 118 rejected, residual out of range`,
  `             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)`,
];

const JOB_OUT = [
  "srun: job 49150 queued and waiting for resources",
  "srun: job 49150 has been allocated resources",
  "inversion: reading data/ (2 shots, 412 stations)",
  "inversion: iteration 1  misfit=0.482  rms=1.191",
  "inversion: iteration 2  misfit=0.311  rms=0.977",
  "inversion: iteration 3  misfit=0.204  rms=0.802",
  "inversion: warning: station 118 rejected, residual out of range",
  "inversion: iteration 4  misfit=0.171  rms=0.744",
  "inversion: converged after 4 iterations",
  "inversion: wrote results/inversion.csv",
].join("\n") + "\n";

const RESULTS = "iteration,misfit,rms,stations\n1,0.482,1.191,412\n2,0.311,0.977,412\n3,0.204,0.802,412\n4,0.171,0.744,411\n";

export default {
  num: 18,
  slug: "putting-it-together",
  title: "One ordinary afternoon",
  commands: ["grep", "squeue", "rsync"],
  teaches: ["combining what you know"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>Nothing here is new. This is a normal afternoon on a cluster,
    and it needs all three routes at once: something to read in an output file,
    something to check in the queue, and something to bring home.</p>
    <p>The run you submitted has finished. Its output went where the scheduler
    said it would — <code>slurm-49150.out</code>, named after the job — and the
    results it wrote are in <code>results/</code>.</p>
    <p>Somewhere in that output is a warning. It is one line in ten, and on a
    real run it is one line in forty thousand, which is why nobody finds these
    by scrolling.</p>`,

  example: [
    { command: "grep -i warning slurm-49150.out", output: OUT[0], note: "-i because logs disagree about capitals, and you should not have to guess which one this program used." },
    { command: "squeue --me", output: OUT[1], note: "Empty but for the header: nothing of yours is queued or running any more, which is how you know it is done." },
  ],

  task: `<p>Three things, in the order you would actually do them.</p>
    <ol>
      <li>Find the warning in <code>slurm-49150.out</code>.</li>
      <li>Check the queue to confirm the job really has finished.</li>
      <li>Read <code>results/inversion.csv</code> and look at the last row.</li>
    </ol>
    <p>The warning names a station the run threw out, and the last row of the
    results counts the stations that survived.</p>
    <p><strong>Which station was rejected?</strong> Type its number on its
    own.</p>`,

  answerLabel: "The rejected station",
  answer: "118",
  alternatives: ["station 118"],
  failures: [
    { match: /^411$/, message: "411 is how many stations were left afterwards, in the last row of the results. The warning names the one that went." },
    { match: /^412$/, message: "412 is how many there were to begin with. One of them was rejected — the warning says which." },
    { match: /^4$/, message: "Four is the iteration the run converged on. The warning line names a station, not an iteration." },
    { match: /^49150$/, message: "That is the job ID, which is in the filename. Read the warning line itself." },
  ],
  hints: [
    "You are looking for one line in a file, and you know its word. That is <code>grep</code>, with the flag that ignores capitals.",
    "Run <code>grep -i warning slurm-49150.out</code>. The line names a station and says why it went.",
    "Run <code>grep -i warning slurm-49150.out</code>: <code>station 118 rejected, residual out of range</code>.",
  ],
  solution: ["grep -i warning slurm-49150.out"],

  build() {
    return {
      fs: home({}, {
        "slurm-49150.out": { c: JOB_OUT },
        "results": { "inversion.csv": { c: RESULTS } },
      }),
      canned: {
        "squeue --me": "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
        "squeue -u student": "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
        "squeue": SQUEUE,
        "rsync -av --stats student@uwc-hpc:project/results/ results/":
          "receiving incremental file list\ninversion.csv\n\nNumber of files: 2 (reg: 1, dir: 1)\nNumber of regular files transferred: 1\nTotal file size: 132 bytes\n\nsent 43 bytes  received 231 bytes  548.00 bytes/sec\ntotal size is 132  speedup is 0.48",
      },
    };
  },
};
