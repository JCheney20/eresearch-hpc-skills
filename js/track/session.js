// One challenge, wired to the real shell engine.
//
// This is the single place a challenge becomes a running session, so the
// headless validator (tools/track-validate.mjs) exercises exactly what the
// browser runs — not a reimplementation of it.

import { makeVFS } from "../vfs.js";
import { Shell } from "../shell.js";
import { TRACK_COMMANDS, TLDR } from "./commands.js";
import { topicOf } from "./topics.js";

/* The prompt names the topic instead of the home directory, so the line the
   learner is typing on always says which part of the track they are in:
       hpc@uwc ~/Core $
   Challenges set on the learner's own laptop say so, because scp and rsync
   are run from the laptop and the whole lesson is which machine you are on. */
class TrackShell extends Shell {
  constructor(term, challenge, built, onCommand) {
    super(term, challenge, built);
    this.onCommand = onCommand;
  }

  exec(line) {
    if (line.trim() && this.onCommand) this.onCommand();
    super.exec(line);
  }

  promptStr() {
    const home = "/home/student";
    const where = topicOf(this.level.slug);
    const label = "~/" + (where ? where.topic.name.replace(/\s+/g, "-") : "home");
    let dir = this.ctx.cwd;
    if (dir === home) dir = label;
    else if (dir.startsWith(home + "/")) dir = label + dir.slice(home.length);
    return `${this.ctx.env.USER}@${this.ctx.env.HOSTNAME} ${dir} $ `;
  }
}

export function makeSession(challenge, term, variantIndex = 0, onCommand) {
  const variant = (challenge.variants || [{ i: 0 }])[variantIndex] || { i: 0 };
  const built = challenge.build ? challenge.build(variant) : { fs: {} };

  built.vfs = makeVFS(built.fs || {});
  built.hooks = Object.assign({}, TRACK_COMMANDS, built.hooks || {});
  built.env = Object.assign(
    { USER: "hpc", HOSTNAME: "uwc" },
    challenge.host === "laptop" ? { USER: "you", HOSTNAME: "laptop" } : {},
    built.env || {}
  );

  const shell = new TrackShell(term, challenge, built, onCommand);
  if (challenge.cwd) shell.ctx.cwd = challenge.cwd;
  shell.ctx.tldr = TLDR;
  return { shell, built, variant };
}

/* A terminal that swallows everything, for headless runs. */
export function silentTerm() {
  return { write() {}, onData() {}, focus() {} };
}
