// The challenge registry.
//
// js/track/content.js owns stable identities, Topic membership and recommended
// connections. This registry joins existing code-challenge modules with imported
// static block documents while worlds migrate to the declarative format.

import whatIsATerminal from "./what-is-a-terminal.js";
import whereAmI from "./where-am-i.js";
import movingAround from "./moving-around.js";
import sameCommandMoreQuestions from "./same-command-more-questions.js";
import askTheMachine from "./ask-the-machine.js";
import readingFiles from "./reading-files.js";
import findingTheLine from "./finding-the-line.js";
import findingTheFile from "./finding-the-file.js";
import gettingOnTheCluster from "./getting-on-the-cluster.js";
import movingFilesIntroduction from "./moving-files-introduction.js";
import bringingFilesBack from "./bringing-files-back.js";
import whenTheLinkDrops from "./when-the-link-drops.js";
import keepingARecordIntroduction from "./keeping-a-record-introduction.js";
import whatChanged from "./what-changed.js";
import savingYourWork from "./saving-your-work.js";
import gettingTheLatest from "./getting-the-latest.js";
import runningWorkIntroduction from "./running-work-introduction.js";
import isThereRoom from "./is-there-room.js";
import whatsRunning from "./whats-running.js";
import submittingAJob from "./submitting-a-job.js";
import watchingItChange from "./watching-it-change.js";
import puttingItTogether from "./putting-it-together.js";

import { ALL_NODES } from "../topics.js";

const LIST = [
  whatIsATerminal, whereAmI, movingAround, sameCommandMoreQuestions, askTheMachine,
  readingFiles, findingTheLine, findingTheFile, gettingOnTheCluster,
  movingFilesIntroduction, bringingFilesBack, whenTheLinkDrops,
  keepingARecordIntroduction, whatChanged, savingYourWork, gettingTheLatest,
  runningWorkIntroduction, isThereRoom, whatsRunning, submittingAJob, watchingItChange,
  puttingItTogether,
];
const authored = new Map(LIST.map(challenge => [challenge.slug, challenge]));

export const CHALLENGES = {};
for (const node of ALL_NODES) {
  // Imported reading lessons are static block documents. They intentionally
  // replace an older compatibility module when they reuse its stable ID.
  const challenge = node.contentUrl ? {} : authored.get(node.slug);
  if (!challenge) continue;
  Object.assign(challenge, node, {
    revisionId: node.id,
    requires: node.recommendedSlugs,
  });
  CHALLENGES[node.slug] = challenge;
}

export function getChallenge(slug) {
  return CHALLENGES[slug] || null;
}

export function isBuilt(slug) {
  return Object.prototype.hasOwnProperty.call(CHALLENGES, slug);
}
