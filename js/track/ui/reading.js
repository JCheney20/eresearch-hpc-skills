// A reading challenge: no world, no terminal, no answer. Completed by opening
// it. Because there is no terminal to sit beside, the page takes the whole
// window and lays its sections out as cards, one per row.

import { el } from "./dom.js";
import { topbar } from "./parts.js";
import { markSolved, unlockedBy } from "../progress.js";
import { topicOf } from "../topics.js";

export function renderReading(challenge, mount) {
  const root = el("div", "app");
  const page = el("div", "readingonly");
  const where = topicOf(challenge.slug);

  const head = el("div", "rhead");
  head.append(el("span", "headrule wide"));
  head.append(el("div", "cnum", where
    ? `${where.topic.name} · Challenge ${where.num} of ${where.last} · read this one`
    : "Read this one"));
  head.append(el("h1", "ctitle", challenge.title));
  if (challenge.lede) head.append(el("p", "lede", challenge.lede));
  page.append(head);

  if (challenge.cards && challenge.cards.length) {
    const grid = el("div", "readingcards");
    for (const card of challenge.cards) {
      const c = el("div", "rcard");
      if (card.title) {
        const h = el("h2", "subhead");
        h.append(el("span", "headrule narrow"));
        h.append(document.createTextNode(card.title));
        c.append(h);
      }
      c.append(el("div", "", card.html));
      grid.append(c);
    }
    page.append(grid);
  }

  /* Opening the page is what completes it, so mark it now rather than making
     the learner click a button to agree that they have read something. The
     button below is navigation, not a gate. */
  const opened = unlockedBy(challenge.slug);
  markSolved(challenge.slug);

  const actions = el("div", "readingactions");
  const next = opened[0];
  const go = el("a", "btn");
  go.href = next ? "#/c/" + next.slug : "#/";
  go.textContent = next ? `Next: ${next.title} →` : "Back to the map →";
  actions.append(go);
  page.append(actions);

  if (challenge.footnote) page.append(el("p", "footnote", challenge.footnote));

  root.append(topbar(challenge), page);
  mount(root);
  return root;
}
