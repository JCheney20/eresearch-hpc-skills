// Reading introduction for the Moving files topic.

export default {
  num: 19,
  slug: "moving-files-introduction",
  title: "How files move between computers",
  kind: "reading",
  commands: [],
  teaches: ["local computer", "remote computer", "source", "destination"],
  variants: [{ i: 0 }],

  lede: `A file can be on your laptop, on the cluster, or in both places. Before
    choosing a command, you need to know which copy you have and where it must go.`,

  cards: [
    {
      title: "Two computers, two filesystems",
      html: `<p>Your laptop and the cluster do not share one desktop or one home
        directory. A file saved on one does not appear on the other by itself.</p>
        <p>The computer where you type the transfer command is the
        <strong>local</strong> computer. The other one is <strong>remote</strong>.
        Local and remote describe your point of view, not a permanent property
        of either machine.</p>`,
    },
    {
      title: "Every copy has a direction",
      html: `<p>A transfer has a <strong>source</strong>, where the file is now, and
        a <strong>destination</strong>, where the new copy should be placed.</p>
        <p>Writing those two places in the wrong order sends the file the wrong
        way. The next challenge makes that direction visible before asking you
        to remember any command syntax.</p>`,
    },
    {
      title: "The tools in this topic",
      html: `<p><code>scp</code> makes a straightforward copy over SSH.
        <code>rsync</code> compares source and destination, then transfers what is
        missing. That makes it useful when a large copy is interrupted.</p>
        <p>Neither command moves the original. A successful transfer leaves a
        copy at the destination.</p>`,
    },
  ],

  footnote: `Reading this introduction opens the first file-transfer challenge.`,
};
