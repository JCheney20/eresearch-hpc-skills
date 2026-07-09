import { PW } from "./gen-data.js";
import { prng, pick } from "./util.js";

const SLOTS = [42, 17, 23, 31, 58, 12, 47, 29, 36, 51, 19, 44];

const FILLER = [
  "ls -la", "cd /etc", "cat /etc/os-release", "ip a", "ping -c1 compute1",
  "ssh compute1", "man tar", "df -h", "free -g", "top", "history",
  "sudo dnf update", "vim HPL.dat", "mpirun -np 4 ./xhpl", "cd ~",
  "grep -i error build.log", "tar -xzf hpl-2.3.tar.gz", "make arch=Linux",
  "which mpicc", "echo $PATH", "systemctl status sshd", "journalctl -u sshd",
  "cat /proc/cpuinfo", "lscpu", "hostname", "uptime", "w", "exit",
];

export default {
  n: 10,
  title: "history repeats itself",
  commands: ["history", "grep", "man"],
  reading: [{ label: "history — and the !N shortcut", url: "#/cheatsheet" }],
  variants: PW[10].map((pass, i) => ({ pass, slot: SLOTS[i], i })),
  build(v) {
    const rng = prng(1000 + v.i);
    const hist = [];
    for (let k = 1; k <= 60; k++) {
      if (k === v.slot) hist.push([k, `echo ${v.pass}`]);
      else hist.push([k, pick(rng, FILLER)]);
    }
    return {
      goal: `<p>A previous administrator once <em>typed the password into their shell</em> —
        and the shell remembers. Every command you run is recorded, and the
        <code>history</code> command plays the record back.</p>
        <p>Somewhere around command number <strong>${v.slot}</strong> the admin ran an
        <code>echo</code> with the password. Scroll through <code>history</code>, filter
        it (<code>history | grep echo</code>), or re-run that exact entry with the bash
        shortcut <code>!${v.slot}</code>.</p>
        <p class="dim">Real lesson: never put secrets on a command line — they end up in
        <code>~/.bash_history</code> for anyone to read.</p>`,
      fs: {
        "/home/student": { ".bash_history": { c: hist.map(([, c]) => c).join("\n") + "\n" } },
      },
      histSeed: hist,
    };
  },
};
