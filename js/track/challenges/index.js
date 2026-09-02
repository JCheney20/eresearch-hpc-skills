// The challenge registry.
//
// All twenty-two are written. js/track/content.js owns their stable identities,
// topic membership and explicit prerequisite graph. This compatibility registry
// supplies the existing prose and worlds while those modules are migrated to
// the declarative content format.

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

import { topicOf } from "../topics.js";

const LIST = [
  whatIsATerminal, whereAmI, movingAround, sameCommandMoreQuestions, askTheMachine,
  readingFiles, findingTheLine, findingTheFile, gettingOnTheCluster,
  movingFilesIntroduction, bringingFilesBack, whenTheLinkDrops,
  keepingARecordIntroduction, whatChanged, savingYourWork, gettingTheLatest,
  runningWorkIntroduction, isThereRoom, whatsRunning, submittingAJob, watchingItChange,
  puttingItTogether,
];

export const CHALLENGES = {};
for (const c of LIST) {
  const where = topicOf(c.slug);
  if (!where) throw new Error(`challenge "${c.slug}" is not placed in js/track/topics.js`);
  c.topicKey = where.topic.key;
  c.number = where.node.number;
  c.displayNum = where.node.displayNum;
  c.revision = where.node.revision;
  c.kind = where.node.kind;
  c.revisionId = where.node.id;
  c.prerequisiteGroups = where.node.prerequisiteGroups;
  c.requires = where.node.requires;
  CHALLENGES[c.slug] = c;
}

export function getChallenge(slug) {
  return CHALLENGES[slug] || null;
}

export function isBuilt(slug) {
  return Object.prototype.hasOwnProperty.call(CHALLENGES, slug);
}
