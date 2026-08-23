// Challenge 9 — scp. The learner is on their own laptop, not the cluster,
// because that is where scp is run from and the prompt has to say so.

import { LAPTOP, INVERSION_CSV } from "./_laptop.js";

export default {
  num: 9,
  slug: "bringing-files-back",
  title: "The result is on the wrong machine",
  commands: ["scp"],
  teaches: ["scp", "remote path", "copy direction"],
  variants: [{ i: 0 }],

  host: "laptop",
  os: "Ubuntu 24.04.1 LTS",
  cwd: "/home/student/inversion",

  scenario: `<p>The inversion you submitted finished overnight, and it wrote its
    summary to <code>project/results/inversion.csv</code> on the cluster. The
    plotting you do is on your laptop. The file has to cross.</p>
    <p><code>ssh</code> puts you on the cluster, but it brings nothing back with
    you. <code>scp</code> is the copy that crosses between two machines. It takes
    the two arguments any copy takes — where the file is now, then where you want
    it — with one difference: a path on the other machine carries that machine in
    front of it, written <code>student@uwc-hpc:</code> and then the path.</p>
    <p>Read the prompt before you start. It says <code>laptop</code>, not
    <code>uwc-hpc</code>. You run <code>scp</code> from your own machine, and it
    reaches over to the cluster, which is how the file lands here rather than
    there.</p>`,

  example: [
    {
      command: "ssh student@uwc-hpc ls project",
      output: "README  data  logs  results  run.log  submit.sh",
      note: "A command after the host name runs on the cluster and prints its output here. You stay on the laptop, which is where you need to be.",
    },
    {
      command: "scp student@uwc-hpc:project/run.log .",
      output: "run.log                                 100%   39KB    1.5MB/s   00:00",
      note: "Two paths. The first names the machine, a colon, and the path on that machine; the second is a single dot, which means the directory you are in. A real cluster asks for your password here. The trainer does not.",
    },
  ],

  task: `<p>Bring <code>project/results/inversion.csv</code> from the cluster into
    the directory you are in. When the copy finishes, <code>scp</code> prints one
    line for the file: its name, how much of it arrived, its size, the rate the
    copy ran at, and how long it took.</p>
    <p><strong>What size does that line report?</strong> Write it the way
    <code>scp</code> writes it, or write the number on its own.</p>`,

  answerLabel: "Size on the scp line",
  answer: "47MB",
  alternatives: ["47", "47 mb", "47m", "47 megabytes"],
  failures: [
    { match: /^100\s*%?$/, message: "<code>100%</code> means all of the file arrived. Every copy that finishes says that, whatever the file's size." },
    { match: /^9[.,]4\s*(mb\/?s?)?$/, message: "That is the rate the copy ran at, in megabytes a second. The size is the field to the left of it." },
    { match: /^(00:)?0?5\s*(s|sec|secs|seconds)?$/, message: "That is how long the copy took. The size is two fields to the left of it." },
  ],
  hints: [
    "You are on your laptop and the file is on the cluster. <code>scp</code> takes two paths in that order: the one it copies from, then the one it copies to.",
    "A path on another machine is written <code>user@host:path</code>, and the colon is what separates the machine from the path. For the destination, a single dot means the directory you are in.",
    "Run <code>scp student@uwc-hpc:project/results/inversion.csv .</code> The size is the third field on the line it prints, between the percentage and the rate.",
  ],
  solution: ["scp student@uwc-hpc:project/results/inversion.csv ."],

  build() {
    return {
      env: { HOSTNAME: "laptop" },
      fs: {
        "/home/student": {
          "inversion": LAPTOP.inversion,
          "Downloads": LAPTOP.Downloads,
        },
      },
      canned: {
        "ssh student@uwc-hpc ls project":
          "README  data  logs  results  run.log  submit.sh",
        "ssh student@uwc-hpc ls project/results":
          "inversion.csv  iter01.mod  iter02.mod  iter03.mod  iter04.mod  iter05.mod\niter06.mod  iter07.mod  iter08.mod  iter09.mod  iter10.mod  iter11.mod\niter12.mod  iter13.mod",
        "ssh student@uwc-hpc": {
          out: "",
          err: "This trainer cannot open an interactive session on the cluster. Put the command you want to run after the host name, e.g. ssh student@uwc-hpc ls project",
          code: 1,
        },
        "scp student@uwc-hpc:project/run.log .": {
          out: "run.log                                 100%   39KB    1.5MB/s   00:00",
          creates: { "run.log": { c: "2026-08-14 16:02:41 slurmd[1187]: job=48812 step=epilog node=cn02 state=completed exit=0\n", size: 39936 } },
        },
        "scp student@uwc-hpc:project/results/inversion.csv .": {
          out: "inversion.csv                           100%   47MB    9.4MB/s   00:05",
          creates: { "inversion.csv": { c: INVERSION_CSV, size: 49283072 } },
        },
        "scp student@uwc-hpc:project/results/inversion.csv ./": {
          out: "inversion.csv                           100%   47MB    9.4MB/s   00:05",
          creates: { "inversion.csv": { c: INVERSION_CSV, size: 49283072 } },
        },
        // Right idea, wrong direction: say so rather than inventing a copy.
        "scp . student@uwc-hpc:*": {
          out: "",
          err: "scp: this copies from your laptop up to the cluster. The file you want is already on the cluster — put the remote path first.",
          code: 1,
        },
      },
    };
  },
};
