// Open curriculum navigation: choose a Topic or view every recommended
// connection in Your Journey. Lines guide; they never gate access.

import { el, svg, clear, ICON } from "./dom.js";
import { topbar } from "./parts.js";
import { ALL_NODES, TOPICS, topicByKey } from "../topics.js";
import { isSolved, overallProgress, topicProgress } from "../progress.js";
import { isBuilt } from "../challenges/index.js";

const TOPIC_ICONS = {
  linux: '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M6 8h20v16H6zM6 19h20M10 12l3 3-3 3M16 18h5"/></svg>',
  git: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="9" cy="8" r="3"/><circle cx="23" cy="16" r="3"/><circle cx="9" cy="24" r="3"/><path d="M9 11v10M12 8h3a8 8 0 0 1 8 5"/></svg>',
  hpc: '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="5" y="5" width="22" height="7" rx="1"/><rect x="5" y="20" width="22" height="7" rx="1"/><path d="M9 8.5h.01M13 8.5h9M9 23.5h.01M13 23.5h9M16 12v8"/></svg>',
};

function heading(label, title, lede) {
  const head = el("header", "journeyhead");
  const copy = el("div");
  copy.append(el("span", "headrule wide"), el("p", "cnum", label), el("h1", "ctitle", title), el("p", "lede", lede));
  head.append(copy);
  return head;
}

function topicCard(topic) {
  const progress = topicProgress(topic);
  const link = el("a", "topiccard");
  link.href = `#/topic/${topic.key}`;

  const icon = el("span", "topicicon", TOPIC_ICONS[topic.key] || "");
  const copy = el("span", "topiccopy");
  copy.append(el("strong", "", topic.name), el("small", "", topic.blurb));
  const meter = el("span", "topicmeter");
  meter.append(el("span", "", `<b>${progress.done}</b> of ${progress.total}`));
  const bar = el("i");
  const fill = el("i");
  fill.setAttribute("style", `--topic-progress:${progress.total ? progress.done / progress.total : 0}`);
  bar.append(fill);
  meter.append(bar);
  const open = el("span", "topicopen", "Open Topic →");
  link.append(icon, copy, meter, open);
  return link;
}

function landing() {
  const section = el("section", "curriculumhome");
  const tools = el("div", "journeytools");
  tools.append(el("span", "", "Browse one Topic or view the whole path."));
  const journey = el("a", "btn");
  journey.href = "#/journey";
  journey.textContent = "Your Journey →";
  tools.append(journey);
  section.append(tools);
  section.append(heading(
    "Open curriculum",
    "Choose a Topic",
    "Every challenge is available from the start. The trees suggest a useful order without preventing you from jumping directly to what you need.",
  ));
  const cards = el("div", "topicgrid");
  TOPICS.forEach(topic => cards.append(topicCard(topic)));
  section.append(cards);
  return section;
}

function levelsFor(nodes) {
  const selected = new Map(nodes.map(node => [node.number, node]));
  const memo = new Map();
  function level(node, visiting = new Set()) {
    if (memo.has(node.number)) return memo.get(node.number);
    if (visiting.has(node.number)) return 0;
    const nextVisiting = new Set(visiting).add(node.number);
    const parents = node.recommendedAfter.map(number => selected.get(number)).filter(Boolean);
    const value = parents.length ? 1 + Math.max(...parents.map(parent => level(parent, nextVisiting))) : 0;
    memo.set(node.number, value);
    return value;
  }
  const rows = [];
  nodes.forEach(node => (rows[level(node)] ||= []).push(node));
  return rows;
}

function spreadTerminalNodes(row, nodes) {
  const terminal = row.filter(node => !nodes.some(next => next.recommendedAfter.includes(node.number)));
  const continuing = row.filter(node => !terminal.includes(node));
  const split = Math.ceil(terminal.length / 2);
  return [...terminal.slice(0, split), ...continuing, ...terminal.slice(split)];
}

function arrowDefs(markerId) {
  const defs = svg("defs");
  const marker = svg("marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("viewBox", "0 0 8 8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto");
  const head = svg("path");
  head.setAttribute("d", "M .5 .8 L 7 4 L .5 7.2");
  head.setAttribute("class", "wirehead");
  marker.append(head);
  defs.append(marker);
  return defs;
}

function drawWires(graph, wires, elements, nodes, markerId) {
  function redraw() {
    const box = graph.getBoundingClientRect();
    if (!box.width || !box.height) return;
    wires.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    clear(wires);
    wires.append(arrowDefs(markerId));

    for (const node of nodes) {
      const toElement = elements.get(node.number);
      if (!toElement) continue;
      for (const source of node.recommendedAfter) {
        const fromElement = elements.get(source);
        if (!fromElement) continue;
        const fromBox = fromElement.getBoundingClientRect();
        const toBox = toElement.getBoundingClientRect();
        const from = { x: fromBox.left - box.left + fromBox.width / 2, y: fromBox.bottom - box.top };
        const to = { x: toBox.left - box.left + toBox.width / 2, y: toBox.top - box.top };
        const bend = Math.max(24, (to.y - from.y) * 0.48);
        const path = svg("path");
        path.setAttribute("d", `M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${to.x} ${to.y - bend}, ${to.x} ${to.y}`);
        path.setAttribute("class", "wire");
        path.setAttribute("marker-end", `url(#${markerId})`);
        wires.append(path);
      }
    }
  }

  requestAnimationFrame(redraw);
  if (typeof ResizeObserver === "function") new ResizeObserver(() => requestAnimationFrame(redraw)).observe(graph);
  else window.addEventListener("resize", redraw);
}

function pathNode(node, recommended) {
  const built = isBuilt(node.slug);
  const card = document.createElement(built ? "a" : "div");
  card.className = "pathnode" + (isSolved(node.slug) ? " is-done" : recommended ? " is-next" : "");
  if (built) card.href = `#/c/${node.slug}`;
  else card.setAttribute("aria-disabled", "true");

  const state = el("span", "pathstate");
  state.innerHTML = isSolved(node.slug) ? ICON.tick + "Complete" : recommended ? "Recommended next" : "Available";
  card.append(state, el("strong", "", node.title), el("small", "", node.topicKey.toUpperCase()));
  if (node.commands?.length) card.append(el("span", "pathcommands", node.commands.map(command => `<code>${command}</code>`).join(" ")));
  return card;
}

function graphFor(nodes, name) {
  const graph = el("div", "journeygraph");
  graph.setAttribute("aria-label", `${name} recommended learning tree`);
  const wires = svg("svg");
  wires.setAttribute("class", "wires");
  wires.setAttribute("aria-hidden", "true");
  graph.append(wires);

  const elements = new Map();
  const firstOpen = nodes.find(node => !isSolved(node.slug) && isBuilt(node.slug));
  for (const level of levelsFor(nodes)) {
    const row = el("div", "journeyrow");
    for (const node of spreadTerminalNodes(level, nodes)) {
      const card = pathNode(node, node === firstOpen);
      elements.set(node.number, card);
      row.append(card);
    }
    graph.append(row);
  }
  drawWires(graph, wires, elements, nodes, `journey-arrow-${name.toLowerCase().replace(/\W+/g, "-")}`);
  return graph;
}

function graphPage(topic) {
  const page = el("section", "journeypage");
  const tools = el("div", "journeytools");
  const back = el("a", "btn ghost", "← All Topics");
  back.href = "#/";
  if (topic) {
    const all = el("a", "btn", "Your Journey →");
    all.href = "#/journey";
    tools.append(back, all);
  } else {
    tools.append(el("span", "", "All Topics shown as one connected route."), back);
  }
  page.append(tools);

  if (topic) {
    page.append(heading("Focused Topic", topic.name, topic.blurb));
    page.append(el("p", "graphnote", "Lines show the recommended order. Every challenge can be opened now."));
    page.append(graphFor(topic.nodes, topic.name));
  } else {
    page.append(heading(
      "Your Journey",
      "See the whole picture",
      "Start at the beginning and follow the branches, or jump directly to any challenge. Connections recommend a logical path; they do not lock content.",
    ));
    page.append(el("p", "graphnote", "Recommended path · every node is available"));
    page.append(graphFor(ALL_NODES, "Complete journey"));
  }
  return page;
}

export function renderMap(mount, view = {}) {
  const root = el("div", "app");
  const scroll = el("div", "mapscroll");
  const page = el("main", "mappage");
  const topic = view.topicKey ? topicByKey(view.topicKey) : null;
  page.append(view.journey || topic ? graphPage(topic) : landing());
  scroll.append(page);
  root.append(topbar(null), scroll);
  mount(root);
  return root;
}
