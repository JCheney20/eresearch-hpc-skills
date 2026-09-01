// The challenge registry.
//
// All nineteen are written. js/track/topics.js is the curriculum — it decides
// where a challenge sits and what unlocks it — and this file decides what is
// actually playable. Adding a challenge means writing its file and importing
// it here; a challenge on the map with no file shows its place and does not
// open, which is how a half-written track stays honest.

import whatIsATerminal from "./what-is-a-terminal.js";
import whereAmI from "./where-am-i.js";
import movingAround from "./moving-around.js";
import sameCommandMoreQuestions from "./same-command-more-questions.js";
import askTheMachine from "./ask-the-machine.js";
import readingFiles from "./reading-files.js";
import findingTheLine from "./finding-the-line.js";
import findingTheFile from "./finding-the-file.js";
import gettingOnTheCluster from "./getting-on-the-cluster.js";
import bringingFilesBack from "./bringing-files-back.js";
import whenTheLinkDrops from "./when-the-link-drops.js";
import whatChanged from "./what-changed.js";
import savingYourWork from "./saving-your-work.js";
import gettingTheLatest from "./getting-the-latest.js";
import isThereRoom from "./is-there-room.js";
import whatsRunning from "./whats-running.js";
import submittingAJob from "./submitting-a-job.js";
import watchingItChange from "./watching-it-change.js";
import puttingItTogether from "./putting-it-together.js";

import { topicOf } from "../topics.js";

const LIST = [
  whatIsATerminal, whereAmI, movingAround, sameCommandMoreQuestions, askTheMachine,
  readingFiles, findingTheLine, findingTheFile, gettingOnTheCluster,
  bringingFilesBack, whenTheLinkDrops,
  whatChanged, savingYourWork, gettingTheLatest,
  isThereRoom, whatsRunning, submittingAJob, watchingItChange,
  puttingItTogether,
];

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
