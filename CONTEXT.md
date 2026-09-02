# UWC_HPC

An in-browser Linux trainer for university students who may never have used a
terminal. A learner reads a scenario, works in a simulated shell beside it, and
types an answer to move on.

## Language

**Challenge**:
One unit of the trainer: a scenario, a worked example, a task, a simulated world,
and one answer. Numbered from 0.
_Avoid_: Level, exercise, lesson, puzzle

**Learner**:
A university student working through the trainer, with no assumed computing or
Linux background.
_Avoid_: User, player

**Answer**:
What the learner types into the answer field to complete a challenge. Either a
password or a computed fact.
_Avoid_: Solution, flag, submission

**Password**:
An answer hidden in the challenge's world, to be found by searching. Used where
finding it is the skill being taught.
_Avoid_: Token, key, secret

**Computed fact**:
An answer the learner works out by reading command output — a line count, a word,
a size. Used where searching is not the skill being taught.
_Avoid_: Value, result

**Hint ladder**:
The three hints attached to a challenge — nudge, method, solution — revealed one
at a time, so no learner is stuck permanently.
_Avoid_: Hints, help, clues

**Rung**:
One hint in the ladder. There are always three.
_Avoid_: Step, level, tier

**Solution**:
The commands that solve a challenge as intended. It supplies the final hint rung,
the smoke test's script, and the validator's proof that the answer is derivable.
_Avoid_: Walkthrough, answer key

**Failure message**:
The sentence shown for a specific wrong answer, declared by the challenge as a
match paired with an explanation. Distinct from a hint, which the learner requests
before answering.
_Avoid_: Error, validation message

**Challenge graph**:
The directed acyclic dependency structure over all challenges, formed by explicit
prerequisite edges. It decides what is unlocked, and it can branch: two challenges
can open several others at once.
_Avoid_: Syllabus, tree, curriculum, path

**Prerequisite edge**:
A directed relationship declaring that a target challenge requires completion of
a source challenge before it becomes available.
_Avoid_: Connection, link, dependency rule

**Prerequisite group**:
A set of prerequisite edges evaluated as all-of or any-of. A challenge unlocks
only when every one of its prerequisite groups is satisfied.
_Avoid_: Boolean expression, condition set

**Interactive challenge**:
A challenge with a world, simulated shell, answer, and hint ladder. It is distinct
from a reading challenge and cannot omit any of those parts.
_Avoid_: Terminal lesson, shell exercise

**Topic**:
A presentation group of challenges with a name, blurb, and display order. Topics
do not determine prerequisite edges.
_Avoid_: Route, track, path

**Learner progress**:
A learner's record of challenge number, revision, variant, started/completed
state, and timestamps. It is initially retained only in that browser and later
eligible for university-SSO-backed storage.
_Avoid_: Session state, account history

**Content export**:
A JSON recovery artifact containing content releases, retained revisions, drafts,
the challenge graph, and audit records, but no authentication secrets.
_Avoid_: Database dump, backup file

**Current challenge graph**:
The challenge graph from the newest published content release. It determines
availability only for challenges a learner has not started.
_Avoid_: Live graph, current path

**Reading challenge**:
A challenge with no answer, no world, and no hints, which the learner completes by
visiting it. Challenge 0 is one.
_Avoid_: Intro, page, lesson

**Worked example**:
The demonstration of a command in use, shown in the reading pane without the
learner asking for it. Distinct from a hint, which is requested.
_Avoid_: Sample, demo

**Variant**:
One authored instance of a challenge, differing in the values, names, and counts
its world contains. Five per challenge.
_Avoid_: Version, instance, permutation

**Variable area**:
A part of a challenge that changes between variants — a value, a file count, a
name, a size. The unit an admin would later declare a range over.
_Avoid_: Parameter, field, slot

**Reading pane**:
The left column of the challenge screen: title, scenario, worked example,
challenge text, and the answer field.
_Avoid_: Sidebar, instructions panel, left panel

**Terminal pane**:
The right column of the challenge screen, holding the simulated shell.
_Avoid_: Console, right panel

**Simulated shell**:
The JavaScript shell that parses commands and answers them from a virtual
filesystem and canned scenario output. It imitates Rocky Linux; it runs nothing
real.
_Avoid_: Emulator, sandbox, virtual machine

**World**:
Everything a challenge's variant sets up for the learner to explore: the virtual
filesystem and the canned output the scenario commands return.
_Avoid_: Environment, state, fixture

**Admin**:
A university-authorized person who authors and publishes challenge content through
the admin application.
_Avoid_: Editor, author, content manager

**Challenge revision**:
An immutable published snapshot of one challenge's authored content and world.
Its six-hex-digit challenge revision ID combines the three-digit challenge number
and three-digit revision number.
_Avoid_: Version, draft, update

**Challenge number**:
The stable three-hex-digit prefix of a challenge revision ID. It identifies the
challenge independently of its revision number.
_Avoid_: Level number, challenge ID

**Challenge revision ID**:
A six-hex-digit identifier: a challenge number followed by its revision number.
For example, `00F001` is challenge `00F` (decimal 15), revision `001`.
_Avoid_: Challenge ID, version ID

**Started challenge**:
A challenge for which a learner has taken a first learning action: revealing a
hint, running a terminal command, or submitting an answer. It remains on its
selected challenge revision even when a later revision is published.
_Avoid_: In-progress lesson, active exercise

**Draft**:
A mutable, unpublished admin-authored change to challenge content or the concept
graph. Saving a draft does not create a challenge revision.
_Avoid_: Revision, autosave, live version

**Completed challenge**:
A challenge for which a learner has supplied a correct answer on its selected
challenge revision. It remains part of that learner's progress after later
revisions are published and satisfies current prerequisites for that challenge
number.
_Avoid_: Finished lesson, passed level

**Expired attempt**:
A started challenge whose revision has left the five-revision eligibility window.
The learner must confirm a restart on the newest published revision.
_Avoid_: Stale session, outdated progress

**Published revision**:
The newest challenge revision available to learners who have not started that
challenge.
_Avoid_: Live version, current draft

**Content release**:
An immutable, atomically published set of challenge revisions and one validated
challenge graph. It is the learner-visible unit of publication.
_Avoid_: Deployment, draft, partial update

**Audit record**:
An immutable record of an admin change or publication, including its author,
time, changed fields, and prior revision.
_Avoid_: Edit history, activity log

**Archived challenge**:
A challenge omitted from the current challenge graph. It is unavailable to new
learners but retains its recent revision history and eligible started attempts.
_Avoid_: Deleted challenge, removed level

**Revision window**:
The ten newest revisions retained for a challenge. Only its newest five revisions
are eligible for unfinished learner attempts.
_Avoid_: Version history, retention policy
