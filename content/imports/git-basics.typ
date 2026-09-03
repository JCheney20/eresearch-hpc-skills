// Imported from https://github.com/swcarpentry/git-novice/blob/967bc0b38826039f6554845248c8c294ebff1f56/episodes/01-basics.md
// Licensed under CC-BY-4.0; formatting converted on 2026-09-03.

#block[
- Understand the benefits of an automated version control system.
- Understand the basics of how automated version control systems work.

]
#block[
- What is version control and why should I use it?

]
We'll start by exploring how version control can be used to keep track of what one person did and when. Even if you aren't collaborating with other people, automated version control is much better than this situation:

#figure(image("fig/phd101212s.png"),
  caption: [
    "notFinal.doc" by Jorge Cham, #link("https://www.phdcomics.com")
  ]
)

We've all been in this situation before: it seems unnecessary to have multiple nearly-identical versions of the same document. Some word processors let us deal with this a little better, such as Microsoft Word's #link("https://support.office.com/en-us/article/Track-changes-in-Word-197ba630-0f5f-4a8e-9a77-3712475e806a")[Track Changes];, Google Docs' #link("https://support.google.com/docs/answer/190843?hl=en")[version history];, or LibreOffice's #link("https://help.libreoffice.org/Common/Recording_and_Displaying_Changes")[Recording and Displaying Changes];.

Version control systems start with a base version of the document and then record changes you make each step of the way. You can think of it as a recording of your progress: you can rewind to start at the base document and play back each change you made, eventually arriving at your more recent version.

#box(image("fig/play-changes.svg", width: 40.0%))

Once you think of changes as separate from the document itself, you can then think about "playing back" different sets of changes on the base document, ultimately resulting in different versions of that document. For example, two users can make independent sets of changes on the same document.

#box(image("fig/versions.svg", width: 60.0%))

Unless multiple users make changes to the same section of the document - a #link("../learners/reference.md#conflict")[conflict] - you can incorporate two sets of changes into the same base document.

#box(image("fig/merge.svg", width: 60.0%))

A version control system is a tool that keeps track of these changes for us, effectively creating different versions of our files. It allows us to decide which changes will be made to the next version (each record of these changes is called a #link("../learners/reference.md#commit")[commit];), and keeps useful metadata about them, such as who made the change. The complete history of commits for a particular project and their metadata make up a #link("../learners/reference.md#repository")[repository];. Repositories can be kept in sync across different computers, facilitating collaboration among different people.

#block[
== The Long History of Version Control Systems
<the-long-history-of-version-control-systems>
Automated version control systems are nothing new. Tools like #link("https://en.wikipedia.org/wiki/Revision_Control_System")[RCS];, #link("https://en.wikipedia.org/wiki/Concurrent_Versions_System")[CVS];, or #link("https://en.wikipedia.org/wiki/Apache_Subversion")[Subversion] have been around since the early 1980s and are used by many large companies. However, many of these are now considered legacy systems (i.e., outdated) due to various limitations in their capabilities. More modern systems, such as #link("https://en.wikipedia.org/wiki/Git")[Git] and #link("https://en.wikipedia.org/wiki/Mercurial")[Mercurial];, are #emph[distributed];, meaning that they do not need a centralized server to host the repository. These modern systems also include powerful merging tools that make it possible for multiple authors to work on the same files concurrently.

Git was created by Linus Torvalds in 2005 as an alternative to BitKeeper, one of the first distributed version control systems, to track changes in the Linux kernel. Torvalds provided several explanations of the name, of varying degrees of politeness, which are enumerated in the #link("https://github.com/git/git/blob/master/README.md?plain=1#L55")[project's README];, including "Global Information Tracker" for when "you're in a good mood".

For those interested, The Carpentries has a #link("https://swcarpentry.github.io/hg-novice/")[Version Control with Mercurial] lesson (2013-2018), which provides additional context and historical perspective.

]
#block[
== Paper Writing
<paper-writing>
- Imagine you drafted an excellent paragraph for a paper you are writing, but later ruin it. How would you retrieve the #emph[excellent] version of your conclusion? Is it even possible?

- Imagine you have 5 co-authors. How would you manage the changes and comments they make to your paper? If you use LibreOffice Writer or Microsoft Word, what happens if you accept changes made using the `Track Changes` option? Do you have a history of those changes?

#block[
== Solution
<solution>
- Recovering the excellent version is only possible if you created a copy of the old version of the paper. The danger of losing good versions often leads to the problematic workflow illustrated in the PhD Comics cartoon at the top of this page.

- Collaborative writing with traditional word processors is cumbersome. Either every collaborator has to work on a document sequentially (slowing down the process of writing), or you have to send out a version to all collaborators and manually merge their comments into your document. The 'track changes' or 'record changes' option can highlight changes for you and simplifies merging, but as soon as you accept changes you will lose their history. You will then no longer know who suggested that change, why it was suggested, or when it was merged into the rest of the document. Even online word processors like Google Docs or Microsoft Office Online do not fully resolve these problems.

]
]
#block[
- Version control is like an unlimited 'undo'.
- Version control also allows many people to work in parallel.

]
