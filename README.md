# UWC_HPC

A browser trainer that takes a university student from never having opened a
terminal to running work on the cluster. No install, no account, no backend:
the whole thing is static files and a simulated Linux that runs in the tab.

Open `index.html` over HTTP (ES modules will not load from `file://`):

    python3 -m http.server 8000    # then visit http://localhost:8000

## What is here

**The beginner track** (`index.html`) contains 40 challenges across Linux, Git,
and HPC. The home page opens one Topic at a time; **Your Journey** shows the
complete recommended tree. Connections suggest a useful order but never lock
content, so every challenge can be opened directly.

Text challenges are attributed block documents with a short reading timer and
an explicit completion action. Code challenges pair instructions with the live
simulated terminal and complete through an answer or terminal-state validator.
Imported Shell and Git lessons come from pinned Software Carpentry revisions;
four pinned CHPC SCC tutorials are retained as long-form HPC source material
pending review, simplification, and splitting.

**The original wargame** (`legacy.html`) is the 25-level Bandit-style game this
repository started as, aimed at people already comfortable in a terminal. It
still runs, untouched, off `js/levels/` and `js/app.js`. Nothing in the
beginner track imports it and nothing in it imports the beginner track.
Whether it is retired is not decided yet, which is why it is still here.

## Layout

    index.html            the beginner track
    legacy.html           the original 25-level wargame
    css/tokens.css        every colour, face, size, space and easing
    css/fonts.css         Open Sans + JetBrains Mono, embedded as woff2
    css/track.css         the beginner track's stylesheet
    css/style.css         the original wargame's stylesheet
    js/shell.js           the shell: tokenising, pipes, redirection, history
    js/vfs.js             the in-memory filesystem
    js/commands/          coreutils and the scenario commands
    js/levels/            the original wargame's 25 levels
    js/track/             the beginner track
      content.js          stable IDs, Topics and recommended connections
      topics.js           runtime projection of the authored curriculum
      challenges/         one file per challenge, plus the shared worlds
      commands.js         scp, rsync, ll, tldr, df, watch, git
      session.js          a challenge, wired to the shell engine
      progress.js         revision-aware browser progress
      answer.js           normalising and judging an answer
      ui/                 the three screens
    content/              imported Typst, generated HTML and block JSON
    tools/                checks and the pinned lesson importer
    vendor/               xterm.js
    admin_backend/        private Django content service (not yet deployed)

The two tracks share `js/shell.js`, `js/vfs.js` and `js/commands/`. The
beginner track adds its commands as per-challenge hooks, which the shell
consults first, so it needed no changes to make room for them.

## Checks

    node tools/check.mjs

Runs three suites, none of which needs a browser:

- **`contrast.mjs`** converts every OKLCH token in `css/tokens.css` to sRGB and
  asserts the WCAG ratio for each pair the design actually puts together.
- **`track-validate.mjs`** runs every challenge's declared solution through the
  real shell against the real world and checks it yields the declared answer,
  then checks that every worked example's printed output is exactly what the
  shell prints for that command. A challenge that becomes unsolvable, or a page
  that starts lying about what a command produces, fails here rather than in
  front of a learner.
- **`render-smoke.mjs`** builds every screen against a small fake DOM
  (`tools/fakedom.mjs`) in each progress state that changes what a screen does,
  and asserts what came out: the graph, the pips, the hint thresholds, the
  answer flow.

- **`fill-examples.mjs`** is not a check but belongs with them: it regenerates
  every worked example's output from the engine.

The original wargame keeps its own checks: `node tools/validate.mjs` and
`node tools/smoke.mjs`.

## Deployment

Nginx configuration is in `deploy/nginx/uwc-hpc-skills.conf`; the release layout,
installation checks and rollback procedure are in `docs/deployment-plan.md`.

## Writing a challenge

Add the challenge's stable number, revision, Topic and `recommendedAfter`
connections to `js/track/content.js`. Recommendations draw the tree but never
gate access. Text challenges use ordered block JSON documented in
`docs/content-blocks.md`; code challenges still use compatibility modules in
`js/track/challenges/` while their worlds migrate to the declarative format.

A challenge declares its prose (`scenario`, `task`), its worked `example`s,
three `hints`, the `answer` with its `alternatives` and its named `failures`,
the `solution` that produces it, and a `build()` returning the world:

    build() {
      return {
        fs: { "/home/student": { "project": { "run.log": { c: "..." } } } },
        canned: { "rsync -av --stats student@uwc-hpc:logs/ logs/": "..." },
      };
    }

`fs` is the filesystem (`js/vfs.js`). `canned` is how `scp`, `rsync`, `ssh` and
`git` are simulated deterministically: the exact command line is the key, a key
ending in ` *` is the fallback, and an entry may declare `creates` to leave a
real file behind where a real copy would have. Then run
`node tools/check.mjs` — the two invariants above will tell you immediately if
the challenge is unsolvable or the examples are wrong.

All current challenge nodes have content. Imported episodes and CHPC tutorials
are intentionally long first-pass text challenges; they are source material for
later smaller revisions. Existing worlds, answers and examples remain checked,
so editing code-challenge prose will not quietly make a challenge unsolvable.

Worked-example output is **not typed by hand**. Each challenge declares its
examples' output as entries in one `const OUT = [...]` block, and
`node tools/fill-examples.mjs` runs each example command through the real shell
and rewrites that block with what actually came back. Change a world, re-run
it, and the page catches up. `track-validate.mjs` then checks the same thing
independently, so a hand-edit that drifts is still caught.

## Credits

See the in-site **Sources and licences** register for pinned Software Carpentry
and CHPC SCC attribution. Inspired by [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/).
Terminal by [xterm.js](https://xtermjs.org/). Colours and type are UWC's own.
