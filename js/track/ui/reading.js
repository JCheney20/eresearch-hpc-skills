// Text challenge: static blocks followed by a short, persistent reading timer.

import { el } from "./dom.js";
import { topbar, challengeHeading } from "./parts.js";
import { doneActions } from "./challenge.js";
import { attemptFor, isSolved, markSolved, markStarted } from "../progress.js";

const ALLOWED = new Set([
  "A", "BLOCKQUOTE", "BR", "CODE", "DETAILS", "DIV", "EM", "FIGURE",
  "H1", "H2", "H3", "H4", "H5", "HR", "IMG", "INPUT", "LABEL", "LI",
  "OL", "P", "PRE", "SPAN", "STRONG", "SUMMARY", "TABLE", "TBODY", "TD",
  "TH", "THEAD", "TR", "UL",
]);

function safeURL(value) {
  try {
    const url = new URL(value, location.href);
    return ["http:", "https:", "mailto:"].includes(url.protocol) ? value : "";
  } catch {
    return "";
  }
}

function sanitizedFragment(markup) {
  const template = document.createElement("template");
  template.innerHTML = markup;
  for (const node of [...template.content.querySelectorAll("*")].reverse()) {
    if (!ALLOWED.has(node.tagName)) {
      node.replaceWith(...node.childNodes);
      continue;
    }
    for (const attribute of [...node.attributes]) {
      const keep = (node.tagName === "A" && ["href", "title"].includes(attribute.name)) ||
        (node.tagName === "IMG" && ["src", "alt", "title", "width", "height"].includes(attribute.name)) ||
        (node.tagName === "INPUT" && ["type", "checked", "disabled"].includes(attribute.name)) ||
        (node.tagName === "CODE" && attribute.name === "class");
      if (!keep) node.removeAttribute(attribute.name);
    }
    if (node.tagName === "A") {
      const href = safeURL(node.getAttribute("href") || "");
      if (href) {
        node.setAttribute("href", href);
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      } else node.removeAttribute("href");
    }
    if (node.tagName === "IMG" && !safeURL(node.getAttribute("src") || "")) node.remove();
  }
  return template.content;
}

function workInProgressWarning() {
  const warning = el("aside", "importwarning");
  warning.setAttribute("role", "note");
  warning.append(el("strong", "", "Work in progress"));
  warning.append(document.createTextNode(" — This source lesson is published in full while it is reviewed and split into smaller beginner challenges."));
  return warning;
}

function completion(challenge, setTimer) {
  if (isSolved(challenge.slug)) return doneActions(challenge.slug);

  markStarted(challenge.slug);
  const box = el("div", "readingcomplete");
  const button = el("button", "btn", "Mark complete");
  button.type = "button";
  const status = el("p", "readtimer");
  const seconds = challenge.minimumReadSeconds || 120;
  const started = Date.parse(attemptFor(challenge.slug)?.startedAt || new Date().toISOString());
  const readyAt = started + seconds * 1000;

  function update() {
    const remaining = Math.max(0, Math.ceil((readyAt - Date.now()) / 1000));
    button.disabled = remaining > 0;
    status.textContent = remaining
      ? `Mark complete in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`
      : "You can mark this challenge complete.";
  }

  button.addEventListener("click", () => {
    markSolved(challenge.slug);
    box.replaceChildren(doneActions(challenge.slug));
    setTimer(null);
  });
  box.append(button, status);
  update();
  setTimer(setInterval(update, 1000));
  return box;
}

function localContent(challenge, page) {
  if (challenge.lede) page.append(el("p", "lede importedlede", challenge.lede));
  if (challenge.cards?.length) {
    const grid = el("div", "readingcards");
    for (const card of challenge.cards) {
      const item = el("section", "rcard");
      if (card.title) item.append(el("h2", "subhead", card.title));
      item.append(el("div", "", card.html));
      grid.append(item);
    }
    page.append(grid);
  }
}

async function importedContent(challenge, page, loading) {
  try {
    const response = await fetch(challenge.contentUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const documentData = await response.json();
    Object.assign(challenge, documentData, { slug: challenge.slug, displayNum: challenge.displayNum });
    page.firstElementChild.replaceWith(challengeHeading(challenge));
    const article = el("article", "importedlesson");
    for (const block of documentData.blocks) {
      const blockResponse = await fetch(block.rendered);
      if (!blockResponse.ok) throw new Error(`HTTP ${blockResponse.status}`);
      article.append(sanitizedFragment(await blockResponse.text()));
    }
    loading.replaceWith(article);
  } catch (error) {
    loading.className = "importerror";
    loading.textContent = `This lesson could not be loaded (${error.message}). Refresh to try again.`;
  }
}

export function renderReading(challenge, mount) {
  const root = el("div", "app");
  const page = el("main", "readingonly");
  let timer = null;
  const setTimer = value => {
    if (timer) clearInterval(timer);
    timer = value;
  };

  page.append(challengeHeading(challenge));
  if (challenge.workInProgress) page.append(workInProgressWarning());
  if (challenge.contentUrl) {
    const loading = el("p", "importloading", "Loading lesson…");
    page.append(loading);
    if (typeof fetch === "function") importedContent(challenge, page, loading);
  } else {
    localContent(challenge, page);
  }

  page.append(completion(challenge, setTimer));
  if (challenge.footnote) page.append(el("p", "footnote", challenge.footnote));
  const licences = el("p", "licencelink");
  const link = el("a", "", "Sources and licences");
  link.href = "#/licenses";
  licences.append(link);
  page.append(licences);

  root.append(topbar(challenge), page);
  mount(root, () => setTimer(null));
  return root;
}
