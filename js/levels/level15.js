import { PW } from "./gen-data.js";
import { prng } from "./util.js";

export default {
  n: 15,
  title: "Read the logs like you mean it",
  commands: ["journalctl", "grep", "tail", "systemctl"],
  reading: [
    { label: "Docs: systemd triage", url: "#/docs/systemd" },
    { label: "Docs: Slurm", url: "#/docs/slurm" },
  ],
  variants: PW[15].map((pass, i) => ({ pass, i })),
  build(v) {
    const rng = prng(1500 + v.i);
    const t = m => `Jul 08 06:${String(10 + m).padStart(2, "0")}:${String(Math.floor(rng() * 60)).padStart(2, "0")}`;
    const noise = [];
    for (let k = 0; k < 45; k++) {
      noise.push(`${t(k % 9)} uwc-hpc slurmd[1873]: debug:  ${[
        "topology/none: init", "route/default: init", "task/affinity: init",
        "Gres GPU plugin loaded", "cgroup/v2: init", "acct_gather_energy/none: init",
        "mpi/pmix: init", "auth/munge: init", "jobacct_gather/cgroup: init",
      ][k % 9]}`);
    }
    const log = [
      `${t(0)} uwc-hpc systemd[1]: Starting Slurm node daemon...`,
      ...noise.slice(0, 20),
      `${t(5)} uwc-hpc slurmd[1873]: slurmd version 24.05.2 started`,
      ...noise.slice(20, 38),
      `${t(8)} uwc-hpc slurmd[1873]: fatal: Unable to determine this slurmd's NodeName`,
      `${t(8)} uwc-hpc slurmd[1873]: error: check NodeName= entries in /etc/slurm/slurm.conf (incident ${v.pass})`,
      `${t(8)} uwc-hpc systemd[1]: slurmd.service: Main process exited, code=exited, status=1/FAILURE`,
      `${t(8)} uwc-hpc systemd[1]: slurmd.service: Failed with result 'exit-code'.`,
    ].join("\n");
    return {
      goal: `<p>The Slurm node daemon <code>slurmd</code> died at boot, and this time the
        status summary is not enough — you need the full journal. <code>journalctl -u
        slurmd</code> replays every log line the unit ever wrote.</p>
        <p>Most of it is harmless <code>debug:</code> chatter. You are hunting the line
        that starts with <code>fatal:</code> — the daemon's dying words — and the hint the
        line after it carries. Don't scroll; <em>filter</em>, like Level 6:</p>
        <pre>journalctl -u slurmd | grep -i fatal
journalctl -u slurmd | tail -n 5</pre>`,
      fs: {
        "/etc/slurm": { "slurm.conf": { c: `ClusterName=uwc\nSlurmctldHost=headnode\nMpiDefault=pmix\n# NodeName entry missing - that's this level's bug\nPartitionName=batch Nodes=ALL Default=YES\n` } },
      },
      canned: {
        "journalctl -u slurmd": log,
        "journalctl -u slurmd.service": log,
        "systemctl status slurmd": {
          out: `× slurmd.service - Slurm node daemon\n     Active: failed (Result: exit-code)\n\nJul 08 slurmd[1873]: fatal: Unable to determine this slurmd's NodeName\n(older lines truncated - use journalctl -u slurmd for the full log)`,
          code: 3,
        },
      },
    };
  },
};
