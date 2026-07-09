// Core Linux commands. Each is (args, stdin, ctx) -> { out, err, code }.

const HOME = "/home/student";

function splitFlags(args) {
  const flags = new Set(), files = [], opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-n" && /^\d+$/.test(args[i + 1] || "")) { opts.n = Number(args[++i]); }
    else if (/^-\d+$/.test(a)) { opts.n = Number(a.slice(1)); }
    else if (a.startsWith("-") && a.length > 1 && !/^-\d/.test(a)) {
      for (const f of a.slice(1)) flags.add(f);
    } else files.push(a);
  }
  return { flags, files, opts };
}

function getFile(ctx, path, cmd) {
  const node = ctx.vfs.get(ctx.cwd, path);
  if (!node) return { err: `${cmd}: ${path}: No such file or directory` };
  if (node.type === "dir") return { err: `${cmd}: ${path}: Is a directory` };
  if (!ctx.vfs.readable(node, ctx)) return { err: `${cmd}: ${path}: Permission denied` };
  return { node };
}

function input(files, stdin, ctx, cmd) {
  if (files.length === 0) return { text: stdin || "" };
  let text = "";
  for (const f of files) {
    const { node, err } = getFile(ctx, f, cmd);
    if (err) return { err };
    text += node.c;
  }
  return { text };
}

function modeFromOctal(oct, isDir) {
  const bits = ["---", "--x", "-w-", "-wx", "r--", "r-x", "rw-", "rwx"];
  const d = oct.padStart(3, "0").slice(-3).split("").map(Number);
  return (isDir ? "d" : "-") + bits[d[0]] + bits[d[1]] + bits[d[2]];
}

export const COREUTILS = {
  pwd(args, stdin, ctx) {
    return { out: ctx.cwd, code: 0 };
  },

  cd(args, stdin, ctx) {
    const target = args[0] || "~";
    const node = ctx.vfs.get(ctx.cwd, target);
    if (!node) return { err: `bash: cd: ${target}: No such file or directory`, code: 1 };
    if (node.type !== "dir") return { err: `bash: cd: ${target}: Not a directory`, code: 1 };
    ctx.cwd = ctx.vfs.pathOf(ctx.cwd, target);
    return { out: "", code: 0 };
  },

  ls(args, stdin, ctx) {
    const { flags, files } = splitFlags(args);
    const target = files[0] || ".";
    const node = ctx.vfs.get(ctx.cwd, target);
    if (!node) return { err: `ls: cannot access '${target}': No such file or directory`, code: 2 };
    const long = flags.has("l") || flags.has("n");
    const entries = node.type === "dir"
      ? Object.entries(node.children).sort(([a], [b]) => a.localeCompare(b))
      : [[target.split("/").pop(), node]];
    const shown = entries.filter(([n]) => flags.has("a") || !n.startsWith("."));
    if (!long) return { out: shown.map(([n, c]) => c.type === "dir" ? n + "/" : n).join("  "), code: 0 };
    const uid = o => (o === "root" ? 0 : /^\d+$/.test(o) ? o : 1000);
    const lines = shown.map(([n, c]) => {
      const mode = c.type === "dir" ? "drwxr-xr-x" : c.mode;
      const owner = c.type === "dir" ? "student" : c.owner;
      const who = flags.has("n") ? `${uid(owner)} ${uid(owner)}` : `${owner} ${owner}`;
      const size = c.type === "dir" ? 4096 : c.size;
      return `${mode} 1 ${who} ${String(size).padStart(6)} Jul  9 09:00 ${n}`;
    });
    return { out: lines.join("\n"), code: 0 };
  },

  cat(args, stdin, ctx) {
    const { files } = splitFlags(args);
    if (files.length === 0) return { out: stdin || "", code: 0 };
    let out = "";
    for (const f of files) {
      const { node, err } = getFile(ctx, f, "cat");
      if (err) return { err, code: 1 };
      out += node.binary ? mojibake(node) : node.c;
    }
    return { out, code: 0 };
  },

  head(args, stdin, ctx) {
    const { files, opts } = splitFlags(args);
    const r = input(files, stdin, ctx, "head");
    if (r.err) return { err: r.err, code: 1 };
    return { out: r.text.split("\n").slice(0, opts.n || 10).join("\n"), code: 0 };
  },

  tail(args, stdin, ctx) {
    const { files, opts } = splitFlags(args);
    const r = input(files, stdin, ctx, "tail");
    if (r.err) return { err: r.err, code: 1 };
    const lines = r.text.replace(/\n$/, "").split("\n");
    return { out: lines.slice(-(opts.n || 10)).join("\n"), code: 0 };
  },

  grep(args, stdin, ctx) {
    const flags = new Set(); const rest = [];
    for (const a of args) {
      if (a.startsWith("-") && a.length > 1) for (const f of a.slice(1)) flags.add(f);
      else rest.push(a);
    }
    const pattern = rest.shift();
    if (pattern === undefined) return { err: "usage: grep [-ivnc] PATTERN [FILE...]", code: 2 };
    const r = input(rest, stdin, ctx, "grep");
    if (r.err) return { err: r.err, code: 1 };
    let re;
    try { re = new RegExp(pattern, flags.has("i") ? "i" : ""); }
    catch { re = null; }
    const test = l => (re ? re.test(l) : l.includes(pattern));
    let lines = r.text.replace(/\n$/, "").split("\n");
    let hits = lines.map((l, i) => [i + 1, l]).filter(([, l]) => flags.has("v") ? !test(l) : test(l));
    if (flags.has("c")) return { out: String(hits.length), code: hits.length ? 0 : 1 };
    const out = hits.map(([n, l]) => flags.has("n") ? `${n}:${l}` : l).join("\n");
    return { out, code: hits.length ? 0 : 1 };
  },

  find(args, stdin, ctx) {
    let start = ".", type = null, size = null, name = null;
    for (let i = 0; i < args.length; i++) {
      const a = args[i];
      if (a === "-type") type = args[++i];
      else if (a === "-size") size = args[++i];
      else if (a === "-name") name = args[++i];
      else if (!a.startsWith("-")) start = a;
    }
    const startNode = ctx.vfs.get(ctx.cwd, start);
    if (!startNode) return { err: `find: '${start}': No such file or directory`, code: 1 };
    const results = [];
    const nameRe = name
      ? new RegExp("^" + name.split("*").map(s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$")
      : null;
    const walk = (node, path) => {
      const base = path.split("/").pop();
      const isDir = node.type === "dir";
      let match = true;
      if (type === "f" && isDir) match = false;
      if (type === "d" && !isDir) match = false;
      if (size && (isDir || !matchSize(node.size, size))) match = false;
      if (nameRe && !nameRe.test(base)) match = false;
      if (match && path !== "") results.push(path);
      if (isDir) for (const [n, c] of Object.entries(node.children).sort()) walk(c, path + "/" + n);
    };
    walk(startNode, start === "." ? "." : start.replace(/\/$/, ""));
    return { out: results.join("\n"), code: 0 };

    function matchSize(bytes, spec) {
      const m = spec.match(/^([+-]?)(\d+)(c?)$/);
      if (!m) return false;
      const n = Number(m[2]);
      const val = m[3] === "c" ? bytes : Math.ceil(bytes / 512);
      if (m[1] === "+") return val > n;
      if (m[1] === "-") return val < n;
      return val === n;
    }
  },

  file(args, stdin, ctx) {
    const { files } = splitFlags(args);
    if (files.length === 0) return { err: "usage: file FILE...", code: 2 };
    const out = [];
    for (const f of files) {
      const node = ctx.vfs.get(ctx.cwd, f);
      if (!node) { out.push(`${f}: cannot open (No such file or directory)`); continue; }
      if (node.type === "dir") out.push(`${f}: directory`);
      else if (node.binary) out.push(`${f}: data`);
      else if (node.archive) out.push(`${f}: gzip compressed data`);
      else out.push(`${f}: ASCII text`);
    }
    return { out: out.join("\n"), code: 0 };
  },

  wc(args, stdin, ctx) {
    const { flags, files } = splitFlags(args);
    const r = input(files, stdin, ctx, "wc");
    if (r.err) return { err: r.err, code: 1 };
    const t = r.text;
    const l = (t.match(/\n/g) || []).length;
    const w = t.split(/\s+/).filter(Boolean).length;
    const c = t.length;
    const label = files[0] ? " " + files[0] : "";
    if (flags.has("l")) return { out: l + label, code: 0 };
    if (flags.has("w")) return { out: w + label, code: 0 };
    if (flags.has("c")) return { out: c + label, code: 0 };
    return { out: `${l} ${w} ${c}${label}`, code: 0 };
  },

  sort(args, stdin, ctx) {
    const { flags, files } = splitFlags(args);
    const r = input(files, stdin, ctx, "sort");
    if (r.err) return { err: r.err, code: 1 };
    let lines = r.text.replace(/\n$/, "").split("\n");
    lines.sort(flags.has("n") ? (a, b) => Number(a) - Number(b) : undefined);
    if (flags.has("r")) lines.reverse();
    return { out: lines.join("\n"), code: 0 };
  },

  uniq(args, stdin, ctx) {
    const { flags, files } = splitFlags(args);
    const r = input(files, stdin, ctx, "uniq");
    if (r.err) return { err: r.err, code: 1 };
    const lines = r.text.replace(/\n$/, "").split("\n");
    const groups = [];
    for (const l of lines) {
      if (groups.length && groups[groups.length - 1][0] === l) groups[groups.length - 1][1]++;
      else groups.push([l, 1]);
    }
    let out;
    if (flags.has("u")) out = groups.filter(([, n]) => n === 1).map(([l]) => l);
    else if (flags.has("d")) out = groups.filter(([, n]) => n > 1).map(([l]) => l);
    else if (flags.has("c")) out = groups.map(([l, n]) => `${String(n).padStart(7)} ${l}`);
    else out = groups.map(([l]) => l);
    return { out: out.join("\n"), code: 0 };
  },

  echo(args, stdin, ctx) {
    let nl = true;
    if (args[0] === "-n") { nl = false; args = args.slice(1); }
    return { out: args.join(" ") + (nl ? "" : ""), code: 0 };
  },

  base64(args, stdin, ctx) {
    const { flags, files } = splitFlags(args);
    const r = input(files, stdin, ctx, "base64");
    if (r.err) return { err: r.err, code: 1 };
    const text = r.text.replace(/\n$/, "");
    try {
      if (flags.has("d")) return { out: atob(text.replace(/\s/g, "")), code: 0 };
      return { out: btoa(text), code: 0 };
    } catch {
      return { err: "base64: invalid input", code: 1 };
    }
  },

  chmod(args, stdin, ctx) {
    const [mode, ...targets] = args.filter(a => a !== "");
    if (!/^\d{3,4}$/.test(mode) || targets.length === 0) {
      return { err: "usage: chmod MODE FILE... (octal modes only, e.g. chmod 600 key)", code: 2 };
    }
    for (const t of targets) {
      const node = ctx.vfs.get(ctx.cwd, t);
      if (!node) return { err: `chmod: cannot access '${t}': No such file or directory`, code: 1 };
      if (node.owner === "root" && !ctx.root) {
        return { err: `chmod: changing permissions of '${t}': Operation not permitted`, code: 1 };
      }
      node.mode = modeFromOctal(mode.slice(-3), node.type === "dir");
      if (ctx.hooks.onChmod) ctx.hooks.onChmod(t, mode, ctx);
    }
    return { out: "", code: 0 };
  },

  tar(args, stdin, ctx) {
    const flags = (args.find(a => a.startsWith("-")) || args[0] || "").replace(/^-/, "");
    const fileArg = args.filter(a => !a.startsWith("-")).find(a => a.includes(".tar"));
    if (!flags.includes("x") || !fileArg) {
      return { err: "usage: tar -xzf ARCHIVE.tar.gz  (this shell only supports extraction)", code: 2 };
    }
    const { node, err } = getFile(ctx, fileArg, "tar");
    if (err) return { err, code: 1 };
    if (!node.archive) return { err: `tar: ${fileArg}: does not look like a tar archive`, code: 2 };
    ctx.vfs.addTree(ctx.cwd, ".", node.archive);
    const listing = flags.includes("v") ? Object.keys(node.archive).join("\n") : "";
    return { out: listing, code: 0 };
  },

  env(args, stdin, ctx) {
    return { out: Object.entries(ctx.env).map(([k, v]) => `${k}=${v}`).join("\n"), code: 0 };
  },

  export(args, stdin, ctx) {
    for (const a of args) {
      const m = a.match(/^(\w+)=(.*)$/);
      if (m) ctx.env[m[1]] = m[2];
    }
    return { out: "", code: 0 };
  },

  which(args, stdin, ctx) {
    const c = args[0];
    if (!c) return { err: "usage: which COMMAND", code: 2 };
    if (COREUTILS[c] || ctx.hooks[c]) return { out: `/usr/bin/${c}`, code: 0 };
    return { err: `which: no ${c} in (${ctx.env.PATH})`, code: 1 };
  },

  history(args, stdin, ctx) {
    const lines = [];
    let n = 1;
    if (ctx.histSeed) for (const [num, cmd] of ctx.histSeed) { lines.push(`  ${String(num).padStart(3)}  ${cmd}`); n = num + 1; }
    for (const cmd of ctx.history) lines.push(`  ${String(n++).padStart(3)}  ${cmd}`);
    return { out: lines.join("\n"), code: 0 };
  },

  hostname(args, stdin, ctx) { return { out: ctx.env.HOSTNAME, code: 0 }; },
  whoami(args, stdin, ctx) { return { out: ctx.root ? "root" : "student", code: 0 }; },
  id(args, stdin, ctx) { return { out: "uid=1000(student) gid=1000(student) groups=1000(student)", code: 0 }; },
  date(args, stdin, ctx) { return { out: new Date().toString(), code: 0 }; },

  clear(args, stdin, ctx) {
    ctx.term.write("\x1b[2J\x1b[H");
    return { out: "", code: 0 };
  },

  man(args, stdin, ctx) {
    const page = MAN[args[0]];
    if (!args[0]) return { err: "What manual page do you want?\nFor example, try 'man man'.", code: 1 };
    if (!page) return { err: `No manual entry for ${args[0]}`, code: 16 };
    return { out: page, code: 0 };
  },

  help() {
    return {
      out: [
        "UWC_HPC simulated shell. Available commands:",
        "",
        "  files:    ls cd pwd cat head tail file find wc",
        "  text:     grep sort uniq echo base64 wc",
        "  system:   env export which history man hostname whoami id date chmod tar clear help",
        "  cluster:  ssh ssh-keygen systemctl journalctl nft chronyc exportfs showmount",
        "            mount dnf sinfo squeue sbatch scontrol lscpu free ip",
        "",
        "Supported syntax: quotes, \\-escapes, $VAR, ~, * glob, pipes (cmd | cmd),",
        "redirection (> and >>). Not supported: $(...), && ; & job control, heredocs.",
        "Tab completes commands and filenames. Up/Down browse history. Ctrl-L clears.",
        "'man <command>' gives a short reference for each command.",
      ].join("\n"),
      code: 0,
    };
  },
};

COREUTILS.less = COREUTILS.cat;
COREUTILS.more = COREUTILS.cat;

function mojibake(node) {
  // deterministic pseudo-binary noise so `cat`ing a binary file looks wrong
  let s = "";
  let x = node.size || 64;
  for (let i = 0; i < 64; i++) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    s += String.fromCharCode(0x2500 + (x % 96));
  }
  return s + "\n";
}

export const MAN = {
  man: "man - reference manuals.\n\nusage: man <command>\n\nShows a short reference page for a command, e.g. 'man grep'.",
  ls: "ls - list directory contents.\n\nusage: ls [-a] [-l] [-n] [FILE]\n\n  -a  include hidden entries (names starting with .)\n  -l  long format: permissions, owner, size, name\n  -n  like -l but numeric user/group IDs\n\nexample: ls -la ~/inhere",
  cd: "cd - change the working directory.\n\nusage: cd [DIR]\n\nWith no argument, returns to your home directory (~).\n'cd ..' moves one directory up.",
  pwd: "pwd - print the current working directory.\n\nexample: pwd",
  cat: "cat - print file contents.\n\nusage: cat FILE...\n\nTip: a file literally named '-' must be given as './-' so it is not\nmistaken for an option.\n\nexample: cat readme",
  head: "head - print the first lines of a file.\n\nusage: head [-n N] FILE\n\nexample: head -n 5 data.txt",
  tail: "tail - print the last lines of a file.\n\nusage: tail [-n N] FILE\n\nexample: journalctl -u slurmd | tail -n 20",
  grep: "grep - print lines matching a pattern.\n\nusage: grep [-i] [-v] [-n] [-c] PATTERN [FILE...]\n\n  -i  ignore case      -v  invert match\n  -n  show line numbers -c  count matches\n\nexample: grep millionth data.txt\nexample: journalctl -u munge | grep -i error",
  find: "find - search for files in a directory tree.\n\nusage: find [DIR] [-type f|d] [-name PATTERN] [-size N[c]]\n\n  -size 1033c  exactly 1033 bytes ('c' = bytes)\n\nexample: find inhere -type f -size 1033c",
  file: "file - determine file type (text, data, archive...).\n\nusage: file FILE...\n\nexample: file inhere/*",
  wc: "wc - count lines, words and bytes.\n\nusage: wc [-l|-w|-c] [FILE]\n\nexample: wc -l data.txt",
  sort: "sort - sort lines of text.\n\nusage: sort [-n] [-r] [FILE]\n\nexample: sort data.txt | uniq -u",
  uniq: "uniq - filter ADJACENT duplicate lines (sort first!).\n\nusage: uniq [-u|-d|-c] [FILE]\n\n  -u  only lines that appear exactly once\n  -d  only duplicated lines\n  -c  prefix each line with its count\n\nexample: sort data.txt | uniq -u",
  echo: "echo - print its arguments.\n\nusage: echo [-n] TEXT\n\nAlso expands variables: echo $HOME\nexample: echo hello > notes.txt",
  base64: "base64 - encode/decode base64.\n\nusage: base64 [-d] [FILE]\n\n  -d  decode\n\nexample: base64 -d data.txt",
  chmod: "chmod - change file permissions (octal form).\n\nusage: chmod MODE FILE\n\n  600 = rw for owner only (private keys!)\n  400 = read-only for owner (munge keys!)\n\nexample: chmod 600 ~/.ssh/id_ed25519",
  tar: "tar - archive tool (extraction only in this shell).\n\nusage: tar -xzf ARCHIVE.tar.gz\n\n  x extract, z gzip, f file, add v for verbose\n\nexample: tar -xvzf hpl-2.3.tar.gz",
  env: "env - print all environment variables.\n\nexample: env | grep PASS",
  export: "export - set an environment variable.\n\nusage: export NAME=value\n\nexample: export OMP_NUM_THREADS=4",
  which: "which - locate a command on PATH.\n\nusage: which COMMAND\n\nexample: which mpicc",
  history: "history - show previously executed commands.\n\n'!N' re-runs command number N from the history.\n\nexample: history | grep ssh",
  ssh: "ssh - OpenSSH remote login client.\n\nusage: ssh [user@]host [command]\n\nKey-based auth requires your private key to be readable by you alone\n(chmod 600). See also ssh-keygen.\n\nexample: ssh compute1",
  "ssh-keygen": "ssh-keygen - generate an SSH key pair.\n\nusage: ssh-keygen -t ed25519\n\nCreates ~/.ssh/id_ed25519 (PRIVATE - chmod 600) and\n~/.ssh/id_ed25519.pub (public - goes into authorized_keys).",
  systemctl: "systemctl - control and inspect systemd services.\n\nusage: systemctl status <unit>\n       systemctl list-units --failed\n\nStates: active (running), inactive (dead), failed.\n\nexample: systemctl status chronyd",
  journalctl: "journalctl - query the systemd journal (service logs).\n\nusage: journalctl -u <unit>\n\nPipe into grep to find errors:\n\nexample: journalctl -u slurmd | grep -i fatal",
  nft: "nft - inspect the nftables firewall.\n\nusage: nft list ruleset\n\nRead rules top to bottom; 'ct state established,related accept'\nallows replies, 'policy drop' rejects everything not accepted.",
  chronyc: "chronyc - query the chrony NTP daemon.\n\nusage: chronyc tracking   (am I synchronised? to whom? stratum?)\n       chronyc sources    (which servers am I polling?)\n\nStratum 0/'Not synchronised' means the clock is free-running.",
  exportfs: "exportfs - show the NFS exports of this server.\n\nusage: exportfs -v\n\nAlso see /etc/exports. Beware 'no_root_squash': it lets remote\nroot act as root on the shared filesystem.",
  showmount: "showmount - show mounts/exports of an NFS server.\n\nusage: showmount -e <server>\n\nexample: showmount -e headnode",
  mount: "mount - show mounted filesystems.\n\nusage: mount | grep nfs",
  dnf: "dnf - Rocky Linux package manager.\n\nusage: dnf search <term>\n       dnf provides <file-or-command>\n       dnf install <package>   (needs sudo on real systems)\n\nexample: dnf provides mpicc",
  sinfo: "sinfo - show Slurm partitions and node states.\n\nStates: idle (free), alloc (busy), down/drain (problem).\n\nexample: sinfo",
  squeue: "squeue - show the Slurm job queue.\n\nStates: PD pending, R running, CG completing.\n\nexample: squeue",
  sbatch: "sbatch - submit a batch script to Slurm.\n\nusage: sbatch SCRIPT\n\nOutput lands in slurm-<jobid>.out in the submission directory.\n\nexample: sbatch hello.batch",
  scontrol: "scontrol - view Slurm configuration and job details.\n\nusage: scontrol show job <id>\n       scontrol show node <name>",
  lscpu: "lscpu - CPU architecture info (cores, sockets, GHz, flags).\n\nAVX2 = 16 double-precision FLOPs/cycle, AVX-512 = 32.\n\nexample: lscpu",
  free: "free - memory usage.\n\nusage: free -g   (in GiB)\n\nexample: free -g",
  ip: "ip - show network interfaces and addresses.\n\nusage: ip a\n\nexample: ip a | grep inet",
  hostname: "hostname - print the system's host name.",
  whoami: "whoami - print your user name.",
  clear: "clear - clear the terminal (or press Ctrl-L).",
  help: "help - list available commands and shell syntax.",
};
