// Challenge 5 — cat, head, tail. The first challenge where the file is bigger
// than the screen, which is the whole reason head and tail exist.

const STEPS = ["prolog", "task_init", "cgroup_setup", "launch", "step_done", "acct_flush"];

function logLines() {
  const lines = [];
  let job = 48001;
  for (let i = 0; i < 412; i++) {
    const mm = String(9 + Math.floor(i / 60)).padStart(2, "0");
    const ss = String(i % 60).padStart(2, "0");
    lines.push(`2026-08-14 ${mm}:14:${ss} slurmd[1187]: job=${job} step=${STEPS[i % STEPS.length]} node=cn0${(i % 4) + 1} state=running`);
    if (i % 37 === 36) job += 137;
  }
  lines.push("2026-08-14 16:02:41 slurmd[1187]: job=48812 step=epilog node=cn02 state=completed exit=0");
  return lines;
}

const LOG = logLines();
const README = "seismic-inversion, run 14\ndata/ holds the inputs, run.log holds the last run\n";

export default {
  num: 5,
  slug: "reading-files",
  title: "The file that will not fit",
  commands: ["cat", "head", "tail"],
  teaches: ["cat", "head", "tail", "standard output"],
  variants: [{ i: 0, job: 48812 }],

  cwd: "/home/student/project",

  scenario: `<p>Something you submitted last night finished at some point, and the
    log is the only record of it. It is on the cluster, in your project directory,
    and it is <strong>413 lines long</strong>.</p>
    <p><code>cat</code> prints a whole file to the screen. That is the right tool for a
    note or a short config file, and the wrong tool for a log — the beginning scrolls
    past before you can read it. <code>head</code> and <code>tail</code> print just
    the ends: the first ten lines, or the last ten.</p>`,

  example: [
    {
      command: "cat README",
      output: README.replace(/\n$/, ""),
      note: "Two lines, so cat is fine here.",
    },
    {
      command: "head -n 3 run.log",
      output: LOG.slice(0, 3).join("\n"),
      note: "-n 3 asks for three lines instead of the default ten. The same flag works on tail.",
    },
  ],

  task: `<p>The last line of <code>run.log</code> is written when the job finishes.
    <strong>What job ID does it record?</strong></p>
    <p>Type the number on its own, without <code>job=</code>.</p>`,

  answerLabel: "Job ID from the last line",
  answer: "48812",
  alternatives: ["job=48812"],
  failures: [
    { match: /^(job=)?48001$/, message: "That is the job at the <em>top</em> of the file — head shows you the beginning. The last line needs tail." },
    // Anchored away from the two job IDs that have their own messages, so
    // this pattern can never fire on the right answer.
    { match: /^(job=)?4(?!8812$|8001$)[0-9]{4}$/, message: "That is a job ID from somewhere in the middle of the log. The one you want is on the very last line." },
    { match: /^0$/, message: "0 is the exit status on that line, not the job ID. The job ID follows <code>job=</code>." },
  ],
  hints: [
    "The file is too long to read in one go. Two commands show you only the ends of it — you have met both in the example above.",
    "<code>tail</code> prints the last lines of a file. With no flag it prints ten, which is more than you need here.",
    "Run <code>tail -n 1 run.log</code>. The answer is the number straight after <code>job=</code>.",
  ],
  solution: ["tail -n 1 run.log"],

  build() {
    return {
      fs: {
        "/home/student": {
          "project": {
            "README": { c: README },
            "run.log": { c: LOG.join("\n") + "\n" },
            "submit.sh": { c: "#!/bin/bash\n#SBATCH --job-name=inversion\n#SBATCH --nodes=4\nsrun ./invert data/\n" },
            "data": {
              "shot001.segy": { c: "(binary)\n", size: 41287424, binary: true },
              "shot002.segy": { c: "(binary)\n", size: 40118272, binary: true },
              "stations.csv": { c: "id,lat,lon\n1,-33.93,18.63\n2,-33.94,18.64\n" },
            },
          },
          "notes.txt": { c: "ask Thandi about the queue limits\n" },
        },
      },
    };
  },
};
