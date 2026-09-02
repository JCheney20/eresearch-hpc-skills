// Headless validation of the beginner track: node tools/track-validate.mjs
//
// Two invariants carry the whole thing, and both are checked against the real
// shell engine rather than a description of it:
//
//   1. Running a challenge's `solution` against its built world produces
//      output containing its `answer`. If that breaks, the challenge is
//      unsolvable and nobody would find out until a learner did.
//   2. Every `example.output` is exactly what the shell prints for that
//      `example.command`. If that breaks, the page is lying to a beginner
//      about what they are about to see.
//
// Plus the shape checks: every challenge is placed in the curriculum, every
// dependency it declares exists, and the required fields are present.

import { CHALLENGES } from "../js/track/challenges/index.js";
import { makeSession, silentTerm } from "../js/track/session.js";
import { ALL_NODES, TOPICS, topicOf, nodeByNumber, requirementsMet } from "../js/track/topics.js";
import { CONTENT_RELEASE } from "../js/track/content.js";
import { judge, normalise } from "../js/track/answer.js";

let total = 0, failed = 0;

function check(desc, cond, detail) {
  total++;
  if (cond) {
    console.log(`ok   - ${desc}`);
  } else {
    failed++;
    console.log(`FAIL - ${desc}${detail ? `\n       ${detail}` : ""}`);
  }
}

/* ---- the curriculum ----------------------------------------------------- */

const slugs = ALL_NODES.map(n => n.slug);
check("every challenge in the curriculum has a unique slug",
  new Set(slugs).size === slugs.length);

const nums = ALL_NODES.map(n => n.num);
check("every challenge in the curriculum has a unique numeric position",
  new Set(nums).size === nums.length);
check("the content release has an identity", !!CONTENT_RELEASE.releaseId);
check("every challenge has a unique stable number",
  new Set(ALL_NODES.map(n => n.number)).size === ALL_NODES.length);
check("every challenge revision has a unique ID",
  new Set(ALL_NODES.map(n => n.id)).size === ALL_NODES.length);

for (const node of ALL_NODES) {
  check(`${node.slug}: has a three-digit hexadecimal challenge number`,
    /^[0-9A-F]{3}$/.test(node.number), node.number);
  check(`${node.slug}: has a three-digit hexadecimal revision`,
    /^[0-9A-F]{3}$/.test(node.revision), node.revision);
  check(`${node.slug}: revision ID combines its number and revision`,
    node.id === node.number + node.revision, node.id);
  check(`${node.slug}: numeric position matches its hexadecimal number`,
    node.num === Number.parseInt(node.number, 16));
  check(`${node.slug}: has a known challenge kind`,
    node.kind === "reading" || node.kind === "interactive", node.kind);

  for (const group of node.prerequisiteGroups) {
    check(`${node.slug}: prerequisite group has a known mode`,
      group.mode === "all" || group.mode === "any", group.mode);
    check(`${node.slug}: prerequisite group is not empty`, group.sources.length > 0);
    check(`${node.slug}: prerequisite sources are unique`,
      new Set(group.sources).size === group.sources.length);
    check(`${node.slug}: every prerequisite source exists`,
      group.sources.every(source => nodeByNumber(source) !== null),
      JSON.stringify(group.sources));
    check(`${node.slug}: does not require itself`, !group.sources.includes(node.number));
  }
}

/* No cycles: walking every edge from any node must terminate. */
for (const node of ALL_NODES) {
  const seen = new Set();
  const stack = [node.number];
  let cyclic = false;
  while (stack.length) {
    const number = stack.pop();
    if (seen.has(number)) continue;
    seen.add(number);
    const current = nodeByNumber(number);
    const sources = current ? current.prerequisiteGroups.flatMap(group => group.sources) : [];
    if (sources.includes(node.number)) { cyclic = true; break; }
    stack.push(...sources);
  }
  check(`${node.slug}: its prerequisites do not form a cycle`, !cyclic);
}

check("the core has no prerequisites at its head",
  TOPICS[0].nodes[0].prerequisiteGroups.length === 0);
check("all-of groups require every source",
  !requirementsMet({ prerequisiteGroups: [{ mode: "all", sources: ["001", "002"] }] }, ["001"]) &&
  requirementsMet({ prerequisiteGroups: [{ mode: "all", sources: ["001", "002"] }] }, ["001", "002"]));
check("any-of groups require at least one source",
  !requirementsMet({ prerequisiteGroups: [{ mode: "any", sources: ["001", "002"] }] }, []) &&
  requirementsMet({ prerequisiteGroups: [{ mode: "any", sources: ["001", "002"] }] }, ["002"]));

/* ---- each written challenge --------------------------------------------- */

for (const slug of Object.keys(CHALLENGES)) {
  const c = CHALLENGES[slug];
  check(`${slug}: is placed in the curriculum`, topicOf(slug) !== null);
  check(`${slug}: its number matches the curriculum`,
    topicOf(slug) && topicOf(slug).num === c.num);
  check(`${slug}: exposes its stable revision ID`,
    c.revisionId === topicOf(slug).node.id);
  check(`${slug}: uses its declared challenge kind`,
    c.kind === topicOf(slug).node.kind);

  if (c.kind === "reading") {
    check(`${slug} (reading): has cards with content`,
      Array.isArray(c.cards) && c.cards.length > 0 &&
      c.cards.every(card => typeof card.html === "string" && card.html.trim()));
    continue;
  }

  for (const field of ["scenario", "task", "answerLabel", "answer"]) {
    check(`${slug}: has a non-empty ${field}`,
      typeof c[field] === "string" && c[field].trim().length > 0);
  }
  check(`${slug}: has exactly three hints`,
    Array.isArray(c.hints) && c.hints.length === 3);
  check(`${slug}: has at least one worked example`,
    Array.isArray(c.example) && c.example.length > 0);
  check(`${slug}: declares a solution`,
    Array.isArray(c.solution) && c.solution.length > 0);
  check(`${slug}: declares at least one variant`,
    Array.isArray(c.variants) && c.variants.length > 0);

  for (let vi = 0; vi < (c.variants || []).length; vi++) {
    const label = c.variants.length > 1 ? `${slug} variant ${vi}` : slug;

    // --- invariant 1: the solution actually solves it --------------------
    {
      const { shell } = makeSession(c, silentTerm(), vi);
      let out = "";
      for (const line of c.solution) {
        const r = shell.run(line);
        check(`${label}: solution step "${line}" runs without a shell error`,
          !r.err, r.err);
        out += (r.out || "") + "\n";
      }
      /* How the answer relates to what the solution printed. Most answers are
         a value you read off the output; some are a count of what came back,
         and those will never appear in it verbatim. A challenge says which,
         and the default is the strict one. */
      const mode = c.answerCheck || "contains";
      const words = out.trim() ? out.trim().split(/\s+/).length : 0;
      const lines = out.trim() ? out.trim().split("\n").length : 0;
      const found =
        mode === "countWords" ? words === Number(c.answer) :
        mode === "countLines" ? lines === Number(c.answer) :
        out.toLowerCase().includes(String(c.answer).toLowerCase());
      check(`${label}: running the solution yields the answer ("${c.answer}", by ${mode})`,
        found,
        `got: ${JSON.stringify(out.slice(0, 240))}`);
      check(`${label}: declares a known answerCheck`,
        ["contains", "countWords", "countLines"].includes(mode), mode);
    }

    // --- invariant 2: the examples are honest ----------------------------
    for (let ei = 0; ei < c.example.length; ei++) {
      const ex = c.example[ei];
      const { shell } = makeSession(c, silentTerm(), vi);
      const r = shell.run(ex.command);
      const got = ((r.out || "") + (r.err || "")).replace(/\n$/, "");
      check(`${label}: example[${ei}] "${ex.command}" prints what the page says it prints`,
        got === ex.output,
        `expected: ${JSON.stringify(ex.output.slice(0, 200))}\n       got:      ${JSON.stringify(got.slice(0, 200))}`);
    }

    // --- the answer model accepts the answer and rejects the near-misses --
    {
      const right = await judge(c, c.answer);
      check(`${label}: its own answer is accepted`, right.state === "right");
      for (const alt of c.alternatives || []) {
        const r = await judge(c, alt);
        check(`${label}: accepts the alternative "${alt}"`, r.state === "right");
      }
      for (const f of c.failures || []) {
        check(`${label}: its failure patterns do not also match the right answer`,
          !f.match.test(normalise(c.answer)),
          `${f.match} matches ${normalise(c.answer)}`);
      }
      const wrong = await judge(c, "definitely-not-the-answer");
      check(`${label}: a wrong answer is rejected with a message`,
        wrong.state === "wrong" && !!wrong.message);
    }
  }
}

console.log(`\n${total - failed}/${total} checks passed`);
process.exit(failed ? 1 : 0);
