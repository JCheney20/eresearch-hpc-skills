import { PW } from "./gen-data.js";

export default {
  n: 21,
  title: "Your first Slurm job",
  commands: ["sinfo", "sbatch", "squeue", "cat", "ls"],
  reading: [
    { label: "Docs: the Slurm lifecycle", url: "#/docs/slurm" },
    { label: "sbatch — batch script anatomy", url: "#/docs/slurm" },
  ],
  variants: PW[21].map((pass, i) => ({ pass, jobid: 1000 + i * 77 })),
  build(v) {
    return {
      goal: `<p>Everything you fixed in the last seven levels existed for this moment:
        submitting work to the <strong>Slurm scheduler</strong>. You never run MPI programs
        by hand on a cluster — you describe the job in a batch script and Slurm decides
        where and when it runs.</p>
        <p>The routine, forever: check the cluster with <code>sinfo</code> (are the nodes
        <code>idle</code>?), read the script (<code>cat hello.batch</code> — note the
        <code>#SBATCH</code> directives), submit it with <code>sbatch hello.batch</code>,
        watch it with <code>squeue</code>, and finally read the output file it leaves
        behind: <code>slurm-&lt;jobid&gt;.out</code>. The password is in the job's
        output.</p>`,
      fs: {
        "/home/student": {
          "hello.batch": { c: `#!/usr/bin/env bash\n#SBATCH --job-name=hello\n#SBATCH --nodes=2\n#SBATCH --ntasks=2\n#SBATCH --ntasks-per-node=1\n#SBATCH --time=00:01:00\n\nsrun hostname\nsrun echo "credential for the next level: (printed by the job)"\n` },
        },
      },
      canned: {
        "sinfo": `PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST\nbatch*       up   infinite      2   idle compute[1-2]`,
        "squeue": `             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)`,
        [`scontrol show job ${v.jobid}`]: `JobId=${v.jobid} JobName=hello\n   UserId=student(1000) GroupId=student(1000)\n   JobState=COMPLETED ExitCode=0:0\n   NumNodes=2 NumTasks=2\n   StdOut=/home/student/slurm-${v.jobid}.out`,
      },
      hooks: {
        sbatch(args, stdin, ctx) {
          const script = args.find(a => !a.startsWith("-"));
          if (script !== "hello.batch" && script !== "./hello.batch") {
            return { out: "", err: `sbatch: error: Unable to open file ${script || ""}`, code: 1 };
          }
          if (!ctx.state.submitted) {
            ctx.state.submitted = true;
            ctx.vfs.write("/home/student", `slurm-${v.jobid}.out`,
              `compute1\ncompute2\ncredential for the next level: ${v.pass}\n`, false);
          }
          return { out: `Submitted batch job ${v.jobid}`, code: 0 };
        },
        squeue(args, stdin, ctx) {
          if (ctx.state.submitted && !ctx.state.polled) {
            ctx.state.polled = true;
            return { out: `             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)\n              ${v.jobid}     batch    hello  student  R       0:01      2 compute[1-2]`, code: 0 };
          }
          return undefined; // second look: queue is empty, job finished
        },
      },
    };
  },
};
