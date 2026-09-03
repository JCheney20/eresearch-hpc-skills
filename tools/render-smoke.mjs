// Headless render of every screen: node tools/render-smoke.mjs
//
// tools/track-validate.mjs proves the content is solvable and honest. This
// proves the pages that show it actually build — every screen, in every
// progress state that changes what a screen does — because a trainer that
// throws on render is not reviewable, and there is no browser in here to
// find that out any other way.

import { installFakeDom, recordingTerminal } from "./fakedom.mjs";

const { document } = installFakeDom(globalThis);
globalThis.window = globalThis;
// Imported block documents are exercised by browser checks; the fake DOM has
// no URL base or template parser, so keep this render suite synchronous.
globalThis.fetch = undefined;

const root = document.createElement("div");
root.id = "app";
document.body.append(root);

const { renderMap } = await import("../js/track/ui/map.js");
const { renderChallenge } = await import("../js/track/ui/challenge.js");
const { renderReading } = await import("../js/track/ui/reading.js");
const { CHALLENGES, isBuilt } = await import("../js/track/challenges/index.js");
const { TOPICS, ALL_NODES } = await import("../js/track/topics.js");
const { attemptFor, markSolved, resetProgress, stateOf, nextOpen, nextAfter } = await import("../js/track/progress.js");
const { makeSession } = await import("../js/track/session.js");

let total = 0, failed = 0;
function check(desc, cond, detail) {
  total++;
  if (cond) console.log(`ok   - ${desc}`);
  else { failed++; console.log(`FAIL - ${desc}${detail ? `\n       ${detail}` : ""}`); }
}

let disposeMounted = null;
function mount(node, dispose) {
  if (disposeMounted) disposeMounted();
  disposeMounted = dispose || null;
  root.replaceChildren(node);
  return node;
}
function find(node, cls) { return node.querySelectorAll("." + cls); }
function tryRender(desc, fn) {
  total++;
  try { const n = fn(); console.log(`ok   - ${desc}`); return n; }
  catch (e) { failed++; console.log(`FAIL - ${desc}\n       ${e && e.stack || e}`); return null; }
}

/* ---- legacy progress migration ------------------------------------------ */

resetProgress();
localStorage.setItem("uwc_hpc_track", JSON.stringify({
  solved: ["reading-files", "removed-challenge"],
}));
const migrated = attemptFor("reading-files");
check("legacy slug progress migrates to a stable challenge revision",
  migrated && migrated.revision === "001" && migrated.completedAt);
const migratedStorage = JSON.parse(localStorage.getItem("uwc_hpc_track"));
check("legacy progress migration preserves unknown slugs for recovery",
  migratedStorage.version === 2 && migratedStorage.legacyUnknown[0] === "removed-challenge");

/* ---- open curriculum navigation ----------------------------------------- */

resetProgress();
let map = tryRender("the Topic home renders with no progress", () => renderMap(mount));
if (map) {
  check("the home draws one card per Topic", find(map, "topiccard").length === TOPICS.length);
  check("the home links to Your Journey", find(map, "journeytools")[0].querySelectorAll("a").some(link => link.getAttribute("href") === "#/journey"));
  check("the home does not expose challenge nodes before a Topic is selected", find(map, "pathnode").length === 0);
}

check("SSH and its file-transfer branch belong to HPC",
  ["getting-on-the-cluster", "moving-files-introduction", "bringing-files-back", "when-the-link-drops"]
    .every(slug => ALL_NODES.find(node => node.slug === slug)?.topicKey === "hpc"));

const focused = tryRender("a focused Topic tree renders", () => renderMap(mount, { topicKey: "linux" }));
if (focused) {
  check("the focused tree contains every challenge in its Topic",
    find(focused, "pathnode").length === TOPICS[0].nodes.length);
  check("every built challenge node is a direct link",
    find(focused, "pathnode").every(node => node.tagName === "A"));
  check("no challenge node is locked", find(focused, "is-locked").length === 0);
}

const journey = tryRender("Your Journey renders", () => renderMap(mount, { journey: true }));
if (journey) {
  check("Your Journey contains every challenge", find(journey, "pathnode").length === ALL_NODES.length);
  check("Your Journey draws recommendation wires", find(journey, "wire").length > 0);
  const byTitle = new Map(ALL_NODES.map(node => [node.title, node]));
  const rowsPlaceTerminalNodesOutside = find(journey, "journeyrow").every(row => {
    const rowNodes = find(row, "pathnode").map(card => byTitle.get(card.querySelector("strong").textContent));
    const terminal = rowNodes.map(node => !ALL_NODES.some(next => next.recommendedAfter.includes(node.number)));
    const count = terminal.filter(Boolean).length;
    if (!count || count === terminal.length) return true;
    return count > 1 ? terminal[0] && terminal.at(-1) : terminal[0] || terminal.at(-1);
  });
  check("terminal graph nodes sit at the outside edges of their rows", rowsPlaceTerminalNodesOutside);
  const journeyTools = find(journey, "journeytools")[0];
  check("Your Journey returns to Topics instead of linking to itself",
    journeyTools.querySelectorAll("a").length === 1 &&
    journeyTools.querySelectorAll("a")[0].getAttribute("href") === "#/");
}
check("every challenge in the curriculum has content",
  ALL_NODES.every(node => isBuilt(node.slug)),
  ALL_NODES.filter(node => !isBuilt(node.slug)).map(node => node.slug).join(", "));

/* ---- a timed reading challenge ------------------------------------------ */

const zero = CHALLENGES["what-is-a-terminal"];
const reading = tryRender("challenge 0 renders", () => renderReading(zero, mount));
if (reading) {
  check("challenge 0 has no terminal pane", find(reading, "termwrap").length === 0);
  check("challenge 0 shows its author/source/update line", find(reading, "byline").length === 1);
  check("imported text challenges show the work-in-progress warning", find(reading, "importwarning").length === 1);
  check("challenge 0 has a completion timer", find(reading, "readtimer").length === 1);
  check("opening a reading challenge starts but does not complete it", stateOf(zero.slug) === "open");
  check("every known challenge is open without prerequisites", ALL_NODES.every(node => stateOf(node.slug) === "open"));
}

/* ---- a full challenge screen -------------------------------------------- */

for (const slug of ["reading-files", "bringing-files-back", "when-the-link-drops"]) {
  const c = CHALLENGES[slug];
  const screen = tryRender(`${slug} renders`, () => renderChallenge(c, mount));
  if (!screen) continue;

  check(`${slug}: has a reading pane and a terminal pane`,
    find(screen, "reading").length === 1 && find(screen, "termwrap").length === 1);
  check(`${slug}: shows one worked-example row per example`,
    find(screen, "exrow").length === c.example.length);
  check(`${slug}: the hint ladder starts hidden`, find(screen, "hints")[0].hidden === true);
  check(`${slug}: there is no button that reveals a hint`,
    find(screen, "hints")[0].querySelectorAll("button").length === 0);
  check(`${slug}: the answer slot is reserved before anything is typed`,
    find(screen, "verdict").length === 1);
  check(`${slug}: the terminal printed its banner`,
    globalThis.__terminals.at(-1).text().includes(c.os || "Rocky Linux"));
  check(`${slug}: the banner is the OS line and the help line, nothing more`,
    globalThis.__terminals.at(-1).text().split("\r\n").filter(Boolean).length <= 3);
}

/* ---- hints appear on the third, fifth and sixth wrong answer ------------- */

{
  const c = CHALLENGES["reading-files"];
  const screen = renderChallenge(c, mount);
  const hints = find(screen, "hints")[0];
  const input = find(screen, "answer")[0].querySelector("input");
  const btn = find(screen, "answer")[0].querySelector("button");

  async function guess(v) { input.value = v; btn.dispatch("click"); await new Promise(r => setTimeout(r, 0)); }
  const openRungs = () => hints.querySelectorAll(".rung").filter(r => !r.hidden).length;

  await guess("nope");
  const started = attemptFor(c.slug);
  check("submitting an answer pins the challenge revision and variant",
    started && started.revision === c.revision && started.variant === 0 && !started.completedAt);
  await guess("nope");
  check("two wrong answers reveal no hint", hints.hidden === true && openRungs() === 0);
  await guess("nope");
  check("the third wrong answer opens the first hint", hints.hidden === false && openRungs() === 1);
  await guess("nope");
  check("the fourth opens nothing new", openRungs() === 1);
  await guess("nope");
  check("the fifth opens the second hint", openRungs() === 2);
  await guess("nope");
  check("the sixth opens the solution", openRungs() === 3);
  await guess("nope");
  check("nothing follows the solution", openRungs() === 3);

  await guess(c.answer);
  check("the right answer is accepted", find(screen, "verdict")[0].classList.contains("good"));
  check("the right answer marks the challenge done", stateOf(c.slug) === "done");
  check("the answer box locks once it is right", input.disabled === true && btn.disabled === true);

  const actions = find(screen, "doneactions")[0];
  check("finishing a challenge offers two ways on", !!actions && actions.childNodes.length === 2);
  check("the first is the next challenge",
    actions && actions.childNodes[0].getAttribute("href") === "#/c/shell-scripts",
    actions && actions.childNodes[0].getAttribute("href"));
  check("the second is the map",
    actions && actions.childNodes[1].getAttribute("href") === "#/");
}

/* At the branch, "next" carries straight on to the leftmost route — which is
   the lowest-numbered one, because the map is laid out in number order. */
{
  resetProgress();
  for (const n of ALL_NODES.filter(n => n.num <= 8)) markSolved(n.slug);
  const eight = nextAfter("getting-on-the-cluster", isBuilt);
  check("finishing the core points at the leftmost topic introduction",
    eight && eight.slug === "moving-files-introduction", eight && eight.slug);

  const ten = nextAfter("when-the-link-drops", isBuilt);
  check("the end of a route follows its authored recommendation",
    ten && ten.slug === "putting-it-together", ten && ten.slug);

  for (const n of ALL_NODES) markSolved(n.slug);
  check("the last challenge has nowhere further to go",
    nextAfter("putting-it-together", isBuilt) === null);

  const last = renderChallenge(CHALLENGES["putting-it-together"], mount);
  const lastInput = find(last, "answer")[0].querySelector("input");
  const lastBtn = find(last, "answer")[0].querySelector("button");
  lastInput.value = CHALLENGES["putting-it-together"].answer;
  lastBtn.dispatch("click");
  await new Promise(r => setTimeout(r, 0));
  const lastActions = find(last, "doneactions")[0];
  check("the last challenge offers only the map",
    !!lastActions && lastActions.querySelectorAll("a").length === 1 &&
    lastActions.querySelectorAll("a")[0].getAttribute("href") === "#/");
  check("and says that it was the last one", find(last, "donenote").length === 1);
  resetProgress();
}

/* A completed reading challenge ends the same way every other one does. */
{
  markSolved("what-is-a-terminal");
  const r = renderReading(CHALLENGES["what-is-a-terminal"], mount);
  const actions = find(r, "doneactions")[0];
  check("a completed reading challenge offers the same two ways on",
    !!actions && actions.querySelectorAll("a").length === 2);
  check("its next challenge follows the authored recommendation",
    actions && actions.querySelectorAll("a")[0].getAttribute("href") === "#/c/navigating-files");
  resetProgress();
}

/* ---- the map once everything is solved ---------------------------------- */

{
  resetProgress();
  for (const n of ALL_NODES) markSolved(n.slug);
  const done = tryRender("Your Journey renders with everything solved", () => renderMap(mount, { journey: true }));
  if (done) {
    check("every journey node reads as done",
      find(done, "pathnode").every(node => node.classList.contains("is-done")));
    check("recommendation wires never imply locking",
      find(done, "wire").every(wire => !wire.classList.contains("is-locked")));
  }
  check("nothing is left open when everything is solved", nextOpen() === null);
  resetProgress();
}

/* ---- the shell each screen builds is the shell the validator tested ------ */

{
  const c = CHALLENGES["when-the-link-drops"];
  const { shell } = makeSession(c, recordingTerminal());
  check("the prompt names the Topic, not the home directory",
    /^you@laptop ~\/HPC/.test(shell.promptStr()), shell.promptStr());
  const cluster = makeSession(CHALLENGES["reading-files"], recordingTerminal()).shell;
  check("an HPC-hosted shell challenge prompts as hpc@uwc",
    /^hpc@uwc ~\/Linux/.test(cluster.promptStr()), cluster.promptStr());
  check("tab completion and history survive the subclass",
    typeof shell.complete === "function" && Array.isArray(shell.ctx.history));
  check("the track's extra commands are wired in",
    ["scp", "rsync", "ssh", "ll", "tldr", "df", "watch", "git"].every(k => k in shell.ctx.hooks));
}

/* A browser terminal command starts an attempt; headless validator calls do not. */
{
  resetProgress();
  renderChallenge(CHALLENGES["where-am-i"], mount);
  globalThis.__terminals.at(-1).input("pwd\r");
  const attempt = attemptFor("where-am-i");
  check("running a terminal command starts and pins an attempt",
    attempt && attempt.revision === "001" && attempt.variant === 0);
  resetProgress();
}

console.log(`\n${total - failed}/${total} checks passed`);
process.exit(failed ? 1 : 0);
