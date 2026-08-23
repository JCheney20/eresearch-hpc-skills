// Commands this track needs that the original game did not have.
//
// They are supplied as per-challenge `hooks`, which the Shell consults before
// COREUTILS and SCENARIO, so nothing in js/shell.js or js/commands/ has to
// change to make room for them.
//
// scp, rsync, ssh and git are *deterministically simulated*: they print real
// output and, where a real copy would leave a file behind, they leave one
// behind in the VFS — but nothing crosses a network, because there is no
// network. Their output comes from the challenge's `canned` table, keyed on
// the exact command line, with a "prefix *" key as the fallback so a wrong
// invocation fails the way the real tool fails instead of silently working.

import { COREUTILS } from "../commands/coreutils.js";

function key(cmd, args) {
  return [cmd, ...args].join(" ").replace(/\s+/g, " ").trim();
}

/* Look a command line up in the challenge's canned table. A hit may also
   declare `creates`, a small fs spec dropped into the cwd — that is how a
   simulated copy leaves a real file behind for `ls` to find. */
function lookup(ctx, cmd, args) {
  const canned = ctx.canned || {};
  const k = key(cmd, args);
  let hit = k in canned ? canned[k] : null;
  if (hit === null) {
    for (const [pattern, value] of Object.entries(canned)) {
      if (pattern.endsWith(" *") && k.startsWith(pattern.slice(0, -1))) { hit = value; break; }
    }
  }
  if (hit === null) return null;
  if (typeof hit === "string") return { out: hit, code: 0 };
  if (hit.creates) ctx.vfs.addTree(ctx.cwd, ".", hit.creates);
  return { out: hit.out || "", err: hit.err || "", code: hit.code || 0 };
}

function cannedOr(ctx, cmd, args, fallback) {
  return lookup(ctx, cmd, args) || fallback();
}

const REMOTE = /^[\w.-]+@[\w.-]+:/;

export const TRACK_COMMANDS = {
  // `ll` is not a program; it is the alias almost every Linux account ships
  // with. Beginners meet it as if it were a command, so it behaves like one.
  ll(args, stdin, ctx) {
    return COREUTILS.ls(["-l", ...args], stdin, ctx);
  },

  tldr(args, stdin, ctx) {
    const name = args.find(a => !a.startsWith("-"));
    if (!name) return { out: "", err: "tldr: usage: tldr <command>", code: 1 };
    const page = TLDR[name];
    if (!page) return { out: "", err: `tldr: no page for '${name}'. Try 'man ${name}'.`, code: 1 };
    return { out: page, code: 0 };
  },

  scp(args, stdin, ctx) {
    return cannedOr(ctx, "scp", args, () => {
      const paths = args.filter(a => !a.startsWith("-"));
      if (paths.length < 2) {
        return { out: "", err: "usage: scp [-r] SOURCE... DEST\n\nA path on another machine is written user@host:path", code: 1 };
      }
      if (!paths.some(p => REMOTE.test(p))) {
        return { out: "", err: "scp: both paths are on this machine. One of them has to name the other machine, written user@host:path", code: 1 };
      }
      return { out: "", err: `scp: ${paths[0]}: No such file or directory`, code: 1 };
    });
  },

  rsync(args, stdin, ctx) {
    return cannedOr(ctx, "rsync", args, () => {
      const paths = args.filter(a => !a.startsWith("-"));
      if (paths.length < 2) {
        return { out: "", err: "rsync: usage: rsync [-av] [--stats] SOURCE DEST", code: 1 };
      }
      if (!paths.some(p => REMOTE.test(p))) {
        return { out: "", err: "rsync: both paths are on this machine. One of them has to name the other machine, written user@host:path", code: 1 };
      }
      return { out: "", err: `rsync: [sender] change_dir "${paths[0]}" failed: No such file or directory (2)`, code: 23 };
    });
  },

  ssh(args, stdin, ctx) {
    return cannedOr(ctx, "ssh", args, () => {
      const target = args.find(a => !a.startsWith("-"));
      if (!target) return { out: "", err: "usage: ssh [user@]host [command]", code: 255 };
      if (!/@/.test(target)) {
        return { out: "", err: `ssh: Could not resolve hostname ${target}: Name or service not known`, code: 255 };
      }
      return { out: "", err: `ssh: connect to host ${target.split("@")[1]} port 22: Connection refused`, code: 255 };
    });
  },

  git(args, stdin, ctx) {
    return cannedOr(ctx, "git", args, () => {
      if (args.length === 0) return { out: "", err: "usage: git <command> [<args>]", code: 1 };
      return { out: "", err: `git: '${args[0]}' is not a git command in this trainer.`, code: 1 };
    });
  },

  df(args, stdin, ctx) {
    return cannedOr(ctx, "df", args, () => ({
      out: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda2       218G   96G  111G  47% /\n/dev/sdb1       4.6T  3.1T  1.3T  71% /home\ntmpfs            94G     0   94G   0% /dev/shm",
      code: 0,
    }));
  },

  watch(args, stdin, ctx) {
    return cannedOr(ctx, "watch", args, () => {
      const inner = args.filter(a => !a.startsWith("-"));
      if (inner.length === 0) return { out: "", err: "watch: usage: watch [-n SECONDS] COMMAND", code: 1 };
      // A real watch redraws forever. Here it runs the command once and says
      // so, because a browser tab that never returns a prompt is a trap.
      const r = ctx.shell.run(inner.join(" "));
      const every = (args.includes("-n") ? args[args.indexOf("-n") + 1] : "2") + "s";
      return {
        out: `Every ${every}: ${inner.join(" ")}\n\n${r.out || r.err || ""}\n\n(the real watch redraws this until you press Ctrl-C; the trainer runs it once)`,
        code: 0,
      };
    });
  },
};

// Short, example-led pages. `man` is the reference; `tldr` is the answer to
// "just show me what it looks like", which is what a beginner actually wants.
export const TLDR = {
  ls: "ls — list what is in a directory.\n\n  ls                    names only\n  ls -l                 one per line, with size and owner\n  ls -a                 include hidden names (they start with a dot)",
  ll: "ll — the same as `ls -l`. Most Linux accounts ship with it as an alias.\n\n  ll                    long listing of this directory\n  ll data               long listing of data/",
  cd: "cd — change directory.\n\n  cd project            go into project\n  cd ..                 go up one\n  cd                    go home",
  pwd: "pwd — print the directory you are in.\n\n  pwd                   /home/student/project",
  cat: "cat — print a whole file.\n\n  cat README            print one file\n  cat a.txt b.txt       print two, one after the other",
  head: "head — print the first lines of a file.\n\n  head run.log          the first 10 lines\n  head -n 3 run.log     the first 3 lines",
  tail: "tail — print the last lines of a file.\n\n  tail run.log          the last 10 lines\n  tail -n 1 run.log     just the last line",
  grep: "grep — print the lines that contain something.\n\n  grep error run.log        lines containing 'error'\n  grep -i error run.log     ignore upper/lower case\n  grep -r error .           search every file below here",
  man: "man — the full reference page for a command.\n\n  man tail              everything tail can do\n\nLonger than tldr, and complete. Press q to leave a real one.",
  ssh: "ssh — log in to another machine.\n\n  ssh student@uwc-hpc              open a session there\n  ssh student@uwc-hpc ls project   run one command there, print it here",
  scp: "scp — copy a file between two machines.\n\n  scp student@uwc-hpc:project/run.log .    bring one down\n  scp report.pdf student@uwc-hpc:          send one up\n  scp -r student@uwc-hpc:results/ results/ a whole directory",
  rsync: "rsync — copy only what is missing or changed.\n\n  rsync -av student@uwc-hpc:logs/ logs/          copy what is not here yet\n  rsync -av --stats student@uwc-hpc:logs/ logs/  and print a summary\n\nRun it again after a dropped link and it picks up where it stopped.",
  df: "df — how much disk space is left.\n\n  df -h                 human-readable sizes",
  free: "free — how much memory is in use.\n\n  free -h               human-readable sizes",
  watch: "watch — run a command over and over and show the latest output.\n\n  watch squeue          every 2 seconds\n  watch -n 10 squeue    every 10 seconds",
};
