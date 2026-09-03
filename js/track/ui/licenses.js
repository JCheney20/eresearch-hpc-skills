import { el } from "./dom.js";
import { topbar } from "./parts.js";

const SOURCES = [
  {
    name: "The Unix Shell",
    use: "Imported Linux text challenges.",
    source: "https://github.com/swcarpentry/shell-novice/tree/22c5a874725bd3048eb7cfceeafd0db3a5e49a2f",
    licence: "CC BY 4.0 instructional material; MIT-licensed example software.",
    licenceUrl: "https://github.com/swcarpentry/shell-novice/blob/22c5a874725bd3048eb7cfceeafd0db3a5e49a2f/LICENSE.md",
    notice: "Derived from work Copyright © The Carpentries. Formatting was converted and the lesson order was changed.",
  },
  {
    name: "Version Control with Git",
    use: "Imported Git text challenges.",
    source: "https://github.com/swcarpentry/git-novice/tree/967bc0b38826039f6554845248c8c294ebff1f56",
    licence: "CC BY 4.0 instructional material; MIT-licensed example software.",
    licenceUrl: "https://github.com/swcarpentry/git-novice/blob/967bc0b38826039f6554845248c8c294ebff1f56/LICENSE.md",
    notice: "Derived from work Copyright © The Carpentries. Formatting was converted and the lesson order was changed.",
  },
  {
    name: "CHPC Student Cluster Competition tutorials",
    use: "Four imported HPC tutorial text challenges and reference material for future smaller HPC challenges.",
    source: "https://github.com/chpc-tech-eval/scc/tree/0d585e40a3a3e6d768c598b31443920c70a4ff9e",
    licence: "Apache License 2.0.",
    licenceUrl: "https://github.com/chpc-tech-eval/scc/blob/0d585e40a3a3e6d768c598b31443920c70a4ff9e/LICENSE",
    notice: "Formatting was converted. The imported tutorials remain long-form source material pending review, simplification, and splitting.",
  },
];

export function renderLicenses(mount) {
  const root = el("div", "app");
  const page = el("main", "licencepage");
  const head = el("header", "pagehead");
  head.append(el("span", "headrule wide"), el("p", "cnum", "Source register"), el("h1", "ctitle", "Sources and licences"));
  head.append(el("p", "lede", "Imported lessons retain a link to their exact source revision. This page records the licence and where each source is used."));
  page.append(head);

  const list = el("div", "licencelist");
  for (const source of SOURCES) {
    const item = el("section", "licenceitem");
    item.append(el("h2", "", source.name));
    item.append(el("p", "", `<strong>Used for:</strong> ${source.use}`));
    item.append(el("p", "", `<strong>Licence:</strong> <a href="${source.licenceUrl}" target="_blank" rel="noopener noreferrer">${source.licence}</a>`));
    item.append(el("p", "", source.notice));
    const original = el("a", "btn ghost small", "View pinned source →");
    original.href = source.source;
    original.target = "_blank";
    original.rel = "noopener noreferrer";
    item.append(original);
    list.append(item);
  }
  page.append(list);

  const local = el("section", "localnotice");
  local.append(el("h2", "", "UWC-authored material"));
  local.append(el("p", "", "Original UWC HPC Skills material has no separate public reuse licence declared at this time. Imported material remains governed by the licences listed above."));
  page.append(local);

  root.append(topbar(null), page);
  mount(root);
  return root;
}
