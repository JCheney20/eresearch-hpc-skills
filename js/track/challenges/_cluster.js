// The cluster side of the story. One home directory, one project, one run —
// the same seismic inversion the transfer challenges pull results from — so a
// learner walking the core meets the same files getting steadily more
// familiar rather than a fresh invented world every challenge.
//
// Challenges extend this rather than redefining it, so a file that appears in
// challenge 2 is still there, unchanged, in challenge 7.

export const README =
  "seismic-inversion, run 14\ndata/ holds the inputs, run.log holds the last run\n";

export const SUBMIT =
  "#!/bin/bash\n#SBATCH --job-name=inversion\n#SBATCH --nodes=4\n#SBATCH --time=04:00:00\n#SBATCH --partition=compute\nsrun ./invert data/\n";

export const STATIONS =
  "id,lat,lon\n1,-33.93,18.63\n2,-33.94,18.64\n3,-33.92,18.61\n";

export const NOTES = "ask Thandi about the queue limits\n";

const STEPS = ["prolog", "task_init", "cgroup_setup", "launch", "step_done", "acct_flush"];

/* 413 lines. Long enough that reading it whole is the wrong idea, which is
   the entire point of challenges 5, 6 and 7. */
export function runLog() {
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

export const RUN_LOG = runLog();
export const RUN_LOG_TEXT = RUN_LOG.join("\n") + "\n";
/* Derived, never typed: a challenge that asks "how big is run.log" gets the
   real answer, and it stays right if the log ever changes. */
export const RUN_LOG_BYTES = RUN_LOG_TEXT.length;

export const DATA = {
  "shot001.segy": { c: "(binary)\n", size: 41287424, binary: true },
  "shot002.segy": { c: "(binary)\n", size: 40118272, binary: true },
  "stations.csv": { c: STATIONS },
};

export const PROJECT = {
  "README": { c: README },
  "run.log": { c: RUN_LOG_TEXT },
  "submit.sh": { c: SUBMIT, mode: "-rwxr-xr-x" },
  "data": DATA,
};

/* The project directory, plus anything a challenge adds to it. Merged rather
   than replaced: a challenge that adds a config file still has the README,
   the log and the data that every earlier challenge taught. */
export function project(extra = {}) {
  return Object.assign({}, PROJECT, extra);
}

/* The whole home directory. `extra` is merged at the top level of home;
   `inProject` is merged inside project/. */
export function home(extra = {}, inProject = {}) {
  return {
    "/home/student": Object.assign({
      "project": project(inProject),
      "notes.txt": { c: NOTES },
    }, extra),
  };
}
