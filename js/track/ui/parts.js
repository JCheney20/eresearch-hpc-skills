// The pieces a challenge screen is assembled from. Shared between the
// challenge screen and the reading screen so both wear the same chrome.

import { el, ICON, copyText } from "./dom.js";
import { topicOf } from "../topics.js";
import { overallProgress } from "../progress.js";
import { judge } from "../answer.js";

/* The topbar counts the topic the learner is in, not every challenge.
   The number it prints is the challenge's own — challenge 0 is "Challenge 0"
   here and on every other screen. */
export function topbar(challenge) {
  const where = challenge && topicOf(challenge.slug);
  const bar = el("div", "topbar");

  const mark = el("a", "wordmark");
  mark.href = "#/";
  mark.innerHTML = 'UWC<span>_</span>HPC';
  bar.append(mark);

  if (where) {
    bar.append(el("span", "crumb", `Challenge ${where.displayNum} of ${where.last}`));
    bar.append(el("span", "branchchip", where.topic.name));
  } else {
    const p = overallProgress();
    bar.append(el("span", "crumb", `${p.done} of ${p.total} challenges done`));
  }

  bar.append(el("span", "spacer"));

  if (where) {
    const prog = el("div", "progress");
    prog.setAttribute("role", "img");
    prog.setAttribute("aria-label",
      `Challenge ${where.index + 1} of ${where.count} in ${where.topic.name}`);
    for (let i = 0; i < where.count; i++) {
      prog.append(el("span", "pip" + (i < where.index ? " done" : i === where.index ? " here" : "")));
    }
    bar.append(prog);
  }

  const licences = el("a", "maplink", "Licences");
  licences.href = "#/licenses";
  bar.append(licences);

  const map = el("a", "maplink", "Map");
  map.href = "#/";
  bar.append(map);

  return bar;
}

export function attributionLine(challenge) {
  const line = el("p", "byline");
  line.append(document.createTextNode(challenge.author || "Justin Cheney"));
  line.append(document.createTextNode(" | "));
  if (challenge.source?.url) {
    const source = el("a", "", challenge.source.label || "Source");
    source.href = challenge.source.url;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    line.append(source);
  } else {
    line.append(document.createTextNode(challenge.source?.label || "UWC HPC Skills"));
  }
  line.append(document.createTextNode(" | Updated "));
  const updated = el("time", "", challenge.updated || "2026-09-03");
  updated.dateTime = challenge.updated || "2026-09-03";
  line.append(updated);
  return line;
}

export function challengeHeading(challenge) {
  const where = topicOf(challenge.slug);
  const h = el("div");
  h.append(el("span", "headrule wide"));
  const chips = (challenge.commands || []).map(c => `<code>${c}</code>`).join(" ");
  const lead = where
    ? `${where.topic.name} · Challenge ${where.displayNum} of ${where.last}`
    : `Challenge ${challenge.displayNum ?? challenge.num}`;
  h.append(el("div", "cnum", lead + (chips ? " · " + chips : "")));
  h.append(el("h1", "ctitle", challenge.title));
  h.append(attributionLine(challenge));
  return h;
}

export function block(label, html, cls) {
  const b = el("div", "block " + (cls || ""));
  b.append(el("div", "blabel", label), el("div", "", html));
  return b;
}

export function labelled(label, node) {
  const b = el("div", "block");
  b.append(el("div", "blabel", label), node);
  return b;
}

/* Worked examples. The button copies the command; the icon is the label. */
export function exampleBlock(challenge) {
  const box = el("div", "example");
  for (const ex of challenge.example) {
    const row = el("div", "exrow");
    const btn = el("button", "excmd");
    btn.type = "button";
    btn.title = "Copy";
    btn.setAttribute("aria-label", "Copy " + ex.command);
    const dollar = el("span", "dollar", "$");
    dollar.setAttribute("aria-hidden", "true");
    const cmd = el("span", "cmd");
    cmd.textContent = ex.command;          // never innerHTML: this is a command
    btn.append(dollar, cmd, el("span", "copy", ICON.copy));
    btn.addEventListener("click", () => copyText(btn, ex.command));

    /* Some commands answer with silence — `cd`, `git add`. An empty box looks
       like something failed to load, so the page says what the silence means
       rather than leaving a gap. */
    const out = el("pre", "exout" + (ex.output ? "" : " quiet"));
    out.textContent = ex.output || "(no output — on a command line that means it worked)";

    row.append(btn, out);
    if (ex.note) row.append(el("div", "exnote", ex.note));
    box.append(row);
  }
  return box;
}

/* Hints are earned, not asked for. There is no button: a rung opens on the
   third wrong answer, the fifth, and the sixth. Until the first one opens the
   ladder is not on the page, so a learner who gets it first time never sees
   one. */
const HINT_AT = [3, 5, 6];

export function hintLadder(challenge) {
  const wrap = el("div", "hints");
  wrap.hidden = true;
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Hints");
  wrap.setAttribute("aria-live", "polite");

  const head = el("div", "hinthead");
  head.append(el("span", "hintlabel", "Hints"));
  const count = el("span", "hintcount", "");
  head.append(count);

  const rungs = (challenge.hints || []).map((h, i) => {
    const r = el("div", "rung");
    r.dataset.text = h;
    r.dataset.label = ["Nudge", "Method", "Solution"][i] || `Hint ${i + 1}`;
    r.hidden = true;
    return r;
  });

  let shown = 0;

  function open() {
    if (shown >= rungs.length) return;
    const r = rungs[shown];
    r.hidden = false;
    r.innerHTML = `<span class="rlabel">${r.dataset.label}.</span>${r.dataset.text}`;
    shown++;
    wrap.hidden = false;
    count.textContent = shown === rungs.length ? "that was the last one" : `${shown} of ${rungs.length}`;
  }

  wrap.append(head, ...rungs);
  wrap.onAttempt = attempts => {
    while (shown < HINT_AT.length && attempts >= HINT_AT[shown]) open();
  };
  return wrap;
}

export function answerBlock(challenge, ladder, onCorrect, onAttempt) {
  const wrap = el("div", "answer");
  wrap.setAttribute("role", "group");
  wrap.setAttribute("aria-label", "Answer");
  wrap.append(el("div", "blabel", "Your answer"));

  const row = el("div", "answerrow");
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = challenge.answerLabel;
  input.setAttribute("aria-label", challenge.answerLabel);
  input.setAttribute("autocomplete", "off");
  input.setAttribute("spellcheck", "false");

  const btn = el("button", "btn", "Check answer");
  btn.type = "button";
  row.append(input, btn);

  const verdict = el("div", "verdict");
  verdict.setAttribute("role", "status");
  verdict.setAttribute("aria-live", "polite");

  let wrong = 0;
  let settled = false;

  async function submit() {
    if (settled) return;
    const r = await judge(challenge, input.value);
    if (r.state === "empty") { verdict.className = "verdict"; return; }
    if (onAttempt) onAttempt();

    if (r.state === "right") {
      settled = true;
      input.disabled = true;
      btn.disabled = true;
      verdict.className = "verdict show good";
      verdict.textContent = "Correct. ";
      onCorrect(verdict);
      return;
    }

    verdict.className = "verdict show bad";
    verdict.innerHTML = r.message;
    wrong++;
    if (ladder && ladder.onAttempt) ladder.onAttempt(wrong);
  }

  btn.addEventListener("click", submit);
  input.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });

  wrap.append(row, verdict);
  return wrap;
}
