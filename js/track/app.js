// Entry point for the beginner track.

import { startRouter } from "./router.js";
import { resetProgress } from "./progress.js";

startRouter("app");

const reset = document.getElementById("reset-progress");
if (reset) {
  reset.addEventListener("click", e => {
    e.preventDefault();
    if (confirm("Start again? This clears all challenge progress.")) {
      resetProgress();
      location.hash = "#/";
      location.reload();
    }
  });
}
