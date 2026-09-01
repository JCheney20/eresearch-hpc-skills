// Challenge 0 — a reading challenge: no world, no terminal, no answer.
// Completed by opening it. It exists because the audience for this track has
// never seen a prompt, and the first thing they meet should not be one.

export default {
  num: 0,
  slug: "what-is-a-terminal",
  title: "What you are looking at",
  kind: "reading",
  commands: [],
  teaches: ["terminal", "prompt", "command"],
  variants: [{ i: 0 }],

  lede: `Every challenge after this one has a terminal in it. This one does not,
    because there is nothing to type yet — there is something to recognise first.`,

  /* No terminal means the page is full width, so it is laid out as cards
     rather than one column. Each card is one idea, in the order they arrive. */
  cards: [
    {
      title: "What a terminal is",
      html: `
        <p>A <strong>terminal</strong> is a place where you tell a computer what to
          do by writing it down rather than clicking it. That is the whole idea. It
          looks unfriendly because it says almost nothing until you ask it
          something.</p>
        <p>You press Enter to run a command. The computer answers on the next line,
          then shows the prompt again. If it has nothing to say, it says nothing and
          shows the prompt — that means it worked.</p>`,
    },
    {
      title: "Reading the line",
      html: `
        <div class="figure">
          <div class="demo">hpc@uwc <span class="anno">~/Core</span> $ <span class="anno">ls</span></div>
          <div class="cap">Two things are on that line. <code>hpc@uwc ~/Core $</code> is the
            <strong>prompt</strong> — the computer saying it is ready, and telling you who you
            are (<code>hpc</code>), which machine you are on (<code>uwc</code>), and where you
            are in it (<code>~/Core</code>). <code>ls</code> is the <strong>command</strong>:
            the part you type.</div>
        </div>`,
    },
    {
      title: "Three things to expect",
      html: `
        <ul>
          <li><strong>Nothing here can break.</strong> The cluster in this trainer is
            simulated — it runs in this browser, it is yours alone, and a wrong command
            costs you nothing but the wrong answer.</li>
          <li><strong>It is not a full Linux.</strong> Enough commands are real to teach
            you the ones you will use. Anything else replies
            <code>command not found</code>, and that is the simulation talking, not you
            making a mistake.</li>
          <li><strong>Typing it out is the point.</strong> Examples can be copied, but
            you paste and press Enter yourself. Pressing Enter is part of what you are
            learning.</li>
        </ul>
        <p>The next challenge asks the two questions everyone asks first: where am I,
          and what is here?</p>`,
    },
  ],

  footnote: `Reading challenges count as done once you have opened them. There are
    two in the whole trainer.`,
};
