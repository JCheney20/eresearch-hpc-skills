#!/usr/bin/env python3
"""Convert pinned upstream Markdown lessons into editable Typst and static HTML.

Usage:
  python3 tools/import-lessons.py /path/to/shell-novice /path/to/git-novice /path/to/scc

Pandoc is the only external tool. Referenced images are copied into the release;
third-party image URLs therefore require network access during import. Generated
files are committed, so production needs no compiler or upstream image host.
"""

import html
import json
import re
import shutil
import subprocess
import sys
import tempfile
import urllib.request
from datetime import date
from pathlib import Path
from urllib.parse import urljoin, urlparse

ROOT = Path(__file__).resolve().parents[1]
TODAY = date.today().isoformat()

SOURCES = [
    {
        "repo": "shell",
        "expected": "22c5a874725bd3048eb7cfceeafd0db3a5e49a2f",
        "github": "https://github.com/swcarpentry/shell-novice",
        "license": "CC-BY-4.0",
        "lessons": [
            ("shell-introduction", "episodes/01-intro.md", "Introducing the Shell", 120),
            ("navigating-files", "episodes/02-filedir.md", "Navigating Files and Directories", 180),
            ("working-with-files", "episodes/03-create.md", "Working With Files and Directories", 180),
            ("pipes-and-filters", "episodes/04-pipefilter.md", "Pipes and Filters", 180),
            ("loops", "episodes/05-loop.md", "Loops", 180),
            ("shell-scripts", "episodes/06-script.md", "Shell Scripts", 180),
            ("finding-things", "episodes/07-find.md", "Finding Things", 180),
        ],
    },
    {
        "repo": "git",
        "expected": "967bc0b38826039f6554845248c8c294ebff1f56",
        "github": "https://github.com/swcarpentry/git-novice",
        "license": "CC-BY-4.0",
        "lessons": [
            ("git-basics", "episodes/01-basics.md", "Automated Version Control", 120),
            ("git-setup", "episodes/02-setup.md", "Setting Up Git", 120),
            ("git-create", "episodes/03-create.md", "Creating a Repository", 120),
            ("git-changes", "episodes/04-changes.md", "Tracking Changes", 180),
            ("git-history", "episodes/05-history.md", "Exploring History", 180),
            ("git-ignore", "episodes/06-ignore.md", "Ignoring Things", 120),
            ("git-remotes", "episodes/07-github.md", "Remotes in GitHub", 180),
            ("git-collaboration", "episodes/08-collab.md", "Collaborating", 120),
            ("git-conflicts", "episodes/09-conflict.md", "Conflicts", 180),
        ],
    },
    {
        "repo": "chpc",
        "expected": "0d585e40a3a3e6d768c598b31443920c70a4ff9e",
        "github": "https://github.com/chpc-tech-eval/scc",
        "license": "Apache-2.0",
        "lessons": [
            ("chpc-scc-tutorial-1", "tutorial1/README.md", "CHPC SCC Tutorial 1", 180),
            ("chpc-scc-tutorial-2", "tutorial2/README.md", "CHPC SCC Tutorial 2", 180),
            ("chpc-scc-tutorial-3", "tutorial3/README.md", "CHPC SCC Tutorial 3", 180),
            ("chpc-scc-tutorial-4", "tutorial4/README.md", "CHPC SCC Tutorial 4", 180),
        ],
    },
]


def run(*args):
    subprocess.run(args, check=True)


def commit(repo):
    return subprocess.check_output(["git", "-C", str(repo), "rev-parse", "HEAD"], text=True).strip()


def normalize_markdown(path):
    text = path.read_text()

    def image_tag(match):
        tag = match.group(0)
        src = re.search(r'''\bsrc=["']([^"']+)["']''', tag, re.I)
        alt = re.search(r'''\balt=["']([^"']*)["']''', tag, re.I)
        if not src:
            return ""
        return f"![{alt.group(1) if alt else ''}]({src.group(1)})"

    text = re.sub(r"<img\b[^>]*>", image_tag, text, flags=re.I)
    return re.sub(r"</?p(?:\s[^>]*)?>", "", text, flags=re.I)


def rewrite_links(fragment, page_url, raw_url):
    def replace(match):
        attr, quote, value = match.groups()
        if value.startswith(("https://", "http://", "mailto:", "#", "data:")):
            return match.group(0)
        base = raw_url if attr == "src" else page_url
        return f"{attr}={quote}{html.escape(urljoin(base, value), quote=True)}{quote}"

    return re.sub(r"\b(href|src)=([\"'])(.*?)\2", replace, fragment)


def localize_images(fragment, slug, repo, raw_root):
    assets = ROOT / "content" / "assets" / slug
    assets.mkdir(parents=True, exist_ok=True)
    seen = {}

    def replace(match):
        quote, encoded_url = match.groups()
        url = html.unescape(encoded_url)
        if url in seen:
            return f"src={quote}{seen[url]}{quote}"

        name = re.sub(r"[^A-Za-z0-9._-]", "-", Path(urlparse(url).path).name) or "image"
        if not Path(name).suffix and url.startswith("https://img.shields.io/"):
            name += ".svg"
        public_path = f"/content/assets/{slug}/{len(seen) + 1:03d}-{name}"
        target = ROOT / public_path.removeprefix("/")
        if url.startswith(raw_root):
            shutil.copyfile(repo / url.removeprefix(raw_root), target)
        else:
            request = urllib.request.Request(url, headers={"User-Agent": "uwc-hpc-skills-importer"})
            with urllib.request.urlopen(request) as response, target.open("wb") as output:
                shutil.copyfileobj(response, output)
        seen[url] = public_path
        return f"src={quote}{public_path}{quote}"

    return re.sub(r"\bsrc=([\"'])(.*?)\1", replace, fragment)


def main(paths):
    if len(paths) != 3:
        raise SystemExit("Pass shell-novice, git-novice, and scc repository paths.")

    repos = dict(zip(("shell", "git", "chpc"), map(Path, paths)))
    imports = ROOT / "content" / "imports"
    generated = ROOT / "content" / "generated"
    challenges = ROOT / "content" / "challenges"
    for directory in (imports, generated, challenges):
        directory.mkdir(parents=True, exist_ok=True)

    manifest = {"generatedAt": TODAY, "sources": []}
    for source in SOURCES:
        repo = repos[source["repo"]]
        actual = commit(repo)
        if actual != source["expected"]:
            raise SystemExit(f"{repo}: expected {source['expected']}, got {actual}")
        manifest["sources"].append({
            "repository": source["github"], "commit": actual, "license": source["license"]
        })

        for slug, relative, title, _seconds in source["lessons"]:
            markdown = repo / relative
            typst = imports / f"{slug}.typ"
            rendered = generated / f"{slug}.html"
            source_url = f"{source['github']}/blob/{actual}/{relative}"
            owner, repository = source["github"].split("/")[-2:]
            raw_root = f"https://raw.githubusercontent.com/{owner}/{repository}/{actual}/"
            raw_base = raw_root + f"{Path(relative).parent}/"
            page_base = f"{source['github']}/blob/{actual}/{Path(relative).parent}/"

            with tempfile.TemporaryDirectory() as tmp:
                normalized = Path(tmp) / "source.md"
                normalized.write_text(normalize_markdown(markdown))
                raw_html = Path(tmp) / "lesson.html"
                source_format = "markdown+fenced_divs+task_lists+pipe_tables+strikeout+autolink_bare_uris"
                run("pandoc", str(normalized), "-f", source_format, "-t", "typst", "--wrap=none", "-o", str(typst))
                # Pandoc's Typst writer currently emits this helper, while its
                # Typst reader intentionally accepts only built-in constructs.
                converted = typst.read_text().replace("#horizontalrule", "---")
                notice = (
                    f"// Imported from {source_url}\n"
                    f"// Licensed under {source['license']}; formatting converted on {TODAY}.\n\n"
                )
                typst.write_text(notice + converted)
                run("pandoc", str(typst), "-f", "typst", "-t", "html5", "--wrap=none", "-o", str(raw_html))
                fragment = rewrite_links(raw_html.read_text(), page_base, raw_base)
                rendered.write_text(localize_images(fragment, slug, repo, raw_root))

            data = {
                "schemaVersion": 1,
                "kind": "text",
                "title": title,
                "author": "Justin Cheney",
                "updated": TODAY,
                "minimumReadSeconds": 120,
                "workInProgress": True,
                "source": {
                    "label": source["github"].split("/")[-1],
                    "url": source_url,
                    "repository": source["github"],
                    "commit": actual,
                    "license": source["license"],
                    "adaptation": "Formatting converted from upstream Markdown to Typst and HTML; wording retained for initial review.",
                },
                "blocks": [{
                    "id": "body",
                    "type": "typst",
                    "source": f"/content/imports/{slug}.typ",
                    "rendered": f"/content/generated/{slug}.html",
                }],
            }
            (challenges / f"{slug}.json").write_text(json.dumps(data, indent=2) + "\n")

    (ROOT / "content" / "imports" / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


if __name__ == "__main__":
    main(sys.argv[1:])
