// The challenge registry.
//
// Four of the nineteen are written. The other fifteen have their place on the
// map — they come from js/track/topics.js, which is the curriculum — but no
// content yet, so the map shows them and will not open them. Adding one means
// writing a file here and importing it; topics.js already knows where it goes.

import whatIsATerminal from "./what-is-a-terminal.js";
import readingFiles from "./reading-files.js";
import bringingFilesBack from "./bringing-files-back.js";
import whenTheLinkDrops from "./when-the-link-drops.js";

import { topicOf } from "../topics.js";

const LIST = [whatIsATerminal, readingFiles, bringingFilesBack, whenTheLinkDrops];

export const CHALLENGES = {};
for (const c of LIST) {
  const where = topicOf(c.slug);
  if (!where) throw new Error(`challenge "${c.slug}" is not placed in js/track/topics.js`);
  c.topicKey = where.topic.key;
  c.requires = where.node.requires;
  CHALLENGES[c.slug] = c;
}

export function getChallenge(slug) {
  return CHALLENGES[slug] || null;
}

export function isBuilt(slug) {
  return Object.prototype.hasOwnProperty.call(CHALLENGES, slug);
}
