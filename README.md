# UWC_HPC

A browser-based wargame in the spirit of [OverTheWire: Bandit](https://overthewire.org/wargames/bandit/),
built from the UWC2026 student-cluster tutorials. 25 levels take a player from
`ls` and `cat`, through pipes, permissions and `journalctl`, to nftables
firewalls, chrony, NFS, MUNGE, Slurm and HPL tuning — all on a simulated
Rocky Linux cluster that runs entirely in the browser (xterm.js + a small
JavaScript shell). No backend, no build step.

## Run locally

```sh
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` directly from `file://` also works in most browsers,
since there is no fetch and no bundler.)

## Deploy

- **GitHub Pages**: push this directory as a repo, then Settings → Pages →
  deploy from branch, root folder. `.nojekyll` is already in place.
- **Vercel**: `vercel --prod` with framework preset "Other", output directory `.`.

## How the game works

- Each level is a data module in `js/levels/levelNN.js`: a goal, a virtual
  filesystem, canned outputs for cluster commands (`systemctl`, `journalctl`,
  `nft`, `chronyc`, `sinfo`…), and optional hooks for stateful moments
  (`sbatch` producing an output file, fixing munge key permissions).
- Solving a level yields a **password** that unlocks the next one. The site
  checks `SHA-256(input)` against `js/levels/hashes.js`; progress lives in
  `localStorage`. Knowing a later level's password lets you jump straight to
  it, exactly like Bandit.
- Every level has **12 variants** (different passwords, filenames, broken
  services, subnets, HPL numbers). One playthrough seed picks your variant per
  level; the **new playthrough** footer link rerolls everything for replay.
- **Honor-system note**: like Bandit, the answers are technically in the
  (public) source. The gating stops accidental skipping, not determined
  source-reading — reading the source is arguably also learning.

## Authoring

- `tools/generate.py` — regenerates `js/levels/gen-data.js` (variant passwords
  and answer data) and `js/levels/hashes.js` (gate hashes) in one run so they
  can never disagree. Re-run it to rotate all passwords.
- `tools/validate.mjs` — `node tools/validate.mjs`: checks every level ×
  variant (hash chain intact, password discoverable in content).
- `tools/smoke.mjs` — `node tools/smoke.mjs`: plays the intended solution of
  all 25 levels × 12 variants through the real shell engine.
- `tools/hash.html` — manual SHA-256 helper for one-off level authoring.
- Browser console: `validateLevels()` runs the same checks in-page.

### Adding a level

1. Create `js/levels/levelNN.js` exporting `{ n, title, commands, reading,
   variants, build(v) }` (see any existing level; `variants` needs ≥ 10
   entries, each with a `pass`).
2. Register it in `js/levels/index.js` and teach `tools/generate.py` about its
   yielded passwords (append to `PW` handling or the answer tables).
3. `python3 tools/generate.py && node tools/validate.mjs && node tools/smoke.mjs`.

## Layout

```
index.html            single page; hash routes: #/  #/level/N  #/cheatsheet  #/docs/<topic>
css/style.css         matte-black OverTheWire-style theme
js/shell.js           simulated shell: tokenizer, pipes, > >>, globs, Tab, history
js/vfs.js             per-level virtual filesystem
js/commands/          coreutils.js (ls, grep, find…) + scenario.js (systemctl, nft…)
js/gate.js            SHA-256 unlock + localStorage progress
js/variants.js        seeded per-playthrough variant selection
js/levels/            level00–level24 + generated gen-data.js / hashes.js
js/content.js         cheatsheet + condensed docs
vendor/               xterm.js 5.3.0 + fit addon (vendored, no CDN)
tools/                generate.py, validate.mjs, smoke.mjs, hash.html
```

Content sources: the UWC2026 repo — tutorials 1–4, `docs/errata.md` (the
transposed-subnet, munge-key and package-name bugs are real upstream bugs),
`modules/firewall.nix`, `modules/chrony.nix`, `modules/slurm.nix`, and
`benchmarks/hpl/HPL.dat`.
