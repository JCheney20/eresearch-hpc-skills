// Runtime projection of the authored curriculum. Graph connections recommend a
// useful order; they never gate access to a challenge.

import { CONTENT_RELEASE } from "./content.js";

const authored = CONTENT_RELEASE.topics.flatMap(topic =>
  topic.challenges.map(challenge => ({ ...challenge, topicKey: topic.key }))
);
const byNumber = new Map(authored.map(challenge => [challenge.number, challenge]));

let displayNumber = 0;
export const TOPICS = CONTENT_RELEASE.topics.map(topic => ({
  key: topic.key,
  name: topic.name,
  blurb: topic.blurb,
  nodes: topic.challenges.map(challenge => ({
    ...challenge,
    num: Number.parseInt(challenge.number, 16),
    displayNum: displayNumber++,
    topicKey: topic.key,
    recommendedSlugs: challenge.recommendedAfter
      .map(number => byNumber.get(number)?.slug)
      .filter(Boolean),
  })),
}));

export const ROUTE_KEYS = TOPICS.map(topic => topic.key);
export const CORE_KEY = "linux";
export const FINALE_KEY = "hpc";

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
    displayNum: node.displayNum,
    first: topic.nodes[0].displayNum,
    last: topic.nodes[topic.nodes.length - 1].displayNum,
  };
}

export function nodeBySlug(slug) {
  return nodesBySlug.get(slug) || null;
}

export function nodeByNumber(number) {
  return nodesByNumber.get(number) || null;
}

// Kept while existing callers migrate; open curriculum always satisfies access.
export function requirementsMet() {
  return true;
}
