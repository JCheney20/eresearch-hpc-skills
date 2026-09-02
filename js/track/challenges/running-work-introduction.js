// Reading introduction for the Running work topic.

export default {
  num: 21,
  slug: "running-work-introduction",
  title: "What an HPC cluster is",
  kind: "reading",
  commands: [],
  teaches: ["cluster", "login node", "compute node", "scheduler", "job"],
  variants: [{ i: 0 }],

  lede: `A high-performance computing cluster is a group of shared computers.
    You log in to one place, ask for resources, and let a scheduler choose where
    and when the work runs.`,

  cards: [
    {
      title: "One service, many computers",
      html: `<p>The cluster has a <strong>login node</strong> where you connect,
        organise files, and prepare work. The large calculations run on
        <strong>compute nodes</strong>, which provide the processors and memory.</p>
        <p>The login node is a front desk, not a workbench for heavy computation.
        Keeping large work off it leaves the cluster responsive for everyone.</p>`,
    },
    {
      title: "The scheduler shares the machine",
      html: `<p>You describe a piece of work as a <strong>job</strong>: the command
        to run, the time it may need, and resources such as processors or
        memory.</p>
        <p>The scheduler places that request in a queue. It starts the job on
        suitable compute nodes when those resources are available.</p>`,
    },
    {
      title: "Your files stay in one place",
      html: `<p>Your project files live on shared storage that the login and
        compute nodes can reach. A submitted job reads its inputs there and
        writes its output there.</p>
        <p>This topic first shows you how to inspect the cluster, then how to
        submit and watch a job.</p>`,
    },
  ],

  footnote: `Reading this introduction opens the first cluster-work challenge.`,
};
