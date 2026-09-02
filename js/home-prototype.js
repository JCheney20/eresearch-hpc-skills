// THROWAWAY PROTOTYPE: two home-navigation structures, switchable with ?variant=A|B.

const VARIANTS = [
  { key: "A", name: "One interconnected map" },
  { key: "B", name: "Topic index" },
];

const icons = {
  linux: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 8h20v16H6zM6 19h20M10 12l3 3-3 3M16 18h5"/></svg>`,
  git: `<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="23" cy="16" r="3"/><circle cx="9" cy="24" r="3"/><path d="M9 11v10M12 8h3a8 8 0 0 1 8 5"/></svg>`,
  hpc: `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="22" height="7" rx="1"/><rect x="5" y="20" width="22" height="7" rx="1"/><path d="M9 8.5h.01M13 8.5h9M9 23.5h.01M13 23.5h9M16 12v8"/></svg>`,
};

const mapNodes = [
  { id: "terminal", title: "Meet the terminal", topic: "Linux", x: 40, y: 35, state: "done" },
  { id: "files", title: "Files and directories", topic: "Linux", x: 235, y: 35, state: "done" },
  { id: "remote", title: "Connect remotely", topic: "Linux", x: 430, y: 35, state: "here" },
  { id: "cluster", title: "Meet the cluster", topic: "HPC", x: 625, y: 35, state: "open" },
  { id: "queue", title: "Read the queue", topic: "HPC", x: 790, y: 145, state: "locked" },
  { id: "submit", title: "Submit a job", topic: "HPC", x: 790, y: 315, state: "locked" },
  { id: "finish", title: "Research workflow", topic: "HPC", x: 790, y: 500, state: "locked" },
  { id: "copy", title: "Copy one result", topic: "Moving files", x: 470, y: 205, state: "open", optional: true },
  { id: "sync", title: "Resume a transfer", topic: "Moving files", x: 585, y: 355, state: "locked", optional: true },
  { id: "history", title: "Read project history", topic: "Git", x: 245, y: 230, state: "open", optional: true },
  { id: "commit", title: "Record a change", topic: "Git", x: 300, y: 410, state: "locked", optional: true },
  { id: "share", title: "Get shared work", topic: "Git", x: 505, y: 500, state: "locked", optional: true },
  { id: "pipes", title: "Combine commands", topic: "Linux", x: 55, y: 250, state: "open", optional: true },
  { id: "search", title: "Search many files", topic: "Linux", x: 65, y: 440, state: "locked", optional: true },
];

const mapEdges = [
  ["terminal", "files"], ["files", "remote"], ["remote", "cluster"],
  ["cluster", "queue"], ["queue", "submit"], ["submit", "finish"],
  ["remote", "copy", true], ["copy", "sync", true], ["sync", "submit", true],
  ["files", "history", true], ["history", "commit", true], ["commit", "share", true], ["share", "finish", true],
  ["files", "pipes", true], ["pipes", "search", true], ["search", "commit", true],
];

const topics = [
  {
    key: "linux", name: "Linux", progress: [5, 8], summary: "Find your way around, work with files, and connect to another computer.",
    nodes: [
      { name: "Meet the terminal", state: "done" },
      { name: "Files and directories", state: "done", children: ["Paths", "Hidden files", "Permissions"] },
      { name: "Search and combine", state: "open", children: ["grep", "find", "pipes"] },
      { name: "Remote access", state: "locked", children: ["SSH", "remote paths"] },
    ],
  },
  {
    key: "git", name: "Git", progress: [1, 4], summary: "See what changed, make a checkpoint, and pick up shared work.",
    nodes: [
      { name: "What Git records", state: "done" },
      { name: "Read the history", state: "open", children: ["status", "log", "diff"] },
      { name: "Save a change", state: "locked", children: ["add", "commit"] },
      { name: "Share the record", state: "locked", children: ["clone", "pull"] },
    ],
  },
  {
    key: "hpc", name: "HPC", progress: [0, 5], summary: "Understand shared compute, ask for resources, and follow a job through the queue.",
    nodes: [
      { name: "What a cluster is", state: "open" },
      { name: "Storage and memory", state: "locked", children: ["df", "free"] },
      { name: "The scheduler", state: "locked", children: ["partitions", "queue states"] },
      { name: "Submit work", state: "locked", children: ["job script", "sbatch"] },
      { name: "Watch a job", state: "locked", children: ["squeue", "output files"] },
    ],
  },
];

const main = document.getElementById("prototype");
const stateLine = document.getElementById("prototype-state");
const label = document.getElementById("variant-label");
let selectedTopic = "linux";
let selectedNode = null;

function variantFromURL() {
  const key = new URLSearchParams(location.search).get("variant")?.toUpperCase();
  return VARIANTS.some(item => item.key === key) ? key : "A";
}

function setVariant(key) {
  const url = new URL(location.href);
  url.searchParams.set("variant", key);
  history.replaceState({}, "", url);
  selectedNode = null;
  render();
}

function cycle(direction) {
  const current = VARIANTS.findIndex(item => item.key === variantFromURL());
  setVariant(VARIANTS[(current + direction + VARIANTS.length) % VARIANTS.length].key);
}

function line(edge) {
  const from = mapNodes.find(node => node.id === edge[0]);
  const to = mapNodes.find(node => node.id === edge[1]);
  const x1 = from.x + 75, y1 = from.y + 33, x2 = to.x + 75, y2 = to.y + 33;
  const bend = Math.max(30, Math.abs(x2 - x1) * 0.35);
  return `<path class="map-edge${edge[2] ? " optional" : ""}" d="M${x1},${y1} C${x1 + bend},${y1} ${x2 - bend},${y2} ${x2},${y2}"/>`;
}

function renderMap() {
  main.innerHTML = `
    <section class="map-prototype" aria-labelledby="map-title">
      <header class="prototype-intro">
        <div><p class="plain-label">Variant A · one interconnected map</p><h1 id="map-title">Choose a route through the same landscape.</h1></div>
        <p>The solid line is enough to reach the final workflow. Dashed branches teach useful topics without blocking that route.</p>
      </header>
      <div class="map-legend" aria-label="Map legend"><span><i class="required-line"></i>Required route</span><span><i class="optional-line"></i>Optional branch</span><span><i class="current-dot"></i>Current challenge</span></div>
      <div class="learning-map">
        <svg viewBox="0 0 1000 620" preserveAspectRatio="none" aria-hidden="true">${mapEdges.map(line).join("")}</svg>
        ${mapNodes.map(node => `<button class="map-node is-${node.state}${node.optional ? " is-optional" : ""}" style="--node-x:${node.x / 10}%;--node-y:${node.y / 6.2}%" data-map-node="${node.id}" type="button" ${node.state === "locked" ? "disabled" : ""}><small>${node.topic}</small><strong>${node.title}</strong><span>${node.state === "done" ? "Complete" : node.state === "here" ? "Continue" : node.state === "open" ? "Available" : "Locked"}</span></button>`).join("")}
      </div>
      <aside class="map-note"><strong>What this tests</strong><p>Can learners see both the shortest route and the broader curriculum without mistaking optional work for unfinished required work?</p></aside>
    </section>`;

  main.querySelectorAll("[data-map-node]").forEach(button => button.addEventListener("click", () => {
    const node = mapNodes.find(item => item.id === button.dataset.mapNode);
    stateLine.textContent = `Prototype state · Variant A · selected node: ${node.title} · ${node.optional ? "optional branch" : "required route"}`;
  }));
  stateLine.textContent = "Prototype state · Variant A · no node selected";
}

function topicGraph(topic) {
  return `<div class="topic-graph" aria-label="${topic.name} challenge graph">
    ${topic.nodes.map((node, index) => `
      <button type="button" class="topic-node is-${node.state}" data-topic-node="${index}" ${node.state === "locked" ? "disabled" : ""}>
        <span class="topic-node-index">${String(index + 1).padStart(2, "0")}</span>
        <strong>${node.name}</strong><small>${node.state}</small>
      </button>${index < topic.nodes.length - 1 ? '<span class="topic-connector" aria-hidden="true">→</span>' : ""}
    `).join("")}
  </div>
  <div class="node-expansion" ${selectedNode === null ? "hidden" : ""}>
    ${selectedNode === null ? "" : (() => {
      const node = topic.nodes[selectedNode];
      return `<p><strong>${node.name}</strong> expands into:</p><div>${(node.children || ["Introduction"]).map(child => `<span>${child}</span>`).join("")}</div>`;
    })()}
  </div>`;
}

function renderTopics() {
  const active = topics.find(topic => topic.key === selectedTopic);
  main.innerHTML = `
    <section class="topics-prototype" aria-labelledby="topics-title">
      <header class="prototype-intro compact">
        <div><p class="plain-label">Variant B · Topic index</p><h1 id="topics-title">Start with the subject you need.</h1></div>
        <p>Each Topic keeps its own progress and opens into a focused challenge graph.</p>
      </header>
      <div class="topic-index">
        ${topics.map(topic => {
          const [done, total] = topic.progress;
          return `<button type="button" class="topic-entry${topic.key === selectedTopic ? " is-selected" : ""}" data-topic="${topic.key}" aria-pressed="${topic.key === selectedTopic}">
            <span class="topic-icon">${icons[topic.key]}</span>
            <span class="topic-copy"><strong>${topic.name}</strong><small>${topic.summary}</small></span>
            <span class="topic-progress"><span><b>${done}</b> of ${total}</span><i><i style="--topic-progress:${done / total}"></i></i></span>
          </button>`;
        }).join("")}
      </div>
      <section class="topic-detail" aria-labelledby="active-topic"><header><span class="topic-icon">${icons[active.key]}</span><div><p>Selected Topic</p><h2 id="active-topic">${active.name}</h2></div></header>${topicGraph(active)}</section>
      <aside class="map-note"><strong>What this tests</strong><p>Does reducing the first choice to three Topics make the curriculum easier to enter, even though the learner sees less of the whole route?</p></aside>
    </section>`;

  main.querySelectorAll("[data-topic]").forEach(button => button.addEventListener("click", () => {
    selectedTopic = button.dataset.topic;
    selectedNode = null;
    render();
  }));
  main.querySelectorAll("[data-topic-node]").forEach(button => button.addEventListener("click", () => {
    selectedNode = Number(button.dataset.topicNode);
    render();
  }));
  stateLine.textContent = `Prototype state · Variant B · selected Topic: ${active.name}${selectedNode === null ? " · no expanded node" : ` · expanded node: ${active.nodes[selectedNode].name}`}`;
}

function render() {
  const variant = variantFromURL();
  const current = VARIANTS.find(item => item.key === variant);
  label.textContent = `${current.key} · ${current.name}`;
  variant === "A" ? renderMap() : renderTopics();
}

document.getElementById("previous-variant").addEventListener("click", () => cycle(-1));
document.getElementById("next-variant").addEventListener("click", () => cycle(1));
window.addEventListener("popstate", render);
window.addEventListener("keydown", event => {
  const tag = event.target.tagName;
  if (["INPUT", "TEXTAREA"].includes(tag) || event.target.isContentEditable) return;
  if (event.key === "ArrowLeft") cycle(-1);
  if (event.key === "ArrowRight") cycle(1);
});

render();
