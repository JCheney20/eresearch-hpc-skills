// Progress: which challenges are solved, and therefore which are open.
//
// The old game chained passwords: level N's answer was level N+1's key. This
// track uses explicit prerequisite groups, so a challenge can require all or
// any of a set of earlier challenges.
//
// Everything lives in localStorage under one key. There are no accounts.

import { ALL_NODES, nodeBySlug, requirementsMet, TOPICS } from "./topics.js";

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
function completedNumbers(solved) {
  return new Set(solved.map(nodeBySlug).filter(Boolean).map(node => node.number));
}

export function stateOf(slug) {
  const node = nodeBySlug(slug);
  if (!node) return "locked";
  if (isSolved(slug)) return "done";
  return requirementsMet(node, completedNumbers(read().solved)) ? "open" : "locked";
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
  const source = nodeBySlug(slug);
  if (!source) return [];
  const completed = completedNumbers([...solved, slug]);
  return ALL_NODES.filter(node =>
    !solved.includes(node.slug) &&
    node.prerequisiteGroups.some(group => group.sources.includes(source.number)) &&
    requirementsMet(node, completed)
  );
}

/* The next thing worth doing: the open challenge with the lowest number. */
export function nextOpen() {
  return ALL_NODES.filter(n => stateOf(n.slug) === "open").sort((a, b) => a.num - b.num)[0] || null;
}

/* Where "next challenge" goes after finishing one.
 *
 * The lowest-numbered challenge after this one that is not locked. At the
 * branch — finishing the core opens all three routes at once — that rule
 * picks the leftmost route on the map, because the map is laid out in number
 * order and the leftmost route's head is the lowest number of the three. So
 * the button is always "carry straight on", and the map is there for anyone
 * who would rather take a different route.
 *
 * `built` is asked as well as `stateOf`, so the button can never point at a
 * challenge that has a place on the map but no content yet.
 */
export function nextAfter(slug, isBuiltFn = () => true) {
  const here = nodeBySlug(slug);
  if (!here) return null;
  return ALL_NODES
    .filter(n => n.num > here.num && stateOf(n.slug) !== "locked" && isBuiltFn(n.slug))
    .sort((a, b) => a.num - b.num)[0] || null;
}

export function overallProgress() {
  const solved = read().solved;
  return {
    done: ALL_NODES.filter(n => solved.includes(n.slug)).length,
    total: ALL_NODES.length,
    topics: TOPICS.length,
  };
}
