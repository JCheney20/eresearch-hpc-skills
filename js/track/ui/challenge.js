// The challenge screen: reading pane on the left, live terminal on the right.
//
// One scrolling column holds everything the learner needs, in the order they
// meet it, with the answer at the foot. The terminal never scrolls away.

import { el } from "./dom.js";
import { makeTerminal } from "./terminal.js";
import { topbar, challengeHeading, block, labelled, exampleBlock, hintLadder, answerBlock } from "./parts.js";
import { markSolved, unlockedBy, nextAfter } from "../progress.js";
import { isBuilt } from "../challenges/index.js";

export function renderChallenge(challenge, mount) {
  const root = el("div", "app");
  const term = makeTerminal(challenge);
  const panes = el("div", "panes");
  const reading = el("div", "reading");

  const ladder = hintLadder(challenge);
  /* The buttons that appear once it is right live below the answer, not
     inside the verdict: they are navigation, and a status message is not a
     place to put navigation. */
  const after = el("div", "afteranswer");

  reading.append(
    challengeHeading(challenge),
    block("Scenario", challenge.scenario, "scenario"),
    labelled("Worked example", exampleBlock(challenge)),
    block("Your task", challenge.task, "task"),
    ladder,
    answerBlock(challenge, ladder, verdict => onCorrect(challenge, verdict, after)),
    after,
  );

  panes.append(reading, term.node);

  const notice = el("div", "narrownotice");
  notice.append(el("h2", "", "Widen this window"));
  notice.append(el("p", "",
    "This trainer pairs a live terminal with a reading pane, side by side, and " +
    "expects a physical keyboard to type into it. Below about 900 pixels wide " +
    "there is no good arrangement for that."));
  notice.append(el("p", "", "Open it on a laptop or desktop, or widen this window."));

  root.append(topbar(challenge), panes, notice);

  mount(root, () => term.dispose());
  term.mount();
  return root;
}

function onCorrect(challenge, verdict, after) {
  /* Ask what this opens *before* marking it solved, or it counts as already
     unlocked and the sentence comes out empty. */
  const opened = unlockedBy(challenge.slug);
  markSolved(challenge.slug);

  if (opened.length) {
    verdict.append(document.createTextNode("That opens "));
    opened.forEach((n, i) => {
      if (i > 0) verdict.append(document.createTextNode(i === opened.length - 1 ? " and " : ", "));
      const strong = el("strong");
      strong.textContent = n.title;
      verdict.append(strong);
    });
    verdict.append(document.createTextNode("."));
  }

  after.append(doneActions(challenge.slug));
}

/* What to do next, once a challenge is finished.
 *
 * "Next challenge" is the lowest-numbered thing now open — which at the branch
 * is the leftmost route on the map — and the map is always the other way out.
 * On the last challenge there is nowhere further to go, so the map is the only
 * button and it stops being the secondary one. */
export function doneActions(slug) {
  const row = el("div", "doneactions");
  const next = nextAfter(slug, isBuilt);

  if (next) {
    const go = el("a", "btn");
    go.href = "#/c/" + next.slug;
    go.textContent = `Next: ${next.title} →`;
    row.append(go);

    const map = el("a", "btn ghost");
    map.href = "#/";
    map.textContent = "Back to the map";
    row.append(map);
  } else {
    const map = el("a", "btn");
    map.href = "#/";
    map.textContent = "Back to the map";
    row.append(map);
    row.append(el("p", "donenote",
      "That was the last one. Everything the trainer has is behind you — the next " +
      "cluster you log in to should be a real one."));
  }
  return row;
}
