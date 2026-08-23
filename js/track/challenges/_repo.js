// The project as a git repository. Shared by the three "keeping a record"
// challenges so the history is continuous: the log challenge 11 reads is the
// history challenge 12 adds to, and challenge 13 pulls the commit a colleague
// pushed on top of it.

export const LOG = [
  "commit 9f2c1ab4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a6",
  "Author: Thandi Mokoena <thandi@uwc.ac.za>",
  "Date:   Thu Aug 14 08:41:02 2026 +0200",
  "",
  "    Tighten the tolerance for run 14",
  "",
  "commit 7b1d0e3c5a7f9b1d3e5a7c9f1b3d5e7a9c1f3b5d",
  "Author: Justin Cloete <justin@uwc.ac.za>",
  "Date:   Wed Aug 13 16:12:55 2026 +0200",
  "",
  "    Add the 2026 station list",
  "",
  "commit 4a8c2e6b0d4f8a2c6e0b4d8f2a6c0e4b8d2f6a0c",
  "Author: Justin Cloete <justin@uwc.ac.za>",
  "Date:   Mon Aug 11 09:03:17 2026 +0200",
  "",
  "    Submit script for four nodes",
  "",
  "commit 1c5e9a3d7b1f5c9e3a7d1b5f9c3e7a1d5b9f3c7e",
  "Author: Thandi Mokoena <thandi@uwc.ac.za>",
  "Date:   Fri Aug  8 14:27:40 2026 +0200",
  "",
  "    First working inversion",
].join("\n");

export const LOG_ONELINE = [
  "9f2c1ab Tighten the tolerance for run 14",
  "7b1d0e3 Add the 2026 station list",
  "4a8c2e6 Submit script for four nodes",
  "1c5e9a3 First working inversion",
].join("\n");

export const STATUS_DIRTY = [
  "On branch main",
  "Your branch is up to date with 'origin/main'.",
  "",
  "Changes not staged for commit:",
  '  (use "git add <file>..." to update what will be committed)',
  '  (use "git restore <file>..." to discard changes in working directory)',
  "\tmodified:   run.conf",
  "",
  "Untracked files:",
  '  (use "git add <file>..." to include in what will be committed)',
  "\tnotes-run14.md",
  "",
  'no changes added to commit (use "git add" and/or "git commit -a")',
].join("\n");

export const CONFIG =
  "[run]\nname = inversion\niterations = 3\ntolerance = 1e-6\n\n[io]\nstations = data/stations.csv\noutput = results/\n";

export const RUN14_NOTES =
  "Run 14\n\n- tolerance tightened to 1e-6\n- four nodes, four hours\n- compare the misfit against run 13 before trusting it\n";
