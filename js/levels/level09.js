import { PW } from "./gen-data.js";

const VARS = ["CLUSTER_KEY", "LEVEL10_PASS", "HPC_SECRET", "UWC_TOKEN",
  "NODE_SECRET", "BENCH_KEY", "SLURM_HINT", "ADMIN_NOTE",
  "STAGE_PASS", "GATE_TOKEN", "NEXT_LEVEL", "MY_SECRET"];

export default {
  n: 9,
  title: "The environment",
  commands: ["env", "echo", "grep", "export", "which"],
  reading: [
    { label: "Docs: PATH and the environment", url: "#/docs/linux" },
    { label: "environ(7) — the environment", url: "https://man7.org/linux/man-pages/man7/environ.7.html" },
  ],
  variants: PW[9].map((pass, i) => ({ pass, name: VARS[i] })),
  build(v) {
    return {
      goal: `<p>Programs inherit a set of <strong>environment variables</strong> — small
        named values like <code>HOME</code>, <code>USER</code> and, crucially for HPC,
        <code>PATH</code>: the list of directories the shell searches for commands. When
        a freshly built <code>mpicc</code> "doesn't exist", it is usually a PATH problem
        (<code>which mpicc</code> tells you what the shell actually found).</p>
        <p>The password for the next level is sitting in an environment variable named
        <code>${v.name}</code>. Print a single variable with
        <code>echo $${v.name}</code>, or dump everything with <code>env</code> and filter
        it through the <code>grep</code> you learned in Level 6.</p>`,
      fs: {
        "/home/student": { ".bashrc": { c: `# .bashrc\nexport PATH=$PATH:$HOME/opt/openblas/bin\nexport ${v.name}=... # value set at login\n` } },
      },
      env: { [v.name]: v.pass },
    };
  },
};
