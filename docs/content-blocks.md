# Challenge block format

This is the authoring contract for the planned Django editor and static publisher.
It is deliberately closer to a Jupyter notebook than a rich-text CMS: a challenge
revision is an ordered list of small, typed blocks.

## Challenge revision

```json
{
  "schemaVersion": 1,
  "kind": "text",
  "title": "Introducing the Shell",
  "author": "Justin Cheney",
  "updated": "2026-09-03",
  "minimumReadSeconds": 120,
  "source": {
    "label": "shell-novice",
    "url": "https://github.com/.../blob/<commit>/episodes/01-intro.md",
    "commit": "<full commit>",
    "license": "CC-BY-4.0",
    "adaptation": "Formatting converted; lesson order changed."
  },
  "blocks": [
    {
      "id": "body",
      "type": "typst",
      "source": "/content/imports/shell-introduction.typ",
      "rendered": "/content/generated/shell-introduction.html"
    }
  ]
}
```

Block IDs are stable within a challenge so reordering does not make every block
look newly created in revision comparisons.

## Challenge kinds

- `text`: ordered blocks followed by a fixed 120-second reading timer and an
  explicit **Mark complete** action. Elapsed background time counts.
- `code`: ordered blocks plus a task, hints and an answer or terminal-state
  validator. Successful validation completes it; there is no reading timer.

Kind belongs to the revision. Changing kind creates and validates a new revision
without changing the stable challenge number.

## Blocks

### Typst

A Typst block stores editable source and a generated safe HTML fragment. The
first supported author-facing subset is:

```typst
= Heading
== Subheading
*bold*
_italic_
`inline code`
#link("https://example.com")[descriptive link text]
- list item
```

The editor supplies Bold, Italic and Link buttons and an immediate preview.
Publication rejects unsupported functions. As Typst's semantic HTML export
matures, the whitelist may expand after accessibility and rendering tests; the
learner browser never compiles Typst.

The initial upstream imports were mechanically converted from Markdown to Typst
with Pandoc. Their generated HTML is committed beside the source. The first
local content edit must pass the same restricted-Typst validation used by the
publisher.

### Callout

A callout contains a style and one restricted-Typst body:

```json
{"id":"note-1","type":"callout","style":"note","source":"..."}
```

Initial styles are `note`, `hint`, and `warning`. Imported `exercise` and
`solution` callouts are temporary: each exercise will become its own text or
code challenge with a tied validator/solution.

### Bash

A Bash block stores a command, expected output, and one display mode:

```json
{
  "id": "bash-1",
  "type": "bash",
  "command": "pwd",
  "output": "/home/student",
  "mode": "copy"
}
```

Modes are `display`, `copy`, and `run`. `run` is available only when the
simulated shell and declarative world support the command.

## Publication

The publisher validates block schemas, the restricted Typst AST, links, source
and licence metadata, Bash examples, worlds and validators. It then sanitizes
and writes immutable HTML/JSON assets. Draft source remains editable in SQLite;
Nginx serves only generated release files.
