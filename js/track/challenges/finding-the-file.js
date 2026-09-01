// Challenge 7 — grep -r. You know what you are looking for and not where.

import { home, STATIONS } from "./_cluster.js";

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `./HANDOVER.txt:Thandi set the tolerance and I have not touched it.
./archive/run13.conf:tolerance = 1e-4
./run.conf:tolerance = 1e-6`,
  `./archive/run13.conf:stations = data/stations-2025.csv
./run.conf:stations = data/stations.csv`,
];

const CONFIG =
  "[run]\nname = inversion\niterations = 3\ntolerance = 1e-6\n\n[io]\nstations = data/stations.csv\noutput = results/\n";

const OLD_CONFIG =
  "[run]\nname = inversion\niterations = 2\ntolerance = 1e-4\n\n[io]\nstations = data/stations-2025.csv\noutput = results/\n";

const HANDOVER =
  "Handover notes, run 13 -> 14\n\nThandi set the tolerance and I have not touched it.\nIf a run stalls, check the queue before blaming the code.\nThe station list changed between runs; the old one is in archive/.\n";

export default {
  num: 7,
  slug: "finding-the-file",
  title: "You know what it says, not where it is",
  commands: ["grep -r"],
  teaches: ["grep -r", "searching a tree", "reading a match"],
  variants: [{ i: 0 }],

  scenario: `<p>Yesterday's question was "which line". Today's is harder: you
    know a word is written down somewhere in this project and you do not know
    which file it is in.</p>
    <p><code>grep -r</code> searches a whole directory tree — every file below
    the one you point it at, however deep. Instead of matching lines it prints
    the filename, a colon, and then the line, because with several files in play
    "which file" is half the answer.</p>
    <p>A single dot means "here", so <code>grep -r something .</code> is the
    form you will type most often in your life.</p>`,

  example: [
    { command: "grep -r tolerance .", output: OUT[0], note: "Two files mention it, and the filename before each colon is how you tell them apart." },
    { command: "grep -r stations .", output: OUT[1], note: "Same search, more hits — including one inside a directory you have not opened." },
  ],

  task: `<p>Somebody left handover notes in this project, and they name the
    person who set the run's tolerance. You do not know which file the notes are
    in.</p>
    <p><strong>Whose name is it?</strong> Search the project for the word
    <code>tolerance</code> and read the file that turns out to be prose rather
    than configuration. Type the name on its own.</p>`,

  answerLabel: "The name in the handover notes",
  answer: "thandi",
  alternatives: ["Thandi"],
  failures: [
    { match: /^1e-[46]$/, message: "That is the tolerance value itself, from the config file. The notes are the file that reads like a sentence." },
    { match: /^(handover|handover\.txt|notes)$/, message: "That is the file. The answer is the name written inside it." },
    { match: /^inversion$/, message: "<code>inversion</code> is the run's name, in the config. Look in the file that is prose, not settings." },
  ],
  hints: [
    "<code>grep</code> with the flag that searches a whole tree, and a dot for \"here\", will find every file that mentions the word.",
    "Run <code>grep -r tolerance .</code> — three files match. Two are configuration; one reads like a person wrote it.",
    "Run <code>grep -r tolerance .</code>, then <code>cat</code> the file that is not a config. The first line of prose names them.",
  ],
  solution: ["grep -r tolerance ."],

  cwd: "/home/student/project",
  build() {
    return {
      fs: home({}, {
        "run.conf": { c: CONFIG },
        "HANDOVER.txt": { c: HANDOVER },
        "archive": {
          "run13.conf": { c: OLD_CONFIG },
          "stations-2025.csv": { c: STATIONS },
        },
      }),
    };
  },
};
