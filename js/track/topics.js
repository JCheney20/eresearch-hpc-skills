// Curriculum projection for the learner UI.
//
// The authored graph lives in content.js as explicit prerequisite groups.
// Topics are presentation only; their order no longer creates dependencies.

import { CONTENT_RELEASE } from "./content.js";

const authored = CONTENT_RELEASE.topics.flatMap(topic =>
  topic.challenges.map(challenge => ({ ...challenge, topicKey: topic.key }))
);
const byNumber = new Map(authored.map(challenge => [challenge.number, challenge]));

function sourceSlugs(groups) {
  return groups.flatMap(group => group.sources)
    .map(number => byNumber.get(number))
    .filter(Boolean)
    .map(challenge => challenge.slug);
}

export const TOPICS = CONTENT_RELEASE.topics.map(topic => ({
  key: topic.key,
  name: topic.name,
  blurb: topic.blurb,
  nodes: topic.challenges.map(challenge => ({
    ...challenge,
    num: Number.parseInt(challenge.number, 16),
    topicKey: topic.key,
    // Compatibility for existing display code. Unlocking uses prerequisiteGroups.
    requires: sourceSlugs(challenge.prerequisiteGroups),
  })),
}));

export const ROUTE_KEYS = ["transfer", "git", "cluster"];
export const CORE_KEY = "core";
export const FINALE_KEY = "finale";

const byKey = new Map(TOPICS.map(topic => [topic.key, topic]));
export const ALL_NODES = TOPICS.flatMap(topic => topic.nodes);
const nodesBySlug = new Map(ALL_NODES.map(node => [node.slug, node]));
const nodesByNumber = new Map(ALL_NODES.map(node => [node.number, node]));

export const TOTAL = ALL_NODES.length;

export function topicByKey(key) {
  return byKey.get(key) || null;
}

export function topicOf(slugOrChallenge) {
  const slug = typeof slugOrChallenge === "string"
    ? slugOrChallenge
    : slugOrChallenge && slugOrChallenge.slug;
  const node = nodesBySlug.get(slug);
  if (!node) return null;
  const topic = byKey.get(node.topicKey);
  const index = topic.nodes.findIndex(item => item.slug === slug);
  return {
    topic,
    node,
    index,
    count: topic.nodes.length,
    num: node.num,
    first: topic.nodes[0].num,
    last: topic.nodes[topic.nodes.length - 1].num,
  };
}

export function nodeBySlug(slug) {
  return nodesBySlug.get(slug) || null;
}

export function nodeByNumber(number) {
  return nodesByNumber.get(number) || null;
}

export function requirementsMet(node, completedNumbers) {
  const done = completedNumbers instanceof Set
    ? completedNumbers
    : new Set(completedNumbers);
  return node.prerequisiteGroups.every(group => {
    if (group.mode === "all") return group.sources.every(source => done.has(source));
    if (group.mode === "any") return group.sources.some(source => done.has(source));
    return false;
  });
}
