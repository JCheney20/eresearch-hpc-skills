// Progress: which challenges are solved, and therefore which are open.
//
// The old game chained passwords: level N's answer was level N+1's key, so
// the order was the chain. This track uses a concept graph instead — a
// challenge is open when everything in its `requires` is solved — which is
// what lets finishing the core open three routes at once.
//
// Everything lives in localStorage under one key. There are no accounts.

import { ALL_NODES, nodeBySlug, TOPICS } from "./topics.js";

const KEY = "uwc_hpc_track";

function read() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY)) || {};
    return { solved: Array.isArray(p.solved) ? p.solved : [] };
  } catch {
    return { solved: [] };
  }
}

function write(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* private browsing, storage full: the session still works, it just will
       not be remembered. Nothing here is worth failing a render over. */
  }
}

export function solvedSlugs() {
  return read().solved;
}

export function isSolved(slug) {
  return read().solved.includes(slug);
}

export function markSolved(slug) {
  const p = read();
  if (!p.solved.includes(slug)) {
    p.solved.push(slug);
    write(p);
  }
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* see write() */ }
}

/* "done" | "open" | "locked" — the one rule, applied everywhere. */
export function stateOf(slug) {
  const node = nodeBySlug(slug);
  if (!node) return "locked";
  if (isSolved(slug)) return "done";
  const solved = read().solved;
  return (node.requires || []).every(r => solved.includes(r)) ? "open" : "locked";
}

export function topicProgress(topic) {
  let done = 0;
  for (const node of topic.nodes) if (isSolved(node.slug)) done++;
  return { done, total: topic.nodes.length };
}

export function topicState(topic) {
  const prog = topicProgress(topic);
  if (prog.done === prog.total) return "done";
  return topic.nodes.some(n => stateOf(n.slug) === "open") ? "open" : "locked";
}

/* What did solving this open up? Used for the line after a correct answer. */
export function unlockedBy(slug) {
  const solved = read().solved;
  return ALL_NODES.filter(n =>
    !solved.includes(n.slug) &&
    (n.requires || []).includes(slug) &&
    (n.requires || []).every(r => solved.includes(r))
  );
}

/* The next thing worth doing: the open challenge with the lowest number. */
export function nextOpen() {
  return ALL_NODES.filter(n => stateOf(n.slug) === "open").sort((a, b) => a.num - b.num)[0] || null;
}

export function overallProgress() {
  const solved = read().solved;
  return {
    done: ALL_NODES.filter(n => solved.includes(n.slug)).length,
    total: ALL_NODES.length,
    topics: TOPICS.length,
  };
}
