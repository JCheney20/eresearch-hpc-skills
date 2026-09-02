// The learner-visible curriculum for the initial content release.
//
// This module is data only: topic order, stable challenge identities and the
// explicit prerequisite graph. Challenge prose and worlds still come through
// the compatibility registry in challenges/index.js while they are migrated.

export const CONTENT_RELEASE = {
  releaseId: "initial",
  topics: [
    {
      key: "core",
      name: "Core",
      blurb: "From what a prompt is to logging in to the cluster.",
      challenges: [
        { number: "000", revision: "001", id: "000001", kind: "reading", slug: "what-is-a-terminal", title: "What you are looking at", commands: [], prerequisiteGroups: [] },
        { number: "001", revision: "001", id: "001001", kind: "interactive", slug: "where-am-i", title: "Where am I", commands: ["pwd", "ls"], prerequisiteGroups: [{ mode: "all", sources: ["000"] }] },
        { number: "002", revision: "001", id: "002001", kind: "interactive", slug: "moving-around", title: "Moving around", commands: ["cd"], prerequisiteGroups: [{ mode: "all", sources: ["001"] }] },
        { number: "003", revision: "001", id: "003001", kind: "interactive", slug: "same-command-more-questions", title: "Same command, more questions", commands: ["ls -l", "ll"], prerequisiteGroups: [{ mode: "all", sources: ["002"] }] },
        { number: "004", revision: "001", id: "004001", kind: "interactive", slug: "ask-the-machine", title: "Ask the machine", commands: ["man", "tldr"], prerequisiteGroups: [{ mode: "all", sources: ["003"] }] },
        { number: "005", revision: "001", id: "005001", kind: "interactive", slug: "reading-files", title: "Reading files", commands: ["cat", "head", "tail"], prerequisiteGroups: [{ mode: "all", sources: ["004"] }] },
        { number: "006", revision: "001", id: "006001", kind: "interactive", slug: "finding-the-line", title: "Finding the line", commands: ["grep"], prerequisiteGroups: [{ mode: "all", sources: ["005"] }] },
        { number: "007", revision: "001", id: "007001", kind: "interactive", slug: "finding-the-file", title: "Finding the file", commands: ["grep -r"], prerequisiteGroups: [{ mode: "all", sources: ["006"] }] },
        { number: "008", revision: "001", id: "008001", kind: "interactive", slug: "getting-on-the-cluster", title: "Getting on the cluster", commands: ["ssh"], prerequisiteGroups: [{ mode: "all", sources: ["007"] }] },
      ],
    },
    {
      key: "transfer",
      name: "Moving files",
      blurb: "Copying a result off the cluster, and finishing a copy that keeps dropping.",
      challenges: [
        {
          number: "009", revision: "001", id: "009001", kind: "interactive", slug: "bringing-files-back", title: "Bringing files back", commands: ["scp"],
          line: "Which direction does a copy go, and what does a remote path look like?",
          prerequisiteGroups: [{ mode: "all", sources: ["008"] }],
        },
        {
          number: "00A", revision: "001", id: "00A001", kind: "interactive", slug: "when-the-link-drops", title: "When the link drops", commands: ["rsync"],
          line: "How do you finish a copy over a link that keeps dropping?",
          prerequisiteGroups: [{ mode: "all", sources: ["009"] }],
        },
      ],
    },
    {
      key: "git",
      name: "Keeping a record",
      blurb: "Reading what changed, saving your work in steps, and picking up someone else's.",
      challenges: [
        {
          number: "00B", revision: "001", id: "00B001", kind: "interactive", slug: "what-changed", title: "What changed", commands: ["git status", "git log"],
          line: "What changed in this project, and when?",
          prerequisiteGroups: [{ mode: "all", sources: ["008"] }],
        },
        {
          number: "00C", revision: "001", id: "00C001", kind: "interactive", slug: "saving-your-work", title: "Saving your work", commands: ["git add", "git commit"],
          line: "How do you save your work in steps?",
          prerequisiteGroups: [{ mode: "all", sources: ["00B"] }],
        },
        {
          number: "00D", revision: "001", id: "00D001", kind: "interactive", slug: "getting-the-latest", title: "Getting the latest", commands: ["git clone", "git pull"],
          line: "How does someone else's work get onto your machine?",
          prerequisiteGroups: [{ mode: "all", sources: ["00C"] }],
        },
      ],
    },
    {
      key: "cluster",
      name: "Running work",
      blurb: "Checking what is free, reading the queue, sending a job, and watching it move.",
      challenges: [
        {
          number: "00E", revision: "001", id: "00E001", kind: "interactive", slug: "is-there-room", title: "Is there room", commands: ["df -h", "free -h"],
          line: "Is there disk space, and is there memory?",
          prerequisiteGroups: [{ mode: "all", sources: ["008"] }],
        },
        {
          number: "00F", revision: "001", id: "00F001", kind: "interactive", slug: "whats-running", title: "What is running", commands: ["sinfo", "squeue"],
          line: "What is running on the cluster, and what is waiting?",
          prerequisiteGroups: [{ mode: "all", sources: ["00E"] }],
        },
        {
          number: "010", revision: "001", id: "010001", kind: "interactive", slug: "submitting-a-job", title: "Submitting a job", commands: ["sbatch"],
          line: "How do you send a job to the queue, and where does its output go?",
          prerequisiteGroups: [{ mode: "all", sources: ["00F"] }],
        },
        {
          number: "011", revision: "001", id: "011001", kind: "interactive", slug: "watching-it-change", title: "Watching it change", commands: ["watch"],
          line: "How do you watch something change without retyping the command?",
          prerequisiteGroups: [{ mode: "all", sources: ["010"] }],
        },
      ],
    },
    {
      key: "finale",
      name: "Putting it together",
      blurb: "One task that crosses all three routes.",
      challenges: [
        {
          number: "012", revision: "001", id: "012001", kind: "interactive", slug: "putting-it-together", title: "Putting it together", commands: [],
          line: "Find something in an output file, check the queue, and bring a result back.",
          waitsText: "Waits for <strong>all three routes</strong>.",
          note: "This is also where the trainer points you at signing up for a real cluster account.",
          prerequisiteGroups: [{ mode: "all", sources: ["00A", "00D", "011"] }],
        },
      ],
    },
  ],
};
