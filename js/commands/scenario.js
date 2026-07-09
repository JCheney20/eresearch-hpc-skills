// Cluster/scenario commands. Output comes from the level's `canned` table:
// the normalized command line is looked up as a key ("systemctl status chronyd"),
// falling back to sensible defaults so wrong invocations fail like real tools.

function lookup(ctx, cmd, args) {
  const key = [cmd, ...args].join(" ").replace(/\s+/g, " ").trim();
  const canned = ctx.canned || {};
  if (key in canned) return normalize(canned[key]);
  // prefix fallback: "systemctl status *" style keys
  for (const [k, v] of Object.entries(canned)) {
    if (k.endsWith(" *") && key.startsWith(k.slice(0, -1))) return normalize(v);
  }
  return null;
}

function normalize(v) {
  if (typeof v === "string") return { out: v, code: 0 };
  return { out: v.out || "", err: v.err || "", code: v.code || 0 };
}

function cannedOr(ctx, cmd, args, fallback) {
  return lookup(ctx, cmd, args) || fallback();
}

export const SCENARIO = {
  systemctl(args, stdin, ctx) {
    return cannedOr(ctx, "systemctl", args, () => {
      if (args[0] === "status" && args[1]) return { out: "", err: `Unit ${args[1]}.service could not be found.`, code: 4 };
      if (args[0] === "status" || args.length === 0) return { out: "● uwc-hpc\n    State: running\n    Units: 214 loaded", code: 0 };
      if (["start", "stop", "restart", "enable", "disable"].includes(args[0])) {
        return { out: "", err: `Failed to ${args[0]} ${args[1] || "unit"}.service: Access denied (run systemctl status instead - this shell is read-only)`, code: 1 };
      }
      return { out: "", err: "systemctl: try 'systemctl status <unit>' or 'systemctl list-units --failed'", code: 1 };
    });
  },

  journalctl(args, stdin, ctx) {
    return cannedOr(ctx, "journalctl", args, () => {
      if (args[0] === "-u" && args[1]) return { out: "-- No entries --", code: 0 };
      return { out: "", err: "journalctl: use 'journalctl -u <unit>' on this system", code: 1 };
    });
  },

  nft(args, stdin, ctx) {
    return cannedOr(ctx, "nft", args, () =>
      ({ out: "", err: "nft: try 'nft list ruleset'", code: 1 }));
  },

  chronyc(args, stdin, ctx) {
    return cannedOr(ctx, "chronyc", args, () =>
      ({ out: "", err: "chronyc: try 'chronyc tracking' or 'chronyc sources'", code: 1 }));
  },

  exportfs(args, stdin, ctx) {
    return cannedOr(ctx, "exportfs", args, () =>
      ({ out: "", err: "exportfs: try 'exportfs -v'", code: 1 }));
  },

  showmount(args, stdin, ctx) {
    return cannedOr(ctx, "showmount", args, () =>
      ({ out: "", err: "showmount: try 'showmount -e <server>'", code: 1 }));
  },

  mount(args, stdin, ctx) {
    return cannedOr(ctx, "mount", args, () =>
      ({ out: "proc on /proc type proc (rw,nosuid,nodev,noexec)\n/dev/vda1 on / type xfs (rw,relatime)", code: 0 }));
  },

  dnf(args, stdin, ctx) {
    return cannedOr(ctx, "dnf", args, () => {
      if (args[0] === "install") return { out: "", err: "Error: This command has to be run with superuser privileges (use sudo dnf install ...)", code: 1 };
      if (args[0] === "search") return { out: `No matches found for: ${args.slice(1).join(" ")}`, code: 1 };
      if (args[0] === "provides") return { out: `Error: No matches found for: ${args.slice(1).join(" ")}`, code: 1 };
      return { out: "", err: "dnf: try 'dnf search <term>', 'dnf provides <cmd>' or 'sudo dnf install <pkg>'", code: 1 };
    });
  },

  sinfo(args, stdin, ctx) {
    return cannedOr(ctx, "sinfo", args, () =>
      ({ out: "", err: "sinfo: Unable to contact slurm controller (connect failure)", code: 1 }));
  },

  squeue(args, stdin, ctx) {
    return cannedOr(ctx, "squeue", args, () =>
      ({ out: "JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)", code: 0 }));
  },

  sbatch(args, stdin, ctx) {
    return cannedOr(ctx, "sbatch", args, () =>
      ({ out: "", err: `sbatch: error: Unable to open file ${args[0] || ""}`, code: 1 }));
  },

  scontrol(args, stdin, ctx) {
    return cannedOr(ctx, "scontrol", args, () =>
      ({ out: "", err: "scontrol: try 'scontrol show job <id>'", code: 1 }));
  },

  lscpu(args, stdin, ctx) {
    return cannedOr(ctx, "lscpu", args, () =>
      ({ out: "Architecture:        x86_64\nCPU(s):              4\nModel name:          QEMU Virtual CPU\nCPU MHz:             2500.000", code: 0 }));
  },

  free(args, stdin, ctx) {
    return cannedOr(ctx, "free", args, () =>
      ({ out: "              total        used        free\nMem:        4194304      812340     3381964", code: 0 }));
  },

  ip(args, stdin, ctx) {
    return cannedOr(ctx, "ip", args, () =>
      ({ out: "1: lo: <LOOPBACK,UP> inet 127.0.0.1/8\n2: eth0: <BROADCAST,UP> inet 10.100.50.10/24", code: 0 }));
  },

  ssh(args, stdin, ctx) {
    return cannedOr(ctx, "ssh", args, () => {
      const host = args.find(a => !a.startsWith("-"));
      return { out: "", err: `ssh: connect to host ${host || "?"} port 22: No route to host`, code: 255 };
    });
  },

  "ssh-keygen"(args, stdin, ctx) {
    return cannedOr(ctx, "ssh-keygen", args, () =>
      ({ out: "", err: "usage: ssh-keygen -t ed25519", code: 1 }));
  },

  ping(args, stdin, ctx) {
    return cannedOr(ctx, "ping", args, () => {
      const host = args.find(a => !a.startsWith("-"));
      return { out: `PING ${host} 56(84) bytes of data.\n64 bytes from ${host}: icmp_seq=1 ttl=64 time=0.31 ms\n--- ${host} ping statistics ---\n1 packets transmitted, 1 received, 0% packet loss`, code: 0 };
    });
  },

  munge(args, stdin, ctx) {
    return cannedOr(ctx, "munge", args, () =>
      ({ out: "", err: "munge: try 'munge -n' to create a test credential", code: 1 }));
  },

  unmunge(args, stdin, ctx) {
    return cannedOr(ctx, "unmunge", args, () =>
      ({ out: "", err: "usage: unmunge (pipe a munge credential into it)", code: 1 }));
  },
};
