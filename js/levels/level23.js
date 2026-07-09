import { DATA } from "./gen-data.js";

export default {
  n: 23,
  title: "P×Q and the theoretical peak",
  commands: ["lscpu", "cat", "sinfo"],
  reading: [
    { label: "Docs: process grids and RPeak", url: "#/docs/hpl" },
    { label: "lscpu(1)", url: "https://man7.org/linux/man-pages/man1/lscpu.1.html" },
  ],
  variants: DATA.grid.map(g => ({ ...g })),
  build(v) {
    return {
      goal: `<p>Two last pieces of HPL theory, from Tutorial 3.</p>
        <p><strong>1. The process grid.</strong> HPL arranges its MPI ranks in a P×Q grid
        with <code>P × Q = total ranks</code>. Communication is happiest when the grid is
        <em>as close to square as possible</em>, with <strong>P ≤ Q</strong>. Your job runs
        with <code>--ntasks=${v.ranks}</code> (see <code>cat hpl.batch</code>): find the
        factor pair of ${v.ranks} that is closest to square with P ≤ Q.</p>
        <p><strong>2. RPeak</strong>, the theoretical peak of one node in GFLOP/s:</p>
        <pre>RPeak = cores × GHz × FLOPs-per-cycle</pre>
        <p>Run <code>lscpu</code>: it shows the core count and the clock in MHz, and the
        <code>avx2</code> + <code>fma</code> flags mean this CPU retires
        <strong>16</strong> double-precision FLOPs per cycle.</p>
        <p><strong>The password is </strong><code>PxQ-RPeak</code> — grid then per-node
        RPeak as an integer, e.g. a 2×4 grid on a 160 GFLOP/s node is
        <code>2x4-160</code>.</p>`,
      fs: {
        "/home/student": {
          "hpl.batch": { c: `#!/usr/bin/env bash\n#SBATCH --job-name=hpl\n#SBATCH --ntasks=${v.ranks}\n#SBATCH --ntasks-per-node=${v.ranks / 2}\n#SBATCH --nodes=2\nsrun --mpi=pmix xhpl\n` },
          "HPL.dat": { c: `(see level 22 - this level is about Ps, Qs and RPeak)\n?            Ps\n?            Qs\n` },
        },
      },
      canned: {
        "lscpu": `Architecture:            x86_64\n  CPU op-mode(s):        32-bit, 64-bit\nCPU(s):                  ${v.cores}\n  On-line CPU(s) list:   0-${v.cores - 1}\nModel name:              Intel Xeon (Cascade Lake)\n  Thread(s) per core:    1\n  Core(s) per socket:    ${v.cores}\n  Socket(s):             1\n  CPU max MHz:           ${(v.ghz * 1000).toFixed(4)}\nFlags:                   fpu vme de pse tsc msr pae mce sse sse2 ssse3 fma sse4_1 sse4_2 avx avx2`,
        "sinfo": `PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST\nbatch*       up   infinite      2   idle compute[1-2]`,
      },
    };
  },
};
