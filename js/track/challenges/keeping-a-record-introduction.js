// Reading introduction for the Keeping a record topic.

export default {
  num: 20,
  slug: "keeping-a-record-introduction",
  title: "What Git keeps for you",
  kind: "reading",
  commands: [],
  teaches: ["repository", "working copy", "commit", "history"],
  variants: [{ i: 0 }],

  lede: `Research files change. Git gives those changes names and an order, so
    you can see what happened without keeping folders called final and final-2.`,

  cards: [
    {
      title: "A project with a memory",
      html: `<p>A Git <strong>repository</strong> is an ordinary project directory
        with a recorded history. You still edit the same scripts, notes, and
        configuration files with the same tools.</p>
        <p>Git does not save every keystroke. You decide when a useful change is
        ready to become a named point in that history.</p>`,
    },
    {
      title: "Working files and commits",
      html: `<p>The files in front of you are the <strong>working copy</strong>.
        They may contain changes that have not been recorded yet.</p>
        <p>A <strong>commit</strong> records a selected set of changes with a short
        message explaining why they belong together. It is a checkpoint, not a
        second copy of the whole project that you manage by hand.</p>`,
    },
    {
      title: "Sharing the record",
      html: `<p>A repository can also live on a shared Git service. You
        <code>clone</code> it to get your first local copy and use
        <code>pull</code> to bring down newer shared commits.</p>
        <p>This topic starts by reading the record before asking you to add to
        it.</p>`,
    },
  ],

  footnote: `Reading this introduction opens the first Git challenge.`,
};
