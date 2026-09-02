// The terminal pane: a real xterm.js driven by the real shell engine.

import { el, token } from "./dom.js";
import { makeSession } from "../session.js";
import { markStarted, selectedVariant } from "../progress.js";

export function makeTerminal(challenge) {
  const wrap = el("div", "termwrap");

  const head = el("div", "termhead");
  const host = el("span", "host");
  head.append(host, el("span", "", "—"), el("span", "", "simulated"));
  head.append(el("span", "spacer"));
  const reset = el("button", "", "reset");
  reset.type = "button";
  reset.title = "Start this challenge's terminal again from scratch";
  head.append(reset);

  const screen = el("div", "term");
  screen.id = "terminal-screen";
  wrap.append(head, screen);

  const term = new window.Terminal({
    cursorBlink: true,
    // An underscore that blinks, not a box: a box around the line you are
    // typing on reads as an error state, and no real terminal draws one.
    cursorStyle: "underline",
    fontFamily: '"JetBrains Mono", ui-monospace, "DejaVu Sans Mono", monospace',
    fontSize: 13,
    lineHeight: 1.4,
    theme: {
      background: token("--term-ground"),
      foreground: token("--term-ink"),
      cursor: token("--term-accent"),
      cursorAccent: token("--term-ground"),
      selectionBackground: token("--term-sel"),
      brightBlack: token("--term-dim"),
      red: token("--term-err"),
      yellow: token("--term-accent"),
    },
  });

  const fit = new window.FitAddon.FitAddon();
  term.loadAddon(fit);

  let session = null;
  const variantIndex = selectedVariant(challenge.slug, (challenge.variants || [{ i: 0 }]).length);

  function start() {
    session = makeSession(challenge, term, variantIndex,
      () => markStarted(challenge.slug, variantIndex));
    host.textContent = `${session.shell.ctx.env.USER}@${session.shell.ctx.env.HOSTNAME}`;
    // The banner is the OS line and the help line. Nothing else: a beginner
    // reading four lines of chrome before their first command learns that
    // terminal output is noise to skip.
    session.shell.start(
      `${challenge.os || "Rocky Linux 9.4 (Blue Onyx)"}\nType 'help' to see what this trainer's shell knows.`
    );
  }

  function mount() {
    term.open(screen);
    fit.fit();
    start();
    term.focus();
  }

  reset.addEventListener("click", () => {
    term.reset();
    start();
    term.focus();
  });

  const onResize = () => { try { fit.fit(); } catch { /* not mounted yet */ } };
  window.addEventListener("resize", onResize);

  return {
    node: wrap,
    variantIndex,
    mount,
    focus: () => term.focus(),
    dispose() {
      window.removeEventListener("resize", onResize);
      term.dispose();
    },
  };
}
