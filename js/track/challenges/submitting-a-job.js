// Challenge 16 — sbatch. Handing work to the scheduler and finding its output.

import { home } from "./_cluster.js";
import { SINFO, SQUEUE, SQUEUE_ME } from "./_slurm.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `#!/bin/bash
#SBATCH --job-name=inversion
#SBATCH --nodes=4
#SBATCH --time=04:00:00
#SBATCH --partition=compute
srun ./invert data/`,
  `sbatch: Job 49150 to start at 2026-08-15T11:04:12 using 256 processors on nodes cn33-cn36 in partition compute`,
];

export default {
  num: 16,
  slug: "submitting-a-job",
  title: "Handing the work over",
  commands: ["sbatch", "cat"],
  teaches: ["sbatch", "batch script", "SBATCH directive", "job id"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>You do not run work on a cluster by typing the command and
    waiting. You write it down in a file, hand the file to the scheduler, and go
    away. The scheduler runs it when there is room, whether or not you are still
    logged in.</p>
    <p>That file is a <strong>batch script</strong>. It is an ordinary shell
    script with a block of <code>#SBATCH</code> lines at the top. Those look like
    comments, and to the shell they are — the scheduler reads them as your
    request: how many nodes, for how long, in which partition, under what
    name.</p>
    <p><code>sbatch submit.sh</code> hands it over. You get back a
    <strong>job ID</strong>, and that number is how you refer to this piece of
    work for the rest of its life: in the queue, in the accounting, and in the
    name of the file its output lands in.</p>`,

  example: [
    { command: "cat submit.sh", output: OUT[0], note: "Four requests and one command. Everything above srun is asking; the last line is the work." },
    { command: "sbatch --test-only submit.sh", output: OUT[1], note: "A rehearsal: the scheduler says when it thinks this would start, and submits nothing." },
  ],

  task: `<p>Submit <code>submit.sh</code> to the queue, then look for your job
    with <code>squeue --me</code>.</p>
    <p><strong>What job ID did the scheduler give it?</strong> Type the number
    on its own.</p>`,

  answerLabel: "Your job ID",
  answer: "49150",
  alternatives: ["job 49150"],
  failures: [
    { match: /^49142$/, message: "49142 is somebody else's pending job, from the shared queue. Yours is the one <code>sbatch</code> just told you about." },
    { match: /^48812$/, message: "48812 was last night's run, from <code>run.log</code>. This is a new job with a new number." },
    { match: /^4$/, message: "Four is the number of nodes the script asks for. The job ID is the number <code>sbatch</code> printed when it accepted the job." },
  ],
  hints: [
    "The script is already written and already in this directory. One command hands it to the scheduler.",
    "Run <code>sbatch submit.sh</code>. It answers with one line naming the job it created.",
    "Run <code>sbatch submit.sh</code> and read the number at the end of <code>Submitted batch job ...</code>.",
  ],
  solution: ["sbatch submit.sh"],

  build() {
    return {
      fs: home(),
      canned: {
        "sbatch submit.sh": "Submitted batch job 49150",
        "sbatch ./submit.sh": "Submitted batch job 49150",
        "sbatch --test-only submit.sh":
          "sbatch: Job 49150 to start at 2026-08-15T11:04:12 using 256 processors on nodes cn33-cn36 in partition compute",
        "sbatch *": {
          out: "",
          err: "sbatch: error: Unable to open file. The script to submit is submit.sh, in this directory.",
          code: 1,
        },
        "squeue --me": SQUEUE_ME,
        "squeue -u student": SQUEUE_ME,
        "squeue": SQUEUE,
        "sinfo": SINFO,
        "scontrol show job 49150":
          "JobId=49150 JobName=inversion\n" +
          "   UserId=student(1000) GroupId=student(1000)\n" +
          "   Priority=4294901561 Partition=compute\n" +
          "   JobState=PENDING Reason=Priority Dependency=(null)\n" +
          "   NumNodes=4 NumCPUs=256 TimeLimit=04:00:00\n" +
          "   StdOut=/home/student/project/slurm-49150.out\n" +
          "   StdErr=/home/student/project/slurm-49150.out",
      },
    };
  },
};
