// THROWAWAY PROTOTYPE: two home-navigation structures, switchable with ?variant=A|B.

const VARIANTS = [
  { key: "A", name: "Expanded curriculum graph" },
  { key: "B", name: "Topics, then graph" },
];

const icons = {
  linux: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 8h20v16H6zM6 19h20M10 12l3 3-3 3M16 18h5"/></svg>`,
  git: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="23" cy="16" r="3"/><circle cx="9" cy="24" r="3"/><path d="M9 11v10M12 8h3a8 8 0 0 1 8 5"/></svg>`,
  hpc: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="22" height="7" rx="1"/><rect x="5" y="20" width="22" height="7" rx="1"/><path d="M9 8.5h.01M13 8.5h9M9 23.5h.01M13 23.5h9M16 12v8"/></svg>`,
};

const curriculum = {
  height: 1040,
  nodes: [
    { id: "start", title: "Start here", label: "Introduction", x: 410, y: 20, state: "done", progress: [1, 1] },
    { id: "linux", title: "Linux foundations", label: "Linux", x: 205, y: 175, state: "done", progress: [4, 4] },
    { id: "git", title: "Keeping a record", label: "Git", x: 615, y: 175, state: "open", progress: [1, 4] },
    { id: "files", title: "Moving files", label: "Optional branch", x: 40, y: 365, state: "open", progress: [0, 3] },
    { id: "remote", title: "Working remotely", label: "Shared foundation", x: 410, y: 350, state: "here", progress: [2, 5] },
    { id: "history", title: "Read project history", label: "Optional branch", x: 780, y: 365, state: "locked", progress: [0, 2] },
    { id: "transfer", title: "Prepare research data", label: "Workflow", x: 205, y: 620, state: "locked", progress: [0, 3] },
    { id: "scheduler", title: "Run work on HPC", label: "HPC", x: 615, y: 620, state: "locked", progress: [0, 5] },
    { id: "finish", title: "Put it together", label: "Final workflow", x: 410, y: 875, state: "locked", progress: [0, 1] },
  ],
  edges: [
    ["start", "linux"], ["start", "git"],
    ["linux", "files"], ["linux", "remote"], ["git", "remote"], ["git", "history"],
    ["remote", "transfer"], ["remote", "scheduler"],
    ["transfer", "finish"], ["scheduler", "finish"],
  ],
};

const topics = [
  {
    key: "linux", name: "Linux", progress: [5, 8],
    summary: "Find your way around, work with files, and connect to another computer.",
    graph: {
      height: 840,
      nodes: [
        { id: "intro", title: "Meet the terminal", label: "Introduction", x: 410, y: 20, state: "done" },
        { id: "where", title: "Where am I?", label: "pwd", x: 205, y: 190, state: "done" },
        { id: "look", title: "Look around", label: "ls", x: 615, y: 190, state: "done" },
        { id: "move", title: "Move between folders", label: "cd", x: 205, y: 390, state: "here" },
        { id: "make", title: "Make files and folders", label: "mkdir · touch", x: 615, y: 390, state: "open" },
        { id: "combine", title: "Combine commands", label: "pipes", x: 410, y: 640, state: "locked" },
      ],
      edges: [["intro", "where"], ["intro", "look"], ["where", "move"], ["look", "make"], ["move", "combine"], ["make", "combine"]],
    },
  },
  {
    key: "git", name: "Git", progress: [1, 4],
    summary: "See what changed, make a checkpoint, and pick up shared work.",
    graph: {
      height: 840,
      nodes: [
        { id: "intro", title: "What Git records", label: "Introduction", x: 410, y: 20, state: "done" },
        { id: "status", title: "Check the project", label: "git status", x: 205, y: 190, state: "open" },
        { id: "history", title: "Read the history", label: "git log", x: 615, y: 190, state: "open" },
        { id: "compare", title: "See what changed", label: "git diff", x: 205, y: 390, state: "locked" },
        { id: "record", title: "Record a change", label: "git commit", x: 615, y: 390, state: "locked" },
        { id: "share", title: "Pick up shared work", label: "clone · pull", x: 410, y: 640, state: "locked" },
      ],
      edges: [["intro", "status"], ["intro", "history"], ["status", "compare"], ["history", "record"], ["compare", "share"], ["record", "share"]],
    },
  },
  {
    key: "hpc", name: "HPC", progress: [0, 5],
    summary: "Understand shared compute, ask for resources, and follow a job through the queue.",
    graph: {
      height: 880,
      nodes: [
        { id: "intro", title: "What a cluster is", label: "Introduction", x: 410, y: 20, state: "open" },
        { id: "storage", title: "Storage on the cluster", label: "Filesystems", x: 205, y: 190, state: "locked" },
        { id: "scheduler", title: "Meet the scheduler", label: "Slurm", x: 615, y: 190, state: "locked" },
        { id: "space", title: "Check available space", label: "df · quota", x: 40, y: 400, state: "locked" },
        { id: "resources", title: "Ask for resources", label: "CPU · memory · time", x: 410, y: 400, state: "locked" },
        { id: "queue", title: "Read the queue", label: "squeue", x: 780, y: 400, state: "locked" },
        { id: "submit", title: "Submit and watch a job", label: "sbatch", x: 410, y: 665, state: "locked" },
      ],
      edges: [["intro", "storage"], ["intro", "scheduler"], ["storage", "space"], ["storage", "resources"], ["scheduler", "resources"], ["scheduler", "queue"], ["space", "submit"], ["resources", "submit"], ["queue", "submit"]],
    },
  },
];

const main = document.getElementById("prototype");
const stateLine = document.getElementById("prototype-state");
const variantLabel = document.getElementById("variant-label");

function params() { return new URLSearchParams(location.search); }
function variantFromURL() {
  const key = params().get("variant")?.toUpperCase();
  return VARIANTS.some(item => item.key === key) ? key : "A";
}
function topicFromURL() { return topics.find(topic => topic.key === params().get("topic")) || null; }

function updateURL(changes) {
  const url = new URL(location.href);
  Object.entries(changes).forEach(([key, value]) => value ? url.searchParams.set(key, value) : url.searchParams.delete(key));
  history.pushState({}, "", url);
  render();
}

function setVariant(key) { updateURL({ variant: key, topic: null }); }
function cycle(direction) {
  const current = VARIANTS.findIndex(item => item.key === variantFromURL());
  setVariant(VARIANTS[(current + direction + VARIANTS.length) % VARIANTS.length].key);
}

function stateText(state) {
  return state === "done" ? "Complete" : state === "here" ? "Continue" : state === "open" ? "Available" : "Locked";
}

function graphPath(graph, edge) {
  const from = graph.nodes.find(node => node.id === edge[0]);
  const to = graph.nodes.find(node => node.id === edge[1]);
  const x1 = from.x + 90, y1 = from.y + 112, x2 = to.x + 90, y2 = to.y;
  const bend = Math.max(42, (y2 - y1) * 0.48);
  return `<path class="graph-wire${to.state === "locked" ? " is-locked" : ""}" d="M${x1},${y1} C${x1},${y1 + bend} ${x2},${y2 - bend} ${x2},${y2}" marker-end="url(#graph-arrow)"/>`;
}

function graphMarkup(graph, name) {
  return `<div class="curriculum-graph" style="--graph-ratio:${graph.height / 1000}" aria-label="${name} learning graph">
    <svg viewBox="0 0 1000 ${graph.height}" preserveAspectRatio="none" aria-hidden="true">
      <defs><marker id="graph-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="7" markerHeight="7" orient="auto"><path class="graph-arrow" d="M.5 .8 7 4 .5 7.2"/></marker></defs>
      ${graph.edges.map(edge => graphPath(graph, edge)).join("")}
    </svg>
    ${graph.nodes.map(node => {
      const progress = node.progress || [node.state === "done" ? 1 : 0, 1];
      return `<button type="button" class="graph-node is-${node.state}" style="--node-x:${node.x / 10}%;--node-y:${node.y / graph.height * 100}%" data-node="${node.id}" ${node.state === "locked" ? "disabled" : ""}>
        <span class="graph-state">${stateText(node.state)}</span><strong>${node.title}</strong><small>${node.label}</small>
        <span class="graph-pips" aria-hidden="true">${Array.from({ length: progress[1] }, (_, index) => `<i class="${index < progress[0] ? "done" : ""}"></i>`).join("")}</span>
      </button>`;
    }).join("")}
  </div>`;
}

function bindGraph(graph, context) {
  main.querySelectorAll("[data-node]").forEach(button => button.addEventListener("click", () => {
    const node = graph.nodes.find(item => item.id === button.dataset.node);
    stateLine.textContent = `Prototype state · ${context} · selected: ${node.title}`;
  }));
}

function renderMap() {
  main.innerHTML = `<section aria-labelledby="map-title">
    <header class="prototype-intro">
      <div><p class="plain-label">Variant A · expanded curriculum graph</p><h1 id="map-title">See how the routes split and meet again.</h1></div>
      <p>This keeps the current map language, but gives the curriculum enough vertical space to show prerequisites, optional branches, and joining points.</p>
    </header>
    <div class="graph-key" aria-label="Graph key"><span><i class="is-complete"></i>Complete</span><span><i class="is-current"></i>Current</span><span><i class="is-locked"></i>Locked</span></div>
    ${graphMarkup(curriculum, "Complete curriculum")}
    <aside class="map-note"><strong>Variant A</strong><p>One large graph presents the complete curriculum on the home screen. Learners can follow a central route while seeing where side routes split and reconnect.</p></aside>
  </section>`;
  bindGraph(curriculum, "Variant A");
  stateLine.textContent = "Prototype state · Variant A · complete curriculum graph";
}

function topicCards() {
  return `<div class="topic-grid">${topics.map(topic => {
    const [done, total] = topic.progress;
    return `<button type="button" class="topic-card" data-topic="${topic.key}">
      <span class="topic-icon">${icons[topic.key]}</span>
      <span class="topic-copy"><strong>${topic.name}</strong><small>${topic.summary}</small></span>
      <span class="topic-progress"><span><b>${done}</b> of ${total}</span><i><i style="--topic-progress:${done / total}"></i></i></span>
      <span class="topic-open" aria-hidden="true">Open graph →</span>
    </button>`;
  }).join("")}</div>`;
}

function renderTopicIndex() {
  main.innerHTML = `<section aria-labelledby="topics-title">
    <header class="prototype-intro compact">
      <div><p class="plain-label">Variant B · choose a Topic first</p><h1 id="topics-title">What do you want to learn?</h1></div>
      <p>The home screen stops here. Selecting a Topic opens its full learning graph on a separate view.</p>
    </header>
    ${topicCards()}
    <aside class="map-note"><strong>Variant B</strong><p>The first decision is only Linux, Git, or HPC. The detailed graph stays out of sight until a learner chooses one.</p></aside>
  </section>`;
  main.querySelectorAll("[data-topic]").forEach(button => button.addEventListener("click", () => updateURL({ topic: button.dataset.topic })));
  stateLine.textContent = "Prototype state · Variant B · Topic selection";
}

function renderTopicGraph(topic) {
  main.innerHTML = `<section aria-labelledby="topic-title">
    <button type="button" class="back-button" id="back-to-topics">← All Topics</button>
    <header class="topic-graph-head">
      <span class="topic-icon">${icons[topic.key]}</span>
      <div><p class="plain-label">Variant B · ${topic.name} graph</p><h1 id="topic-title">${topic.name}</h1><p>${topic.summary}</p></div>
    </header>
    ${graphMarkup(topic.graph, `${topic.name} Topic`)}
  </section>`;
  document.getElementById("back-to-topics").addEventListener("click", () => updateURL({ topic: null }));
  bindGraph(topic.graph, `Variant B · ${topic.name}`);
  stateLine.textContent = `Prototype state · Variant B · ${topic.name} graph`;
}

function render() {
  const variant = variantFromURL();
  variantLabel.textContent = `${variant} · ${VARIANTS.find(item => item.key === variant).name}`;
  if (variant === "A") return renderMap();
  const topic = topicFromURL();
  topic ? renderTopicGraph(topic) : renderTopicIndex();
}

document.getElementById("previous-variant").addEventListener("click", () => cycle(-1));
document.getElementById("next-variant").addEventListener("click", () => cycle(1));
window.addEventListener("popstate", render);
window.addEventListener("keydown", event => {
  if (["INPUT", "TEXTAREA"].includes(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === "ArrowLeft") cycle(-1);
  if (event.key === "ArrowRight") cycle(1);
});

render();
