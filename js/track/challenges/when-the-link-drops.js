// Challenge 10 — rsync. Opens on the wreckage challenge 9's story leaves: a
// results directory that is partly there, because the link went down.

import { LAPTOP, INVERSION_CSV, RUN12_LOG, RUN13_LOG, MODEL } from "./_laptop.js";

const RUN14_LOG =
  "2026-08-14 09:14:00 slurmd[1187]: job=48001 step=prolog node=cn01 state=running\n2026-08-14 16:02:41 slurmd[1187]: job=48812 step=epilog node=cn02 state=completed exit=0\n";

/* Nine of the fourteen files made it across before the link dropped. */
const ARRIVED = {
  "inversion.csv": { c: INVERSION_CSV, size: 49283072 },
  "iter01.mod": MODEL, "iter02.mod": MODEL, "iter03.mod": MODEL, "iter04.mod": MODEL,
  "iter05.mod": MODEL, "iter06.mod": MODEL, "iter07.mod": MODEL, "iter08.mod": MODEL,
};

/* The five rsync has to fetch. */
const MISSING = {
  "iter09.mod": MODEL, "iter10.mod": MODEL, "iter11.mod": MODEL,
  "iter12.mod": MODEL, "iter13.mod": MODEL,
};

const RESULTS_STATS = [
  "receiving incremental file list",
  "iter09.mod",
  "iter10.mod",
  "iter11.mod",
  "iter12.mod",
  "iter13.mod",
  "",
  "Number of files: 15 (reg: 14, dir: 1)",
  "Number of created files: 5 (reg: 5)",
  "Number of deleted files: 0",
  "Number of regular files transferred: 5",
  "Total file size: 1,271,769,600 bytes",
  "Total transferred file size: 450,887,680 bytes",
  "Literal data: 450,887,680 bytes",
  "Matched data: 0 bytes",
  "",
  "sent 118 bytes  received 450,998,244 bytes  47,473,512.84 bytes/sec",
  "total size is 1,271,769,600  speedup is 2.82",
].join("\n");

const LOGS_STATS = [
  "receiving incremental file list",
  "run14.log",
  "",
  "Number of files: 4 (reg: 3, dir: 1)",
  "Number of created files: 1 (reg: 1)",
  "Number of deleted files: 0",
  "Number of regular files transferred: 1",
  "Total file size: 126,208 bytes",
  "Total transferred file size: 42,112 bytes",
  "",
  "sent 62 bytes  received 42,231 bytes  84,462.00 bytes/sec",
  "total size is 126,208  speedup is 2.98",
].join("\n");

const DROPPED = [
  "inversion.csv                           100%   47MB    9.6MB/s   00:04",
  "iter01.mod                              100%   86MB    9.2MB/s   00:09",
  "iter02.mod                              100%   86MB    8.8MB/s   00:09",
  "iter03.mod                               37%   32MB    7.4MB/s   00:07 ETA",
  "client_loop: send disconnect: Broken pipe",
  "lost connection",
].join("\n");

export default {
  num: 10,
  slug: "when-the-link-drops",
  title: "The copy that starts again from nothing",
  commands: ["rsync"],
  teaches: ["rsync", "--stats", "resuming a copy"],
  variants: [{ i: 0 }],

  host: "laptop",
  os: "Ubuntu 24.04.1 LTS",
  cwd: "/home/student/inversion",

  scenario: `<p>One file at a time worked. The whole directory did not. You asked
    <code>scp -r</code> for all of <code>project/results/</code>, the link dropped
    partway through, and what sits in <code>results</code> is whatever had
    finished by then. Run the command again and <code>scp</code> starts at the
    first file and sends every one of them a second time, because
    <code>scp</code> does not look at what is already here. It copies what you
    point it at, in order, from the beginning.</p>
    <p><code>rsync</code> asks first. It compares the directory on the cluster
    with the directory on your laptop, works out which files are missing or have
    changed, and sends only those. Whatever is already in place it leaves alone.
    A dropped link becomes an inconvenience rather than a restart: run
    <code>rsync</code> again and it picks up the files the last attempt never
    reached.</p>
    <p>The two commands are close relatives and they behave differently.
    <code>scp</code> copies. <code>rsync</code> compares, then copies what the
    comparison found.</p>`,

  example: [
    {
      command: "scp -r student@uwc-hpc:project/results/ results/",
      output: DROPPED,
      note: "The same copy, tried again. Those first three files were already on the laptop, and scp sent them anyway, because starting at the beginning is all it knows how to do. Then the link went down again.",
    },
    {
      command: "rsync -av --stats student@uwc-hpc:project/logs/ logs/",
      output: LOGS_STATS,
      note: "A smaller directory, to show the shape of the summary. You copied the logs across last week and last night's run added one more, so rsync sends that one and leaves the other two where they are. Three regular files in the directory, one of them transferred.",
    },
  ],

  task: `<p>Bring the rest of <code>project/results/</code> down into the
    <code>results</code> directory the dropped copy left behind, and ask for the
    summary while you are there. The summary counts the files <code>rsync</code>
    compared and, on its own line, the files <code>rsync</code> transferred. The
    gap between those two figures is everything the comparison saved you.</p>
    <p><strong>How many regular files did <code>rsync</code> transfer?</strong>
    Type the number on its own.</p>`,

  answerLabel: "Regular files transferred",
  answer: "5",
  alternatives: ["5 files", "five"],
  failures: [
    { match: /^15( files?)?$/, message: "Fifteen is everything <code>rsync</code> compared: fourteen files and the directory that holds them. A later line counts the ones it transferred." },
    { match: /^14( files?)?$/, message: "Fourteen is every regular file in the directory, whether it moved or not. Only some of them had to cross, and the summary says how many." },
    { match: /^9( files?)?$/, message: "Nine is what <code>rsync</code> left alone, which is fourteen files less the ones that moved. You do not have to work it out: the summary states the number that moved." },
  ],
  hints: [
    "<code>rsync</code> takes its two paths in the same order <code>scp</code> does, and writes the one on the cluster the same way: <code>student@uwc-hpc:</code> and then the path.",
    "Three flags do the work. <code>-a</code> copies a directory and everything in it, <code>-v</code> names each file as it arrives, and <code>--stats</code> prints the summary at the end. A trailing slash on the source means the contents of that directory rather than the directory itself.",
    "Run <code>rsync -av --stats student@uwc-hpc:project/results/ results/</code> and read the line that begins <code>Number of regular files transferred</code>.",
  ],
  solution: ["rsync -av --stats student@uwc-hpc:project/results/ results/"],

  build() {
    return {
      env: { HOSTNAME: "laptop" },
      fs: {
        "/home/student": {
          "inversion": Object.assign({}, LAPTOP.inversion, {
            "inversion.csv": { c: INVERSION_CSV, size: 49283072 },
            "logs": {
              "run12.log": { c: RUN12_LOG },
              "run13.log": { c: RUN13_LOG },
            },
            "results": ARRIVED,
          }),
          "Downloads": LAPTOP.Downloads,
        },
      },
      canned: {
        "scp -r student@uwc-hpc:project/results/ results/": { out: DROPPED, code: 1 },
        "rsync -av --stats student@uwc-hpc:project/logs/ logs/": {
          out: LOGS_STATS,
          creates: { "logs": { "run14.log": { c: RUN14_LOG, size: 42112 } } },
        },
        "rsync -av --stats student@uwc-hpc:project/results/ results/": {
          out: RESULTS_STATS,
          creates: { "results": MISSING },
        },
        "rsync -av student@uwc-hpc:project/results/ results/": {
          out: RESULTS_STATS.split("\n").slice(0, 6).concat([
            "",
            "sent 118 bytes  received 450,998,244 bytes  47,473,512.84 bytes/sec",
            "total size is 1,271,769,600  speedup is 2.82",
          ]).join("\n"),
          creates: { "results": MISSING },
        },
        // No --stats, no summary. Say which flag is missing rather than
        // printing a summary the real rsync would not have printed.
        "rsync -av student@uwc-hpc:*": {
          out: "",
          err: "rsync: that path is not on the cluster. The results are at project/results/ — and add --stats to get the summary.",
          code: 23,
        },
      },
    };
  },
};
