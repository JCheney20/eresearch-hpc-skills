import html
import re
from urllib.parse import urlparse

from django.core.exceptions import ValidationError

INLINE = re.compile(r'#link\("([^"]+)"\)\[([^]]+)\]|`([^`]+)`|\*([^*\n]+)\*|_([^_\n]+)_')


def render_inline(source):
    output, cursor = [], 0
    for match in INLINE.finditer(source):
        output.append(html.escape(source[cursor:match.start()]))
        url, label, code, strong, emphasis = match.groups()
        if url is not None:
            if urlparse(url).scheme not in {"http", "https"}:
                raise ValidationError("Typst links must use HTTP or HTTPS.")
            output.append(f'<a href="{html.escape(url, quote=True)}">{html.escape(label)}</a>')
        elif code is not None:
            output.append(f"<code>{html.escape(code)}</code>")
        elif strong is not None:
            output.append(f"<strong>{html.escape(strong)}</strong>")
        else:
            output.append(f"<em>{html.escape(emphasis)}</em>")
        cursor = match.end()
    output.append(html.escape(source[cursor:]))
    return "".join(output)


def render_typst(source):
    if re.search(r"#(?!link\()", source):
        raise ValidationError("Only the Typst link function is supported.")

    output, paragraph, list_items = [], [], []
    def flush():
        if paragraph:
            output.append(f"<p>{render_inline(' '.join(paragraph))}</p>")
            paragraph.clear()
        if list_items:
            output.append("<ul>" + "".join(f"<li>{render_inline(item)}</li>" for item in list_items) + "</ul>")
            list_items.clear()

    for raw_line in source.splitlines():
        line = raw_line.strip()
        if not line:
            flush()
        elif line.startswith("= "):
            flush()
            output.append(f"<h2>{render_inline(line[2:])}</h2>")
        elif line.startswith("== "):
            flush()
            output.append(f"<h3>{render_inline(line[3:])}</h3>")
        elif line.startswith("- "):
            if paragraph:
                flush()
            list_items.append(line[2:])
        else:
            if list_items:
                flush()
            paragraph.append(line)
    flush()
    return "\n".join(output)


def render_blocks(blocks):
    rendered = []
    for block in blocks:
        kind = block["type"]
        if kind == "typst":
            markup = render_typst(block["source"])
        elif kind == "callout":
            markup = f'<aside class="callout callout-{block["style"]}">{render_typst(block["source"])}</aside>'
        else:
            command = html.escape(block["command"])
            output = html.escape(block.get("output", ""))
            markup = f'<figure class="bash"><pre><code>{command}</code></pre>'
            if output:
                markup += f"<pre><samp>{output}</samp></pre>"
            markup += "</figure>"
        rendered.append({"id": block["id"], "type": kind, "html": markup})
    return rendered
