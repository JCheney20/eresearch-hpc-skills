// The map: the curriculum drawn as the graph it is.
//
// Core at the top, the three routes across the middle, the finale at the
// foot. The individual challenges are not on this screen — a beginner opening
// the map wants to know how much of a topic is behind them, not to read
// nineteen cards — so each topic is one bubble carrying its name, an
// "x out of y", and a pip per challenge. The challenges live one click in.
//
// A three-column grid places the bubbles; an SVG overlay measured from where
// they actually landed draws the wires. The grid is the structure: if the SVG
// never renders, the shape still reads.

import { el, svg, clear, ICON } from "./dom.js";
import { topbar } from "./parts.js";
import { ALL_NODES, TOPICS, ROUTE_KEYS, topicByKey } from "../topics.js";
import { stateOf, topicProgress, topicState, overallProgress, isSolved } from "../progress.js";
import { isBuilt } from "../challenges/index.js";

/* ---- bubbles ------------------------------------------------------------ */

function bubble(topic) {
  const state = topicState(topic);
  const prog = topicProgress(topic);
  const clickable = state !== "locked";

  const node = document.createElement(clickable ? "button" : "div");
  node.className = "bubble is-" + state;
  if (clickable) {
    node.type = "button";
    node.addEventListener("click", () => openTopicPanel(topic));
  } else {
    node.setAttribute("aria-disabled", "true");
  }

  /* The padlock is decoration; the word itself is spoken. */
  const label = state === "locked" ? "Locked" : "Unlocked";
  const mark = el("span", "bstate");
  mark.innerHTML = (state === "locked" ? ICON.locked : ICON.unlocked) +
    `<span class="vh">${label}</span>`;
  mark.title = label;
  node.append(mark);

  node.append(el("h2", "bname", topic.name));
  node.append(el("p", "bcount", `${prog.done} out of ${prog.total}`));

  const pips = el("div", "bpips");
  pips.setAttribute("aria-hidden", "true");
  for (const item of topic.nodes) {
    pips.append(el("span", "bpip is-" + stateOf(item.slug)));
  }
  node.append(pips);

  return node;
}

/* ---- one challenge, inside the topic panel ------------------------------ */

function pad(n) { return String(n).padStart(2, "0"); }

function stateLabel(state) {
  if (state === "done") return ICON.tick + "Done";
  if (state === "open") return ICON.unlocked + "Start here";
  return ICON.locked + "Locked";
}

/* Why a locked challenge is locked. A challenge may say it in its own words;
   otherwise it is derived from what it requires, so a card can never sit there
   saying "Locked" and nothing else. */
function waitsHTML(item) {
  if (item.waitsText) return item.waitsText;

  const groups = item.prerequisiteGroups.map(group => {
    const names = group.sources
      .map(source => ALL_NODES.find(node => node.number === source))
      .filter(Boolean)
      .map(node => `<strong>${node.title}</strong> (challenge ${node.num})`);
    if (names.length === 1) return names[0];
    const joined = `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
    return group.mode === "any" ? `one of ${joined}` : `all of ${joined}`;
  });
  if (groups.length === 0) return "";
  return `Waits for ${groups.join(" and ")}.`;
}

function nodeCard(item) {
  const state = stateOf(item.slug);
  const built = isBuilt(item.slug);
  const clickable = state !== "locked" && built;

  const card = document.createElement(clickable ? "a" : "div");
  card.className = "node is-" + state;
  if (clickable) {
    card.href = "#/c/" + item.slug;
    card.addEventListener("click", closeModal);
  }

  const head = el("div", "nhead");
  head.append(el("span", "nnum", "Challenge " + pad(item.num)));
  const st = el("span", "nstate");
  st.innerHTML = stateLabel(state);
  head.append(st);
  card.append(head);

  card.append(el("h3", "ntitle", item.title));

  if (item.commands && item.commands.length) {
    const chips = el("div", "ncmds");
    for (const c of item.commands) chips.append(el("code", "", c));
    card.append(chips);
  }
  if (item.line) card.append(el("p", "nline", item.line));

  if (state === "locked") {
    const why = waitsHTML(item);
    if (why) card.append(el("p", "nwaits", why));
  } else if (!built) {
    card.append(el("p", "nstub", "Not written yet. Its place on the map is real; its content is not."));
  }
  if (item.note) card.append(el("p", "nnote", item.note));

  return card;
}

/* ---- modals ------------------------------------------------------------- */

let openDialog = null;
let lastFocus = null;

function closeModal() {
  if (!openDialog) return;
  openDialog.remove();
  openDialog = null;
  document.removeEventListener("keydown", onModalKey);
  if (lastFocus && lastFocus.focus) lastFocus.focus();
}

function onModalKey(ev) { if (ev.key === "Escape") closeModal(); }

function modal(title, buildBody) {
  closeModal();
  lastFocus = document.activeElement;

  const back = el("div", "modalback");
  const box = el("div", "modal");
  box.setAttribute("role", "dialog");
  box.setAttribute("aria-modal", "true");
  box.setAttribute("aria-label", title);

  const head = el("div", "modalhead");
  head.append(el("h2", "", title));
  const x = el("button", "modalclose", "×");
  x.type = "button";
  x.setAttribute("aria-label", "Close");
  x.addEventListener("click", closeModal);
  head.append(x);

  const body = el("div", "modalbody");
  buildBody(body);

  box.append(head, body);
  back.append(box);
  back.addEventListener("mousedown", ev => { if (ev.target === back) closeModal(); });

  document.body.append(back);
  document.addEventListener("keydown", onModalKey);
  openDialog = back;
  x.focus();
}

function openTopicPanel(topic) {
  modal(topic.name, body => {
    const prog = topicProgress(topic);
    body.append(el("p", "modallede",
      `${topic.blurb} <strong>${prog.done} out of ${prog.total}</strong> done.`));
    const stack = el("div", "nodestack");
    for (const item of topic.nodes) stack.append(nodeCard(item));
    body.append(stack);
  });
}

/* Shown once, at the moment the core is finished — that is when it becomes
   true, and it is a thing you are told once rather than a band that lives on
   the page for ever. */
function openRoutesModal() {
  modal("Three routes open here", body => {
    body.append(el("p", "modallede",
      "Finishing <code>ssh</code> opens all three routes at once. This is not a fork " +
      "you can get wrong: you take all three before the last challenge, and picking " +
      "one now closes nothing off."));

    const list = el("div", "routelist");
    for (const key of ROUTE_KEYS) {
      const topic = topicByKey(key);
      if (!topic) continue;
      const row = el("div", "routerow");
      row.append(el("h3", "", topic.name));
      row.append(el("p", "", topic.blurb));
      row.append(el("p", "routemeta", `${topic.nodes.length} challenges`));
      list.append(row);
    }
    body.append(list);

    body.append(el("p", "modalfoot",
      "Start with the route you need first. If none of them is more urgent, take " +
      "them in the order shown."));

    const actions = el("div", "modalactions");
    const ok = el("button", "btn", "Got it");
    ok.type = "button";
    ok.addEventListener("click", closeModal);
    actions.append(ok);
    body.append(actions);
  });
}

/* ---- the wires ---------------------------------------------------------- */

function arrowDefs() {
  const defs = svg("defs");
  const marker = svg("marker");
  marker.setAttribute("id", "wire-arrow");
  marker.setAttribute("viewBox", "0 0 8 8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("markerWidth", "7");
  marker.setAttribute("markerHeight", "7");
  marker.setAttribute("orient", "auto-start-reverse");
  marker.setAttribute("markerUnits", "userSpaceOnUse");
  const head = svg("path");
  head.setAttribute("d", "M 0.5 0.8 L 7 4 L 0.5 7.2");
  head.setAttribute("class", "wirehead");
  marker.append(head);
  defs.append(marker);
  return defs;
}

function drawWires(graph, wires, nodes, routes) {
  function redraw() {
    const box = graph.getBoundingClientRect();
    if (!box.width || !box.height) return;
    wires.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    wires.setAttribute("preserveAspectRatio", "none");
    clear(wires);
    wires.append(arrowDefs());

    const bottom = n => {
      const r = n.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.bottom - box.top };
    };
    const top = n => {
      const r = n.getBoundingClientRect();
      return { x: r.left - box.left + r.width / 2, y: r.top - box.top };
    };

    function wire(from, to, locked) {
      const dy = Math.max(18, (to.y - from.y) * 0.55);
      const p = svg("path");
      p.setAttribute("d",
        `M ${from.x} ${from.y} C ${from.x} ${from.y + dy}, ${to.x} ${to.y - dy}, ${to.x} ${to.y}`);
      p.setAttribute("class", "wire" + (locked ? " is-locked" : ""));
      p.setAttribute("marker-end", "url(#wire-arrow)");
      wires.append(p);
    }

    for (const topic of routes) {
      const node = nodes[topic.key];
      if (!node) continue;
      const locked = node.classList.contains("is-locked");
      if (nodes.core) wire(bottom(nodes.core), top(node), locked);
      if (nodes.finale) wire(bottom(node), top(nodes.finale), nodes.finale.classList.contains("is-locked"));
    }
  }

  requestAnimationFrame(redraw);
  if (typeof ResizeObserver === "function") {
    new ResizeObserver(() => requestAnimationFrame(redraw)).observe(graph);
  } else {
    window.addEventListener("resize", () => requestAnimationFrame(redraw));
  }
}

function buildGraph() {
  const graph = el("div", "graph");
  const wires = svg("svg");
  wires.setAttribute("class", "wires");
  wires.setAttribute("aria-hidden", "true");
  graph.append(wires);

  const nodes = {};
  const core = topicByKey("core");
  const finale = topicByKey("finale");
  const routes = ROUTE_KEYS.map(topicByKey).filter(Boolean);

  if (core) {
    const cell = el("div", "gcell gcell-core");
    nodes.core = bubble(core);
    cell.append(nodes.core);
    graph.append(cell);
  }
  routes.forEach((topic, i) => {
    const cell = el("div", `gcell gcell-route col-${i + 1}`);
    nodes[topic.key] = bubble(topic);
    cell.append(nodes[topic.key]);
    graph.append(cell);
  });
  if (finale) {
    const cell = el("div", "gcell gcell-finale");
    nodes.finale = bubble(finale);
    cell.append(nodes.finale);
    graph.append(cell);
  }

  drawWires(graph, wires, nodes, routes);
  return graph;
}

/* ---- the screen --------------------------------------------------------- */

let routesShown = false;

export function renderMap(mount) {
  const root = el("div", "app");
  root.append(topbar(null));

  const scroll = el("div", "mapscroll");
  const page = el("div", "mappage");

  const p = overallProgress();
  const head = el("div", "pagehead");
  head.append(el("span", "headrule wide"));
  head.append(el("div", "cnum", "Your map"));
  head.append(el("h1", "ctitle", p.done === 0 ? "Start here" : "Where you are"));
  head.append(el("p", "lede",
    `${p.topics} topics, ${p.total} challenges. The core takes everyone from the prompt ` +
    "to logging in to the cluster. After that, three routes open at once — you take all " +
    "three before the last challenge, in whatever order suits you."));
  page.append(head);

  page.append(buildGraph());

  page.append(el("p", "demonote",
    "Open a topic to see its challenges. Four of the nineteen are written; the rest " +
    "show their place on the map and will not open yet."));

  const actions = el("div", "mapactions");
  const why = el("button", "btn ghost small", "Why three routes?");
  why.type = "button";
  why.addEventListener("click", openRoutesModal);
  actions.append(why);
  page.append(actions);

  scroll.append(page);
  root.append(scroll);

  const core = topicByKey("core");
  const coreDone = core && core.nodes.every(n => isSolved(n.slug));
  if (coreDone && !routesShown) {
    routesShown = true;
    setTimeout(openRoutesModal, 350);
  }

  mount(root, closeModal);
  return root;
}
