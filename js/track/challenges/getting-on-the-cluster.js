// Challenge 8 — ssh. The end of the core: everything so far, done on a machine
// that is not this one. This is the first challenge on the learner's own
// laptop, which is where ssh is always run from.

/* Filled by tools/fill-examples.mjs — do not edit by hand. */
const OUT = [
  `uwc-hpc`,
  `/home/student`,
];

const LAPTOP_NOTES =
  "# getting started\n\n- account request went in on the 4th\n- Thandi says the login node is uwc-hpc\n- run 14 is queued, check on it once I can log in\n";

export default {
  num: 8,
  slug: "getting-on-the-cluster",
  title: "A machine that is not this one",
  commands: ["ssh"],
  teaches: ["ssh", "login node", "remote command", "hostname"],
  variants: [{ i: 0 }],

  host: "laptop",
  os: "Ubuntu 24.04.1 LTS",
  cwd: "/home/student/work",

  scenario: `<p>Everything so far happened on one machine. The cluster is a
    different machine, in a room in Bellville, and it does not have a screen you
    can sit in front of. You reach it the way everyone does: you open a terminal
    on your own computer and ask that machine to give you a shell.</p>
    <p><code>ssh</code> does that. You give it your username and the machine's
    name, joined by an <code>@</code>, and it either logs you in or tells you
    why not. The machine you land on is the <strong>login node</strong> — the
    front door, shared by everyone, and not where you run real work.</p>
    <p>Read the prompt. It says <code>laptop</code> now, because that is where
    you are. Getting used to checking which machine you are on will save you
    from running something in the wrong place, which is a mistake everyone makes
    at least once.</p>`,

  example: [
    { command: "ssh student@uwc-hpc hostname", output: OUT[0], note: "A command after the host name runs there and prints the answer here. You never leave the laptop." },
    { command: "ssh student@uwc-hpc pwd", output: OUT[1], note: "Note where it lands: your home directory on the cluster, not the one you are standing in." },
  ],

  task: `<p>Ask the cluster what work is queued for you. Running
    <code>ls</code> on the cluster will show you the same
    <code>project</code> directory you spent the last seven challenges in — from
    your laptop, without copying anything.</p>
    <p>Now look at the cluster's own message of the day, which every login node
    prints and everybody ignores: run <code>ssh student@uwc-hpc cat /etc/motd</code>.
    <strong>How many compute nodes does it say the cluster has?</strong> Type
    the number on its own.</p>`,

  answerLabel: "Compute nodes on uwc-hpc",
  answer: "48",
  alternatives: ["48 nodes"],
  failures: [
    { match: /^4$/, message: "Four is the number of nodes <em>your</em> job asked for, which is in <code>submit.sh</code>, not the size of the cluster." },
    { match: /^(9|9\.4)$/, message: "9.4 is the Rocky Linux version on the line above. The node count is further down." },
    { match: /^1$/, message: "One is the login node — the machine you land on. The compute nodes are the ones behind it." },
  ],
  hints: [
    "You do not need to log in and look around. Put the command you want after the host name and it runs there.",
    "<code>ssh student@uwc-hpc cat /etc/motd</code> prints the cluster's welcome message on your laptop.",
    "Run <code>ssh student@uwc-hpc cat /etc/motd</code> and read the line that begins <code>Compute nodes</code>.",
  ],
  solution: ["ssh student@uwc-hpc cat /etc/motd"],

  build() {
    return {
      env: { HOSTNAME: "laptop" },
      fs: {
        "/home/student": {
          "work": {
            "notes.md": { c: LAPTOP_NOTES },
            "plot.py": { c: "import pandas as pd\n" },
          },
        },
      },
      canned: {
        "ssh student@uwc-hpc hostname": "uwc-hpc",
        "ssh student@uwc-hpc pwd": "/home/student",
        "ssh student@uwc-hpc ls": "notes.txt  project",
        "ssh student@uwc-hpc ls project": "README  data  run.log  submit.sh",
        "ssh student@uwc-hpc cat /etc/motd":
          "  Welcome to uwc-hpc\n" +
          "  ------------------\n" +
          "  Rocky Linux 9.4 (Blue Onyx)\n" +
          "  Login node:    1  (this machine — do not run jobs here)\n" +
          "  Compute nodes: 48 (cn01-cn48, 64 cores each)\n" +
          "  Scheduler:     Slurm 23.11.6\n" +
          "  Support:       hpc@uwc.ac.za\n",
        "ssh student@uwc-hpc": {
          out: "",
          err: "This trainer cannot open an interactive session on the cluster. Put the command you want to run after the host name, e.g. ssh student@uwc-hpc hostname",
          code: 1,
        },
        "ssh uwc-hpc *": {
          out: "",
          err: "student@uwc-hpc: Permission denied (publickey,password).\n\nThe cluster needs to know who you are. Put your username and an @ in front of the host name.",
          code: 255,
        },
      },
    };
  },
};
