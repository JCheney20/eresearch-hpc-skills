import { DATA } from "./gen-data.js";

const HPL_DAT = (nb) => `HPLinpack benchmark input file
Innovative Computing Laboratory, University of Tennessee
HPL.out      output file name (if any)
6            device out (6=stdout,7=stderr,file)
1            # of problems sizes (N)
?????        Ns          <-- YOU compute this
1            # of NBs
${nb}          NBs
0            PMAP process mapping (0=Row-,1=Column-major)
1            # of process grids (P x Q)
2            Ps
4            Qs
16.0         threshold
1            # of panel fact
2            PFACTs (0=left, 1=Crout, 2=Right)
1            # of recursive stopping criterium
4            NBMINs (>= 1)
1            # of panels in recursion
2            NDIVs
1            # of recursive panel fact.
1            RFACTs (0=left, 1=Crout, 2=Right)
1            # of broadcast
1            BCASTs (0=1rg,1=1rM,2=2rg,3=2rM,4=Lng,5=LnM)
1            # of lookahead depth
1            DEPTHs (>=0)
2            SWAP (0=bin-exch,1=long,2=mix)
64           swapping threshold
0            L1 in (0=transposed,1=no-transposed) form
0            U  in (0=transposed,1=no-transposed) form
1            Equilibration (0=no,1=yes)
8            memory alignment in double (> 0)
`;

export default {
  n: 22,
  title: "Tune HPL.dat: the problem size N",
  commands: ["cat", "free", "sinfo", "man"],
  reading: [
    { label: "Docs: HPL and HPL.dat", url: "#/docs/hpl" },
    { label: "HPL tuning FAQ (netlib)", url: "https://netlib.org/benchmark/hpl/tuning.html" },
  ],
  variants: DATA.hpl.map(h => ({ pass: String(h.n), ...h })),
  build(v) {
    const memTotalGiB = v.nodes * v.mem;
    return {
      goal: `<p><strong>HPL</strong> (High-Performance Linpack) is <em>the</em> cluster
        benchmark — it solves a huge N×N system of equations, and its <code>HPL.dat</code>
        input file decides almost everything about the score. The single most important
        knob is <strong>N</strong>, the problem size: too small wastes the machine, too
        big swaps to disk and dies.</p>
        <p>The rule of thumb from the tutorials: fill about <strong>80% of total RAM</strong>
        with the N×N matrix of 8-byte doubles:</p>
        <pre>N ≈ sqrt( 0.8 × total_mem_bytes / 8 )</pre>
        <p>Then round <strong>down</strong> to a multiple of the block size NB (matrices are
        processed in NB×NB blocks). Your cluster: <strong>${v.nodes} nodes ×
        ${v.mem} GiB each</strong> (verify with <code>sinfo</code> and <code>free -g</code>;
        1 GiB = 2<sup>30</sup> bytes = 1073741824 bytes). NB is in <code>HPL.dat</code>.</p>
        <p>So: total_mem_bytes = ${v.nodes} × ${v.mem} × 2<sup>30</sup>. Take the square
        root of (0.8 × that ÷ 8), then round down to a multiple of ${v.nb}.
        <strong>The password is N — digits only.</strong></p>`,
      fs: {
        "/home/student": {
          "HPL.dat": { c: HPL_DAT(v.nb) },
          "hpl.batch": { c: `#!/usr/bin/env bash\n#SBATCH --job-name=hpl\n#SBATCH --nodes=${v.nodes}\n#SBATCH --ntasks=8\n#SBATCH --ntasks-per-node=${8 / v.nodes >= 1 ? 8 / v.nodes : 4}\nsrun --mpi=pmix xhpl\n` },
        },
      },
      canned: {
        "sinfo": `PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST\nbatch*       up   infinite      ${v.nodes}   idle compute[1-${v.nodes}]`,
        "free -g": `              total        used        free      shared\nMem:            ${v.mem}           0           ${v.mem - 1}           0\nSwap:           0           0           0`,
        "free": `              total        used        free\nMem:        ${v.mem * 1048576}      204800     ${v.mem * 1048576 - 204800}`,
      },
    };
  },
};
