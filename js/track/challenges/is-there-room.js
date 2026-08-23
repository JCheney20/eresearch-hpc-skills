// Challenge 14 — df -h and free -h. The two questions to ask before a job
// fails at three in the morning for a reason nobody wrote down.

import { home } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `Filesystem      Size  Used Avail Use% Mounted on
devtmpfs        4.0M     0  4.0M   0% /dev
tmpfs            94G     0   94G   0% /dev/shm
/dev/sda2       218G   96G  111G  47% /
/dev/sdb1       4.6T  3.1T  1.3T  71% /home
beegfs-scratch   88T   61T   27T  70% /scratch`,
  `               total        used        free      shared  buff/cache   available
Mem:           187Gi        12Gi       162Gi       1.0Gi        13Gi       173Gi
Swap:          8.0Gi          0B       8.0Gi`,
];

export default {
  num: 14,
  slug: "is-there-room",
  title: "Is there room for this",
  commands: ["df -h", "free -h"],
  teaches: ["df", "free", "human-readable sizes", "quota"],
  variants: [{ i: 0 }],

  cwd: "/home/student/project",

  scenario: `<p>Two things stop a job that would otherwise have worked: the disk
    is full, or the machine has no memory left. Both are one command away and
    almost nobody checks until after the failure.</p>
    <p><code>df</code> — "disk free" — reports each filesystem, its size, how
    much is used, and how much is left. <code>free</code> reports memory the
    same way. Both take <code>-h</code>, for "human-readable", which turns
    4823449600 into <code>4.5G</code>. Always use it.</p>
    <p>Note that <code>/home</code> is its own filesystem, separate from
    <code>/</code>. On a cluster your files live on a shared store and the
    number that matters to you is the one on that line, not the one for the root
    disk.</p>`,

  example: [
    { command: "df -h", output: OUT[0], note: "One row per filesystem. Read the Mounted-on column first, then work back to the numbers." },
    { command: "free -h", output: OUT[1], note: "The row that matters is Mem. 'available' is the honest figure — buffers and cache will be given back if something needs them." },
  ],

  task: `<p>You are about to submit a run that writes roughly 900 GB of models
    into your home directory. Check whether it will fit.</p>
    <p><strong>How much space is available on the filesystem your home
    directory is on?</strong> Type it exactly as <code>df -h</code> prints it,
    including the unit.</p>`,

  answerLabel: "Available space on /home",
  answer: "1.3T",
  alternatives: ["1.3 T", "1.3tb", "1.3 tb", "1.3 terabytes"],
  failures: [
    { match: /^111g?$/, message: "111G is what is left on <code>/</code>, the root disk. Your files are not there — look for the row mounted on <code>/home</code>." },
    { match: /^3\.1t?$/, message: "3.1T is what is already <em>used</em> on <code>/home</code>. The column you want is Avail." },
    { match: /^4\.6t?$/, message: "4.6T is the total size of <code>/home</code>, not what is free on it." },
    { match: /^94g?$/, message: "94G is <code>/dev/shm</code>, which is memory pretending to be a disk. Not where your results go." },
  ],
  hints: [
    "One command reports every filesystem at once. The flag that makes the numbers readable is the same one <code>free</code> takes.",
    "Run <code>df -h</code> and find the row whose Mounted-on column says <code>/home</code>.",
    "Run <code>df -h</code>. On the <code>/home</code> row, the fourth column — Avail — reads <code>1.3T</code>.",
  ],
  solution: ["df -h"],

  build() {
    return {
      fs: home(),
      canned: {
        "df -h":
          "Filesystem      Size  Used Avail Use% Mounted on\n" +
          "devtmpfs        4.0M     0  4.0M   0% /dev\n" +
          "tmpfs            94G     0   94G   0% /dev/shm\n" +
          "/dev/sda2       218G   96G  111G  47% /\n" +
          "/dev/sdb1       4.6T  3.1T  1.3T  71% /home\n" +
          "beegfs-scratch   88T   61T   27T  70% /scratch",
        "df":
          "Filesystem     1K-blocks       Used  Available Use% Mounted on\n" +
          "devtmpfs            4096          0       4096   0% /dev\n" +
          "tmpfs           98566144          0   98566144   0% /dev/shm\n" +
          "/dev/sda2      228589568  100663296  116391936  47% /\n" +
          "/dev/sdb1     4939212800 3328599040 1397555200  71% /home\n" +
          "beegfs-scratch 94489280512 65498251264 28991029248  70% /scratch",
        "free -h":
          "               total        used        free      shared  buff/cache   available\n" +
          "Mem:           187Gi        12Gi       162Gi       1.0Gi        13Gi       173Gi\n" +
          "Swap:          8.0Gi          0B       8.0Gi",
        "free":
          "               total        used        free      shared  buff/cache   available\n" +
          "Mem:       196237312    12582912   169869312     1048576    13785088   181403648\n" +
          "Swap:        8388608           0     8388608",
      },
    };
  },
};
