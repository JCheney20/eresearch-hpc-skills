// Browser-local learner progress. Stable challenge numbers survive slug/title
// changes; revision and variant pin an attempt to the content it started with.

import { ALL_NODES, nodeBySlug, TOPICS } from "./topics.js";

const KEY = "uwc_hpc_track";
const VERSION = 2;

function emptyProgress() {
  return { version: VERSION, challenges: {} };
}

function write(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* Private browsing or full storage must not stop the trainer working. */
  }
}

function migrateLegacy(value) {
  const progress = emptyProgress();
  const unknown = [];
  const completedAt = new Date().toISOString();
  for (const slug of Array.isArray(value.solved) ? value.solved : []) {
    const node = nodeBySlug(slug);
    if (!node) { unknown.push(slug); continue; }
    progress.challenges[node.number] = {
      revision: node.revision,
      variant: 0,
      startedAt: completedAt,
      completedAt,
    };
  }
  if (unknown.length) progress.legacyUnknown = unknown;
  write(progress);
  return progress;
}

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY)) || {};
    if (value.version === VERSION && value.challenges && typeof value.challenges === "object") {
      return value;
    }
    return migrateLegacy(value);
  } catch {
    return emptyProgress();
  }
}

export function attemptFor(slug) {
  const node = nodeBySlug(slug);
  return node ? read().challenges[node.number] || null : null;
}

export function selectedVariant(slug, count) {
  const attempt = attemptFor(slug);
  if (attempt && Number.isInteger(attempt.variant) && attempt.variant < count) return attempt.variant;
  return count > 1 ? Math.floor(Math.random() * count) : 0;
}

export function solvedSlugs() {
  const progress = read();
  return ALL_NODES
    .filter(node => progress.challenges[node.number]?.completedAt)
    .map(node => node.slug);
}

export function isSolved(slug) {
  return !!attemptFor(slug)?.completedAt;
}

export function markStarted(slug, variant = 0) {
  const node = nodeBySlug(slug);
  if (!node) return;
  const progress = read();
  if (!progress.challenges[node.number]) {
    progress.challenges[node.number] = {
      revision: node.revision,
      variant,
      startedAt: new Date().toISOString(),
      completedAt: null,
    };
    write(progress);
  }
}

export function markSolved(slug, variant = 0) {
  const node = nodeBySlug(slug);
  if (!node) return;
  const progress = read();
  const now = new Date().toISOString();
  const attempt = progress.challenges[node.number] || {
    revision: node.revision,
    variant,
    startedAt: now,
    completedAt: null,
  };
  if (!attempt.completedAt) {
    attempt.completedAt = now;
    progress.challenges[node.number] = attempt;
    write(progress);
  }
}

export function resetProgress() {
  try { localStorage.removeItem(KEY); } catch { /* see write() */ }
}

/* Every known challenge is open. Completion changes progress, not access. */
export function stateOf(slug) {
  if (!nodeBySlug(slug)) return "locked";
  return isSolved(slug) ? "done" : "open";
}

export function topicProgress(topic) {
  let done = 0;
  for (const node of topic.nodes) if (isSolved(node.slug)) done++;
  return { done, total: topic.nodes.length };
}

export function topicState(topic) {
  const progress = topicProgress(topic);
  return progress.done === progress.total ? "done" : "open";
}

export function nextOpen() {
  return ALL_NODES.find(node => stateOf(node.slug) === "open") || null;
}

export function nextAfter(slug, isBuiltFn = () => true) {
  const here = nodeBySlug(slug);
  if (!here) return null;
  const recommended = ALL_NODES
    .filter(node => node.recommendedAfter.includes(here.number) && !isSolved(node.slug) && isBuiltFn(node.slug))
    .sort((a, b) => a.displayNum - b.displayNum)[0];
  if (recommended) return recommended;
  return ALL_NODES
    .filter(node => node.displayNum > here.displayNum && !isSolved(node.slug) && isBuiltFn(node.slug))
    .sort((a, b) => a.displayNum - b.displayNum)[0] || null;
}

export function overallProgress() {
  const solved = new Set(solvedSlugs());
  return {
    done: ALL_NODES.filter(node => solved.has(node.slug)).length,
    total: ALL_NODES.length,
    topics: TOPICS.length,
  };
}
