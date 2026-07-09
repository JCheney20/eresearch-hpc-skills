import { startRouter } from "./router.js";
import { renderHome, renderLevel, renderCheatsheet, renderDocs } from "./ui.js";
import { resetProgress } from "./gate.js";
import { rerollSeed } from "./variants.js";
import { validateLevels } from "./levels/index.js";

startRouter({
  home: renderHome,
  level: renderLevel,
  cheatsheet: renderCheatsheet,
  docs: renderDocs,
});

document.getElementById("reset-progress").addEventListener("click", e => {
  e.preventDefault();
  if (confirm("Reset all progress? Unlocked levels will lock again.")) {
    resetProgress();
    location.hash = "#/";
    renderHome();
  }
});

document.getElementById("new-playthrough").addEventListener("click", e => {
  e.preventDefault();
  if (confirm("Start a new playthrough? This rerolls every level's variant AND resets progress.")) {
    resetProgress();
    rerollSeed();
    location.hash = "#/";
    renderHome();
  }
});

// dev aid: run validateLevels() in the browser console
window.validateLevels = validateLevels;
