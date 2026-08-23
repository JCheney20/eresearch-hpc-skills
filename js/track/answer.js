// The answer model.
//
// Normalising is central and shared: trim, collapse inner whitespace,
// lowercase, strip a trailing full stop. A challenge declares a canonical
// answer plus accepted alternatives — data, not a per-challenge function, so
// the same declaration survives into an authoring form later.
//
// Two kinds of answer, one code path. A *computed fact* ("how many files did
// rsync transfer") is compared in plaintext, because the trainer has to be
// able to say why a near-miss is wrong. A *password* is compared by SHA-256
// against `answerHash`, so it is not sitting in the page source for a learner
// who opens dev tools. Failure messages only exist for the first kind; a
// password either matches or it does not.

export function normalise(s) {
  return String(s).trim().replace(/\s+/g, " ").toLowerCase().replace(/\.$/, "");
}

export async function sha256(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function judge(challenge, raw) {
  const v = normalise(raw);
  if (!v) return { state: "empty" };

  if (challenge.answerHash) {
    const h = await sha256(v);
    if (h === challenge.answerHash) return { state: "right" };
    return { state: "wrong", message: challenge.genericFailure || "Not that one. Check for a typo — a password has to match exactly." };
  }

  const accepted = [challenge.answer, ...(challenge.alternatives || [])].map(normalise);
  if (accepted.includes(v)) return { state: "right" };

  for (const f of challenge.failures || []) {
    if (f.match.test(v)) return { state: "wrong", message: f.message };
  }

  // One rule is built in rather than redeclared per challenge: an off-by-one
  // on a numeric answer nearly always means a miscount, and saying so is more
  // use than "not that one".
  const n = Number(v);
  const target = Number(challenge.answer);
  if (!Number.isNaN(n) && !Number.isNaN(target) && Math.abs(n - target) === 1) {
    return { state: "wrong", message: "You are one out. Check whether you counted something you should not have." };
  }

  return { state: "wrong", message: challenge.genericFailure || "Not that one. Read the output again — the answer is in there." };
}
