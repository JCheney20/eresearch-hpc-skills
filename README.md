# UWC_HPC

A browser trainer that takes a UWC postgraduate from never having opened a
terminal to running work on the cluster. No install, no account, no backend:
the whole thing is static files and a simulated Linux that runs in the tab.

Open `index.html` over HTTP (ES modules will not load from `file://`):

    python3 -m http.server 8000    # then visit http://localhost:8000

## What is here

**The beginner track** (`index.html`) is the current trainer. Nineteen
challenges across five topics, drawn as a graph: a core of nine that takes
everyone from "what is a prompt" to logging in with `ssh`, then three routes
that open at once — moving files, keeping a record, running work — and a
finale that needs all three.

Each challenge is a reading pane on the left and a live terminal on the right.
The learner reads the scenario, copies a worked example, tries it, and answers
a question about what they saw. Answers are *computed facts* — a job ID, a
file size, a count — rather than passwords copied from one screen to the next,
so a right answer means they read the output.

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
      content.js          stable IDs, topics and explicit prerequisites
      topics.js           runtime projection of the authored curriculum
      challenges/         one file per challenge, plus the shared worlds
      commands.js         scp, rsync, ll, tldr, df, watch, git
      session.js          a challenge, wired to the shell engine
      progress.js         what is solved, and therefore what is open
      answer.js           normalising and judging an answer
      ui/                 the three screens
    tools/                the checks
    vendor/               xterm.js

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

Add the challenge's stable number, initial revision, topic and explicit
prerequisite groups to `js/track/content.js`. Topics control presentation only;
prerequisites are authored as `all` or `any` groups of challenge numbers. Then
write `js/track/challenges/<slug>.js` and import it in
`js/track/challenges/index.js`. These challenge modules are the compatibility
source for prose and worlds while that content is migrated to the declarative
format.

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

All nineteen are written. The prose is a first pass and expects to be edited;
the worlds, answers and examples behind it are checked, so editing the words
will not quietly break a challenge.

Worked-example output is **not typed by hand**. Each challenge declares its
examples' output as entries in one `const OUT = [...]` block, and
`node tools/fill-examples.mjs` runs each example command through the real shell
and rewrites that block with what actually came back. Change a world, re-run
it, and the page catches up. `track-validate.mjs` then checks the same thing
independently, so a hand-edit that drifts is still caught.

## Credits

Inspired by [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/).
Terminal by [xterm.js](https://xtermjs.org/). Colours and type are UWC's own.
