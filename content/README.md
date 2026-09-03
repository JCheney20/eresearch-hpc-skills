# Imported lesson content

`challenges/` contains the ordered block documents loaded by text challenges.
`imports/` contains editable Typst source plus the pinned source manifest.
`generated/` contains the static HTML fragments served to learners. `assets/`
contains local copies of lesson images so published lessons do not depend on
upstream image hosting.

The current imports are pinned in `tools/import-lessons.py`. To review and
regenerate them, clone those exact commits and run:

```bash
pandoc --version
python3 tools/import-lessons.py /path/to/shell-novice /path/to/git-novice /path/to/scc
node tools/check.mjs
```

Do not point the importer at newer commits without reviewing their content and
licence changes. Generated HTML is committed so Nginx needs no Typst, Pandoc,
Python, or database on the public path.
