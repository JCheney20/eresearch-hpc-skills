// Hash routing. Two routes, because there are two kinds of page:
//
//   #/            the map
//   #/c/<slug>    one challenge
//
// State lives in the URL, so any screen is shareable and the back button
// works. A challenge that is locked, or not written yet, sends you back to
// the map rather than rendering a dead end.

import { getChallenge } from "./challenges/index.js";
import { stateOf } from "./progress.js";
import { renderMap } from "./ui/map.js";
import { renderChallenge } from "./ui/challenge.js";
import { renderReading } from "./ui/reading.js";

let teardown = null;

function mountInto(host) {
  return (node, dispose) => {
    if (teardown) { try { teardown(); } catch { /* a screen that will not tidy up
      should not stop the next one rendering */ } }
    teardown = dispose || null;
    host.replaceChildren(node);
  };
}

export function startRouter(hostId) {
  const host = document.getElementById(hostId);
  const mount = mountInto(host);

  function dispatch() {
    const parts = location.hash.replace(/^#/, "").split("/").filter(Boolean);
    window.scrollTo(0, 0);

    let screen;
    if (parts[0] === "c" && parts[1]) {
      const challenge = getChallenge(parts[1]);
      if (!challenge || stateOf(challenge.slug) === "locked") {
        location.hash = "#/";
        return;
      }
      screen = challenge.kind === "reading"
        ? renderReading(challenge, mount)
        : renderChallenge(challenge, mount);
    } else {
      screen = renderMap(mount);
    }

    /* The skip link jumps into the terminal. On a screen that has no
       terminal it would be an anchor to nowhere, which is worse than no
       skip link, so it comes off. */
    const skip = document.querySelector(".skiplink");
    if (skip) skip.hidden = !document.getElementById("terminal-screen");

    return screen;
  }

  window.addEventListener("hashchange", dispatch);
  dispatch();
}
