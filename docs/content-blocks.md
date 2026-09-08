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
      "type": "markdown",
      "source": "/content/imports/shell-introduction.md",
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

### Markdown

A Markdown block stores CommonMark-style source and a generated safe HTML
fragment. Headings, emphasis, links, lists, fenced code, tables, and footnotes
are supported. Raw HTML is removed before preview and publication.

```markdown
## Heading

**bold**, *italic*, and `inline code`

[Descriptive link text](https://example.com)

- List item
```

The editor supplies Bold, Italic, and Link buttons and an immediate preview.
The learner browser never renders untrusted source.

### Legacy Typst

Existing imported Typst blocks remain readable and publishable so that old
releases do not change. The editor does not create new Typst blocks. Convert a
legacy block to Markdown when editing its source.

### Callout

A callout contains a style and one Markdown body:

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

## Recommended graph and layouts

The Admin stores graph meaning separately from graph presentation:

```json
{
  "nodes": [{"number":"000","topic":"linux","displayOrder":0}],
  "connections": [{"source":"000","target":"016"}],
  "layouts": {
    "journey": {"000":{"x":500,"y":0}},
    "linux": {"000":{"x":250,"y":0}}
  }
}
```

Connections must form an acyclic graph but never control learner access. Layouts
use Cartesian X/Y coordinates and are stored independently for each Topic and
for `journey`. Dragging changes only coordinates. Resetting a view discards its
manual coordinates and deterministically regenerates them from connections.

## Publication

The publisher validates block schemas, links, source and licence metadata, Bash
examples, worlds and validators. It sanitizes Markdown output and writes
immutable HTML/JSON assets. Draft source remains editable in SQLite; Nginx
serves only generated release files.
