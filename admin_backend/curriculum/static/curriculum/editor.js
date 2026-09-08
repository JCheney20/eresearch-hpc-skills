const state = JSON.parse(document.getElementById("curriculum-data").textContent);
let graph = structuredClone(state.curriculum.graph);
let selectedChallenge = null;
let selectedNode = graph.nodes[0]?.number || null;
let previewTimer = null;

const $ = selector => document.querySelector(selector);
const status = (message, error = false) => {
  $("#status").textContent = message;
  $("#status").classList.toggle("is-error", error);
};
const csrf = () => document.cookie.split("; ").find(value => value.startsWith("csrftoken="))?.split("=")[1] || "";
async function post(url, body) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error((data.errors || ["Request failed."]).join(" "));
  return data;
}

/* Tabs */
document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("is-active", item === button));
  document.querySelectorAll(".editor-panel").forEach(panel => panel.classList.remove("is-active"));
  $(`#${button.dataset.tab}-panel`).classList.add("is-active");
  if (button.dataset.tab === "graph") renderGraph();
}));

/* Challenge notebook */
function choiceLabel(challenge) {
  return `<code>${challenge.number}</code>${escapeAttribute(challenge.draft?.title || challenge.slug)}`;
}
function renderChoices(filter = "") {
  const host = $("#challenges");
  host.replaceChildren();
  const query = filter.toLowerCase();
  state.challenges.filter(challenge => choiceLabel(challenge).toLowerCase().includes(query)).forEach(challenge => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "challenge-choice" + (challenge === selectedChallenge ? " is-active" : "");
    button.innerHTML = choiceLabel(challenge);
    button.addEventListener("click", () => selectChallenge(challenge));
    host.append(button);
  });
}
function emptyDraft(challenge) {
  return {
    version: 0,
    kind: "text",
    title: challenge.slug.replaceAll("-", " ").replace(/\b\w/g, letter => letter.toUpperCase()),
    author: state.author,
    source: {},
    minimumReadSeconds: 120,
    content: { blocks: [] },
    world: {},
  };
}
function selectChallenge(challenge) {
  selectedChallenge = challenge;
  challenge.draft ||= emptyDraft(challenge);
  $("#no-challenge").hidden = true;
  $("#challenge-form").hidden = false;
  $("#challenge-title").value = challenge.draft.title;
  $("#challenge-kind").value = challenge.draft.kind;
  $("#challenge-author").value = challenge.draft.author;
  $("#challenge-source").value = challenge.draft.source?.url || "";
  $("#challenge-task").value = challenge.draft.content.task || "";
  $("#challenge-answer").value = challenge.draft.content.answer || challenge.draft.content.validator || "";
  $("#challenge-world").value = JSON.stringify(challenge.draft.world || {}, null, 2);
  showCodeFields();
  const legacyCode = challenge.draft.kind === "code" && challenge.draft.content.legacyManifest;
  $("#challenge-form button[type=submit]").disabled = !!legacyCode;
  status(legacyCode ? "This code challenge remains developer-owned until declarative validators are implemented." : "");
  renderBlocks();
  renderChoices($("#challenge-search").value);
}
function showCodeFields() {
  $("#code-fields").hidden = $("#challenge-kind").value !== "code";
}
function blockTemplate(block, index) {
  const item = document.createElement("section");
  item.className = "editor-block";
  item.dataset.index = index;
  item.innerHTML = `<div class="block-head"><select class="block-type"><option value="markdown">Markdown</option><option value="callout">Callout</option><option value="bash">Bash</option><option value="typst">Legacy Typst</option></select><input class="block-id" aria-label="Stable block ID" value="${escapeAttribute(block.id)}"><button type="button" data-move="up" title="Move up">↑</button><button type="button" data-remove title="Remove block">×</button></div><div class="block-body"></div>`;
  item.querySelector(".block-type").value = block.type;
  const body = item.querySelector(".block-body");
  if (block.type === "bash") {
    body.className = "block-body block-bash";
    body.innerHTML = `<input class="bash-command" aria-label="Command" placeholder="Command" value="${escapeAttribute(block.command || "")}"><textarea class="bash-output" aria-label="Expected output" placeholder="Expected output"></textarea><select class="bash-mode"><option value="display">Display</option><option value="copy">Copy</option><option value="run">Run</option></select>`;
    body.querySelector(".bash-output").value = block.output || "";
    body.querySelector(".bash-mode").value = block.mode || "display";
  } else {
    const isTypst = block.type === "typst";
    body.innerHTML = `<div class="block-tools"><button type="button" data-wrap="${isTypst ? "*" : "**"}" title="Bold"><b>B</b></button><button type="button" data-wrap="${isTypst ? "_" : "*"}" title="Italic"><i>I</i></button><button type="button" data-link title="Link">Link</button>${block.type === "callout" ? '<select class="callout-style"><option>note</option><option>hint</option><option>warning</option><option>exercise</option><option>solution</option></select>' : ""}</div><textarea class="block-source" aria-label="${isTypst ? "Typst" : "Markdown"} source"></textarea>`;
    body.querySelector(".block-source").value = block.source || "";
    if (block.type === "callout") body.querySelector(".callout-style").value = block.style || "note";
  }
  bindBlock(item);
  return item;
}
function escapeAttribute(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}
function bindBlock(item) {
  item.querySelector(".block-type").addEventListener("change", event => {
    const id = item.querySelector(".block-id").value.trim();
    const source = item.querySelector(".block-source")?.value || "";
    const type = event.target.value;
    selectedChallenge.draft.content.blocks[item.dataset.index] = type === "bash"
      ? { id, type, command: "", output: "", mode: "display" }
      : { id, type, source, ...(type === "callout" ? { style: "note" } : {}) };
    renderBlocks();
  });
  item.querySelector("[data-remove]").addEventListener("click", () => {
    selectedChallenge.draft.content.blocks.splice(item.dataset.index, 1);
    renderBlocks();
  });
  item.querySelector("[data-move]").addEventListener("click", () => {
    const index = Number(item.dataset.index);
    if (!index) return;
    const blocks = syncBlocks();
    [blocks[index - 1], blocks[index]] = [blocks[index], blocks[index - 1]];
    renderBlocks();
  });
  item.querySelectorAll("[data-wrap]").forEach(button => button.addEventListener("click", () => wrapSelection(item.querySelector(".block-source"), button.dataset.wrap)));
  item.querySelector("[data-link]")?.addEventListener("click", () => {
    const input = item.querySelector(".block-source");
    const label = input.value.slice(input.selectionStart, input.selectionEnd) || "link text";
    const isTypst = item.querySelector(".block-type").value === "typst";
    insertAtSelection(input, isTypst ? `#link("https://example.com")[${label}]` : `[${label}](https://example.com)`);
  });
  item.addEventListener("input", schedulePreview);
  item.addEventListener("change", schedulePreview);
}
function insertAtSelection(input, text) {
  input.setRangeText(text, input.selectionStart, input.selectionEnd, "end");
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
}
function wrapSelection(input, marker) {
  const selected = input.value.slice(input.selectionStart, input.selectionEnd) || "text";
  insertAtSelection(input, `${marker}${selected}${marker}`);
}
function readBlock(item) {
  const type = item.querySelector(".block-type").value;
  const block = { id: item.querySelector(".block-id").value.trim(), type };
  if (type === "bash") return { ...block, command: item.querySelector(".bash-command").value, output: item.querySelector(".bash-output").value, mode: item.querySelector(".bash-mode").value };
  block.source = item.querySelector(".block-source").value;
  if (type === "callout") block.style = item.querySelector(".callout-style").value;
  return block;
}
function syncBlocks() {
  if (!selectedChallenge) return [];
  const rendered = [...document.querySelectorAll(".editor-block")].map(readBlock);
  selectedChallenge.draft.content.blocks = rendered;
  return rendered;
}
function renderBlocks() {
  const host = $("#blocks");
  host.replaceChildren();
  selectedChallenge.draft.content.blocks.forEach((block, index) => host.append(blockTemplate(block, index)));
  schedulePreview();
}
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(preview, 250);
}
async function preview() {
  const blocks = syncBlocks();
  if (!blocks.length) { $("#preview-output").textContent = "Add a block to begin."; return; }
  try {
    const result = await post(state.urls.preview, { blocks });
    $("#preview-output").innerHTML = result.blocks.map(block => block.html).join("");
  } catch (error) {
    $("#preview-output").textContent = error.message;
  }
}
document.querySelectorAll("[data-add]").forEach(button => button.addEventListener("click", () => {
  if (!selectedChallenge) return;
  syncBlocks();
  const type = button.dataset.add;
  const id = `${type}-${selectedChallenge.draft.content.blocks.length + 1}`;
  selectedChallenge.draft.content.blocks.push(type === "bash" ? { id, type, command: "", output: "", mode: "display" } : { id, type, source: "", ...(type === "callout" ? { style: "note" } : {}) });
  renderBlocks();
}));
$("#challenge-search").addEventListener("input", event => renderChoices(event.target.value));
$("#challenge-kind").addEventListener("change", showCodeFields);
$("#challenge-form").addEventListener("submit", async event => {
  event.preventDefault();
  try {
    const draft = selectedChallenge.draft;
    const sourceUrl = $("#challenge-source").value.trim();
    const content = { blocks: syncBlocks(), workInProgress: draft.content.workInProgress || false };
    let world = {};
    if ($("#challenge-kind").value === "code") {
      content.task = $("#challenge-task").value;
      content.answer = $("#challenge-answer").value;
      content.hints = draft.content.hints || [];
      content.commands = draft.content.commands || [];
      world = JSON.parse($("#challenge-world").value || "{}");
    }
    const result = await post(state.urls.challenge, {
      number: selectedChallenge.number,
      version: draft.version,
      kind: $("#challenge-kind").value,
      title: $("#challenge-title").value,
      author: $("#challenge-author").value,
      source: sourceUrl ? { ...(draft.source || {}), label: draft.source?.label || "Source", url: sourceUrl } : {},
      content,
      world,
    });
    draft.version = result.version;
    Object.assign(draft, { kind: $("#challenge-kind").value, title: $("#challenge-title").value, author: $("#challenge-author").value, content, world });
    status(`Saved challenge ${selectedChallenge.number}, draft v${result.version}.`);
    renderChoices($("#challenge-search").value);
  } catch (error) { status(error.message, true); }
});
renderChoices();

/* Cartesian graph */
state.topics.forEach(topic => {
  for (const selector of ["#graph-view", "#graph-topic"]) {
    const option = document.createElement("option");
    option.value = topic.key;
    option.textContent = topic.name;
    $(selector).append(option);
  }
});
state.challenges.forEach(challenge => {
  const option = document.createElement("option");
  option.value = challenge.number;
  option.textContent = `${challenge.number} · ${challenge.draft?.title || challenge.slug}`;
  $("#graph-node").append(option);
});
function graphNode(number) { return graph.nodes.find(node => node.number === number); }
function scopedNodes() {
  const view = $("#graph-view").value;
  return graph.nodes.filter(node => view === "journey" || node.topic === view);
}
function positions() {
  const view = $("#graph-view").value;
  graph.layouts ||= {};
  return graph.layouts[view] ||= {};
}
function renderGraph() {
  const canvas = $("#graph-canvas");
  canvas.querySelectorAll(".graph-node").forEach(node => node.remove());
  const points = positions();
  const nodes = scopedNodes();
  const maxY = Math.max(540, ...nodes.map(node => (points[node.number]?.y || 0) + 160));
  canvas.style.minHeight = `${maxY}px`;
  for (const node of nodes) {
    const challenge = state.challenges.find(item => item.number === node.number);
    const point = points[node.number] || { x: 500, y: 0 };
    const button = document.createElement("button");
    button.type = "button";
    button.className = "graph-node" + (node.number === selectedNode ? " is-selected" : "");
    button.dataset.number = node.number;
    button.style.left = `${point.x / 10}%`;
    button.style.top = `${point.y + 80}px`;
    button.innerHTML = `<strong>${escapeAttribute(challenge?.draft?.title || challenge?.slug || node.number)}</strong><small>${node.number} · x ${Math.round(point.x)}, y ${Math.round(point.y)}</small>`;
    button.addEventListener("click", () => { selectedNode = node.number; renderGraph(); renderInspector(); });
    button.addEventListener("pointerdown", startDrag);
    canvas.append(button);
  }
  drawWires();
  renderInspector();
}
function drawWires() {
  const svg = $("#graph-wires");
  svg.replaceChildren();
  const canvasBox = $("#graph-canvas").getBoundingClientRect();
  const visible = new Set(scopedNodes().map(node => node.number));
  graph.connections.filter(edge => visible.has(edge.source) && visible.has(edge.target)).forEach(edge => {
    const from = $(`.graph-node[data-number="${edge.source}"]`)?.getBoundingClientRect();
    const to = $(`.graph-node[data-number="${edge.target}"]`)?.getBoundingClientRect();
    if (!from || !to) return;
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const x1 = from.left - canvasBox.left + from.width / 2, y1 = from.bottom - canvasBox.top;
    const x2 = to.left - canvasBox.left + to.width / 2, y2 = to.top - canvasBox.top;
    path.setAttribute("d", `M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`);
    svg.append(path);
  });
}
function startDrag(event) {
  event.preventDefault();
  selectedNode = event.currentTarget.dataset.number;
  const canvas = $("#graph-canvas");
  const move = pointer => {
    const box = canvas.getBoundingClientRect();
    positions()[selectedNode] = {
      x: Math.max(0, Math.min(1000, (pointer.clientX - box.left) * 1000 / box.width)),
      y: Math.max(0, pointer.clientY - box.top - 80 + canvas.scrollTop),
    };
    renderGraph();
  };
  const stop = () => { window.removeEventListener("pointermove", move); window.removeEventListener("pointerup", stop); };
  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}
function renderInspector() {
  $("#graph-node").value = selectedNode || state.challenges[0]?.number || "";
  const node = graphNode(selectedNode);
  $("#graph-topic").disabled = !node;
  $("#remove-node").disabled = !node;
  $("#add-node").disabled = !!node;
  if (node) $("#graph-topic").value = node.topic;
  const host = $("#graph-parents");
  host.replaceChildren();
  if (!node) return;
  graph.nodes.filter(candidate => candidate.number !== node.number).forEach(candidate => {
    const label = document.createElement("label");
    label.className = "graph-parent";
    const checked = graph.connections.some(edge => edge.source === candidate.number && edge.target === node.number);
    label.innerHTML = `<input type="checkbox" value="${candidate.number}" ${checked ? "checked" : ""}> ${candidate.number} · ${escapeAttribute(state.challenges.find(item => item.number === candidate.number)?.draft?.title || candidate.number)}`;
    label.querySelector("input").addEventListener("change", event => {
      graph.connections = graph.connections.filter(edge => !(edge.source === candidate.number && edge.target === node.number));
      if (event.target.checked) graph.connections.push({ source: candidate.number, target: node.number });
      renderGraph();
    });
    host.append(label);
  });
}
$("#graph-node").addEventListener("change", event => { selectedNode = event.target.value; renderGraph(); });
$("#graph-view").addEventListener("change", async () => {
  const view = $("#graph-view").value;
  if (!graph.layouts?.[view]) await resetLayout();
  else renderGraph();
});
$("#graph-topic").addEventListener("change", event => {
  const node = graphNode(selectedNode);
  const oldTopic = node.topic;
  node.topic = event.target.value;
  delete graph.layouts?.[oldTopic]?.[selectedNode];
  renderGraph();
});
$("#add-node").addEventListener("click", () => {
  const number = $("#graph-node").value;
  if (graphNode(number)) return;
  graph.nodes.push({ number, topic: $("#graph-topic").value || state.topics[0].key, displayOrder: graph.nodes.length });
  selectedNode = number;
  renderGraph();
});
$("#remove-node").addEventListener("click", () => {
  graph.nodes = graph.nodes.filter(node => node.number !== selectedNode);
  graph.connections = graph.connections.filter(edge => edge.source !== selectedNode && edge.target !== selectedNode);
  Object.values(graph.layouts || {}).forEach(layout => delete layout[selectedNode]);
  selectedNode = graph.nodes[0]?.number || null;
  renderGraph();
});
async function resetLayout() {
  try {
    const view = $("#graph-view").value;
    const result = await post(state.urls.layout, { graph, view });
    graph.layouts ||= {};
    graph.layouts[view] = result.positions;
    renderGraph();
  } catch (error) { status(error.message, true); }
}
$("#auto-layout").addEventListener("click", resetLayout);
$("#save-graph").addEventListener("click", async () => {
  try {
    const result = await post(state.urls.graph, { id: state.curriculum.id, version: state.curriculum.version, graph });
    Object.assign(state.curriculum, { id: result.id, version: result.version, graph });
    status(`Saved graph draft v${result.version}.`);
  } catch (error) { status(error.message, true); }
});
$("#publish").addEventListener("click", async () => {
  if (!state.curriculum.id) { status("Save the graph before publishing.", true); return; }
  try {
    const result = await post(state.urls.publish, { id: state.curriculum.id, version: state.curriculum.version });
    status(`Published release ${result.releaseId}.`);
  } catch (error) { status(error.message, true); }
});
window.addEventListener("resize", drawWires);
renderInspector();
