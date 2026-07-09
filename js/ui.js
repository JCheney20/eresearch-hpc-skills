// Page rendering: index, level pages (lock screen / terminal), cheatsheet, docs.

import { LEVELS } from "./levels/index.js";
import { variantIndex } from "./variants.js";
import { makeVFS } from "./vfs.js";
import { Shell } from "./shell.js";
import { isUnlocked, isSolved, tryUnlock, checkAnswer, storedPassword } from "./gate.js";
import { CHEATSHEET_HTML, DOCS, DOCS_INDEX_HTML } from "./content.js";

const app = () => document.getElementById("app");

function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderHome() {
  const rows = LEVELS.map(l => {
    const unlocked = isUnlocked(l.n);
    const cls = unlocked ? "" : "locked";
    const tick = isSolved(l.n) ? "✓" : "";
    return `<tr>
      <td class="num"><a class="${cls}" href="#/level/${l.n}">Level ${l.n}</a></td>
      <td><a class="${cls}" href="#/level/${l.n}">${esc(l.title)}</a></td>
      <td class="solved">${tick}</td>
    </tr>`;
  }).join("");

  app().innerHTML = `
    <h1>UWC_HPC</h1>
    <p>A wargame for the UWC student cluster team, in the spirit of
    <a href="https://overthewire.org/wargames/bandit/" target="_blank" rel="noopener">OverTheWire: Bandit</a>.
    It teaches the Linux and HPC skills needed to build and debug a small
    Rocky Linux compute cluster: from <code>ls</code> and <code>grep</code>, through firewalls,
    time sync, NFS and Slurm, to tuning an HPL benchmark and hunting the one
    fatal line in a wall of logs.</p>
    <p>Each level runs entirely in your browser in the terminal below the level
    description. Solving a level reveals the <strong>password</strong> for the next one.
    Passwords change between playthroughs — use <em>new playthrough</em> in the footer
    to reshuffle every level and play again.</p>
    <p>Stuck? Check the <a href="#/cheatsheet">cheatsheet</a>, the
    <a href="#/docs">docs</a>, or type <code>help</code> and <code>man &lt;command&gt;</code>
    inside any level's terminal.</p>
    <h2>Levels</h2>
    <table class="level-table">${rows}</table>
    <p class="dim">Levels 0–12: Linux fundamentals · 13–18: services &amp; debugging ·
    19–24: the cluster and the HPC finale.</p>`;
}

export function renderLevel(n) {
  const level = LEVELS.find(l => l.n === n);
  if (!level) { app().innerHTML = `<h1>No such level</h1><p><a href="#/">back</a></p>`; return; }
  if (!isUnlocked(n)) { renderLock(level); return; }

  const vi = variantIndex(n, level.variants.length);
  const v = level.variants[vi];
  const built = level.build(v);
  const next = n < LEVELS.length - 1 ? n + 1 : null;

  const cmds = (level.commands || []).map(c =>
    `<a href="https://man7.org/linux/man-pages/man1/${c}.1.html" target="_blank" rel="noopener"><code>${esc(c)}</code></a>`
  ).join(", ");

  const reading = (level.reading || []).map(r =>
    `<li><a href="${r.url}"${r.url.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(r.label)}</a></li>`
  ).join("");

  app().innerHTML = `
    <h1>Level ${n} ${next !== null ? `→ Level ${next}` : "(final)"}</h1>
    <h2>${esc(level.title)}</h2>
    <h3>Level Goal</h3>
    <div>${built.goal}</div>
    ${cmds ? `<h3>Commands you may need to solve this level</h3><p>${cmds}</p>` : ""}
    ${reading ? `<h3>Helpful reading material</h3><ul>${reading}</ul>` : ""}
    <h3>Terminal</h3>
    <div id="term-wrap"><div id="term"></div></div>
    <div class="submitbox">
      <p>${next !== null ? `Found the password for Level ${next}?` : "Found the flag?"}</p>
      <input type="text" id="answer" placeholder="${next !== null ? `password for level ${next}` : "UWC_HPC{...}"}" autocomplete="off" spellcheck="false">
      <button id="answer-btn">Submit</button>
      <span id="answer-msg"></span>
    </div>
    <div class="levelnav">
      <span>${n > 0 ? `<a href="#/level/${n - 1}">← Level ${n - 1}</a>` : `<a href="#/">← index</a>`}</span>
      <span>${next !== null ? `<a href="#/level/${next}">Level ${next} →</a>` : ""}</span>
    </div>`;

  // terminal
  const term = new window.Terminal({
    rows: 24,
    cursorBlink: true,
    fontFamily: '"DejaVu Sans Mono", "Fira Mono", monospace',
    fontSize: 14,
    theme: { background: "#000000", foreground: "#c0c0c0", cursor: "#ffffff", selectionBackground: "#333333" },
  });
  const fit = new window.FitAddon.FitAddon();
  term.loadAddon(fit);
  term.open(document.getElementById("term"));
  fit.fit();
  window.addEventListener("resize", () => fit.fit());

  built.vfs = makeVFS(built.fs);
  const shell = new Shell(term, level, built);
  shell.start(built.banner || `Rocky Linux 9.4 (Blue Onyx) — uwc-hpc\nLevel ${n}: ${level.title}\nType 'help' for available commands.`);
  term.focus();

  // answer box (on the final level it verifies the flag instead)
  {
    const inp = document.getElementById("answer");
    const msg = document.getElementById("answer-msg");
    const submit = async () => {
      const ok = await checkAnswer(n, inp.value);
      if (!ok) {
        msg.innerHTML = `<span class="msg-err">Wrong password, keep digging.</span>`;
      } else if (next !== null) {
        msg.innerHTML = `<span class="msg-ok">Correct! <a href="#/level/${next}">Go to Level ${next} →</a></span>`;
      } else {
        msg.innerHTML = `<span class="msg-ok">Correct — you have beaten UWC_HPC. See you on the cluster.</span>`;
      }
    };
    document.getElementById("answer-btn").addEventListener("click", submit);
    inp.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  }
}

function renderLock(level) {
  const n = level.n;
  app().innerHTML = `
    <h1>Level ${n}</h1>
    <h2>${esc(level.title)}</h2>
    <div class="lockbox">
      <p>This level is locked. Enter the password you earned on Level ${n - 1}.</p>
      <input type="password" id="unlock" placeholder="password" autocomplete="off">
      <button id="unlock-btn">Unlock</button>
      <span id="unlock-msg"></span>
    </div>
    <p><a href="#/level/${n - 1}">← back to Level ${n - 1}</a> · <a href="#/">index</a></p>`;

  const inp = document.getElementById("unlock");
  const msg = document.getElementById("unlock-msg");
  const submit = async () => {
    if (await tryUnlock(n, inp.value)) renderLevel(n);
    else msg.innerHTML = `<span class="msg-err">Wrong password.</span>`;
  };
  document.getElementById("unlock-btn").addEventListener("click", submit);
  inp.addEventListener("keydown", e => { if (e.key === "Enter") submit(); });
  inp.focus();

  const stored = storedPassword(n);
  if (stored) inp.value = stored;
}

export function renderCheatsheet() {
  app().innerHTML = `<h1>Linux basics cheatsheet</h1>${CHEATSHEET_HTML}`;
}

export function renderDocs(topic) {
  if (topic && DOCS[topic]) {
    app().innerHTML = `<p><a href="#/docs">← all docs</a></p>${DOCS[topic]}`;
  } else {
    app().innerHTML = `<h1>Docs</h1>${DOCS_INDEX_HTML}`;
  }
}
