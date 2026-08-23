// The challenge screen: reading pane on the left, live terminal on the right.
//
// One scrolling column holds everything the learner needs, in the order they
// meet it, with the answer at the foot. The terminal never scrolls away.

import { el } from "./dom.js";
import { makeTerminal } from "./terminal.js";
import { topbar, challengeHeading, block, labelled, exampleBlock, hintLadder, answerBlock } from "./parts.js";
import { markSolved, unlockedBy } from "../progress.js";
import { topicOf } from "../topics.js";

export function renderChallenge(challenge, mount) {
  const root = el("div", "app");
  const term = makeTerminal(challenge);
  const panes = el("div", "panes");
  const reading = el("div", "reading");

  const ladder = hintLadder(challenge);

  reading.append(
    challengeHeading(challenge),
    block("Scenario", challenge.scenario, "scenario"),
    labelled("Worked example", exampleBlock(challenge)),
    block("Your task", challenge.task, "task"),
    ladder,
    answerBlock(challenge, ladder, verdict => onCorrect(challenge, verdict)),
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

function onCorrect(challenge, verdict) {
  const opened = unlockedBy(challenge.slug);
  markSolved(challenge.slug);

  if (opened.length) {
    verdict.append(document.createTextNode("That opens "));
    opened.forEach((n, i) => {
      if (i > 0) verdict.append(document.createTextNode(i === opened.length - 1 ? " and " : ", "));
      const strong = el("strong", "", "");
      strong.textContent = n.title;
      verdict.append(strong);
    });
    verdict.append(document.createTextNode(". "));

    const next = opened[0];
    const link = el("a", "", "");
    link.href = "#/c/" + next.slug;
    link.textContent = "Next challenge →";
    verdict.append(link);
  } else {
    const where = topicOf(challenge.slug);
    verdict.append(document.createTextNode(
      where && where.topic.key === "finale"
        ? "That is the last one. "
        : "Nothing new opens yet — another challenge has to be finished first. "));
    const link = el("a", "", "");
    link.href = "#/";
    link.textContent = "Back to the map →";
    verdict.append(link);
  }
}
