// The curriculum as five topics, and the rules for what opens when.
//
// One list, read by everything that needs to know where a challenge sits: the
// map screen's bubbles, the topbar's pips, the shell prompt, and the unlock
// check. A challenge belongs to exactly one topic, and its position inside
// that topic — not its position in all nineteen — is what the learner is
// shown. Its number, though, is its own and never changes: challenge 0 is
// challenge 0 on every screen it appears on.
//
// `requires` is the concept graph, expressed as slugs. A challenge opens when
// everything it requires is solved. The core is a chain; each route head waits
// on the end of the core; the finale waits on the end of all three routes.

export const TOPICS = [
  {
    key: "core",
    name: "Core",
    blurb: "From what a prompt is to logging in to the cluster.",
    nodes: [
      { num: 0, slug: "what-is-a-terminal", title: "What you are looking at", commands: [] },
      { num: 1, slug: "where-am-i", title: "Where am I", commands: ["pwd", "ls"] },
      { num: 2, slug: "moving-around", title: "Moving around", commands: ["cd"] },
      { num: 3, slug: "same-command-more-questions", title: "Same command, more questions", commands: ["ls -l", "ll"] },
      { num: 4, slug: "ask-the-machine", title: "Ask the machine", commands: ["man", "tldr"] },
      { num: 5, slug: "reading-files", title: "Reading files", commands: ["cat", "head", "tail"] },
      { num: 6, slug: "finding-the-line", title: "Finding the line", commands: ["grep"] },
      { num: 7, slug: "finding-the-file", title: "Finding the file", commands: ["grep -r"] },
      { num: 8, slug: "getting-on-the-cluster", title: "Getting on the cluster", commands: ["ssh"] },
    ],
  },
  {
    key: "transfer",
    name: "Moving files",
    blurb: "Copying a result off the cluster, and finishing a copy that keeps dropping.",
    nodes: [
      {
        num: 9, slug: "bringing-files-back", title: "Bringing files back", commands: ["scp"],
        line: "Which direction does a copy go, and what does a remote path look like?",
      },
      {
        num: 10, slug: "when-the-link-drops", title: "When the link drops", commands: ["rsync"],
        line: "How do you finish a copy over a link that keeps dropping?",
        waits: { concept: "copying a file with <code>scp</code>", from: "the challenge before it" },
      },
    ],
  },
  {
    key: "git",
    name: "Keeping a record",
    blurb: "Reading what changed, saving your work in steps, and picking up someone else's.",
    nodes: [
      {
        num: 11, slug: "what-changed", title: "What changed", commands: ["git status", "git log"],
        line: "What changed in this project, and when?",
      },
      {
        num: 12, slug: "saving-your-work", title: "Saving your work", commands: ["git add", "git commit"],
        line: "How do you save your work in steps?",
        waits: { concept: "reading a repository's history", from: "the challenge before it" },
      },
      {
        num: 13, slug: "getting-the-latest", title: "Getting the latest", commands: ["git clone", "git pull"],
        line: "How does someone else's work get onto your machine?",
        waits: { concept: "making a commit", from: "the challenge before it" },
      },
    ],
  },
  {
    key: "cluster",
    name: "Running work",
    blurb: "Checking what is free, reading the queue, sending a job, and watching it move.",
    nodes: [
      {
        num: 14, slug: "is-there-room", title: "Is there room", commands: ["df -h", "free -h"],
        line: "Is there disk space, and is there memory?",
      },
      {
        num: 15, slug: "whats-running", title: "What is running", commands: ["sinfo", "squeue"],
        line: "What is running on the cluster, and what is waiting?",
        waits: { concept: "reading the cluster's disk and memory", from: "the challenge before it" },
      },
      {
        num: 16, slug: "submitting-a-job", title: "Submitting a job", commands: ["sbatch"],
        line: "How do you send a job to the queue, and where does its output go?",
        waits: { concept: "reading the queue", from: "the challenge before it" },
      },
      {
        num: 17, slug: "watching-it-change", title: "Watching it change", commands: ["watch"],
        line: "How do you watch something change without retyping the command?",
        waits: { concept: "a job of your own in the queue", from: "the challenge before it" },
      },
    ],
  },
  {
    key: "finale",
    name: "Putting it together",
    blurb: "One task that crosses all three routes.",
    nodes: [
      {
        num: 18, slug: "putting-it-together", title: "Putting it together", commands: [],
        line: "Find something in an output file, check the queue, and bring a result back.",
        waitsText: "Waits for <strong>all three routes</strong>.",
        note: "This is also where the trainer points you at signing up for a real cluster account.",
      },
    ],
  },
];

export const ROUTE_KEYS = ["transfer", "git", "cluster"];

export const CORE_KEY = "core";
export const FINALE_KEY = "finale";

/* ---- the graph -----------------------------------------------------------
   Requirements are derived from the shape rather than typed out, so adding a
   challenge to a route cannot leave a stale `requires` behind. Inside a topic
   each challenge waits for the one before it; a route head waits for the last
   core challenge; the finale waits for the last challenge of every route. */

const byKey = {};
for (const topic of TOPICS) byKey[topic.key] = topic;

function lastSlug(key) {
  const t = byKey[key];
  return t.nodes[t.nodes.length - 1].slug;
}

for (const topic of TOPICS) {
  topic.nodes.forEach((node, i) => {
    if (i > 0) node.requires = [topic.nodes[i - 1].slug];
    else if (topic.key === CORE_KEY) node.requires = [];
    else if (topic.key === FINALE_KEY) node.requires = ROUTE_KEYS.map(lastSlug);
    else node.requires = [lastSlug(CORE_KEY)];
    node.topicKey = topic.key;
  });
}

export function topicByKey(key) {
  return byKey[key] || null;
}

export const ALL_NODES = TOPICS.flatMap(t => t.nodes);

export const TOTAL = ALL_NODES.length;

/* Where does a challenge sit? `num` is its own number, `last` is the last
   number in its topic, `index` is only for drawing pips. */
export function topicOf(slugOrChallenge) {
  const slug = typeof slugOrChallenge === "string" ? slugOrChallenge : slugOrChallenge && slugOrChallenge.slug;
  for (const topic of TOPICS) {
    const i = topic.nodes.findIndex(n => n.slug === slug);
    if (i !== -1) {
      return {
        topic,
        node: topic.nodes[i],
        index: i,
        count: topic.nodes.length,
        num: topic.nodes[i].num,
        first: topic.nodes[0].num,
        last: topic.nodes[topic.nodes.length - 1].num,
      };
    }
  }
  return null;
}

export function nodeBySlug(slug) {
  return ALL_NODES.find(n => n.slug === slug) || null;
}
