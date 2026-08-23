# UWC_HPC

An in-browser Linux trainer for UWC postgraduate students who have never used a
terminal. A learner reads a scenario, works in a simulated shell beside it, and
types an answer to move on.

## Language

**Challenge**:
One unit of the trainer: a scenario, a worked example, a task, a simulated world,
and one answer. Numbered from 0.
_Avoid_: Level, exercise, lesson, puzzle

**Learner**:
The person working through the trainer. A UWC postgraduate with a computer
science background and no Linux experience.
_Avoid_: User, player, student

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

**Concept**:
A named thing a challenge can teach or require — a command, or an idea such as an
absolute path or standard output. Concepts have ids and definitions of their own,
not just names on a challenge.
_Avoid_: Topic, skill, tag

**Concept graph**:
The dependency structure over all challenges, formed by what each one teaches and
requires. It decides what is unlocked, and it branches: two challenges can open
several others at once.
_Avoid_: Syllabus, tree, curriculum, path

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
