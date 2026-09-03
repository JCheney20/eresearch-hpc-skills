// Imported from https://github.com/swcarpentry/git-novice/blob/967bc0b38826039f6554845248c8c294ebff1f56/episodes/06-ignore.md
// Licensed under CC-BY-4.0; formatting converted on 2026-09-03.

#block[
- Configure Git to ignore specific files.
- Explain why ignoring files can be useful.

]
#block[
- How can I tell Git to ignore files I don't want to track?

]
What if we have files that we do not want Git to track for us, like backup files created by our editor or intermediate files created during data analysis? Let's create a few dummy files:

```bash
$ mkdir pictures
$ touch a.png b.png c.png pictures/cake1.jpg pictures/cake2.jpg
```

and see what Git says:

```bash
$ git status
```

```output
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)

    a.png
    b.png
    c.png
    pictures/

nothing added to commit but untracked files present (use "git add" to track)
```

Putting these files under version control would be a waste of disk space. What's worse, having them all listed could distract us from changes that actually matter, so let's tell Git to ignore them.

We do this by creating a file in the root directory of our project called `.gitignore`:

```bash
$ nano .gitignore
```

Type the text below into the `.gitignore` file:

```
*.png
pictures/
```

Save the file and exit your editor.

Verify that the file contains the files to ignore.

```bash
$ cat .gitignore
```

```output
*.png
pictures/
```

These patterns tell Git to ignore any file whose name ends in `.png` and everything in the `pictures` directory. (If any of these files were already being tracked, Git would continue to track them.)

Once we have created this file, the output of `git status` is much cleaner:

```bash
$ git status
```

```output
On branch main
Untracked files:
  (use "git add <file>..." to include in what will be committed)

    .gitignore

nothing added to commit but untracked files present (use "git add" to track)
```

The only thing Git notices now is the newly-created `.gitignore` file. You might think we wouldn't want to track it, but everyone we're sharing our repository with will probably want to ignore the same things that we're ignoring. Let's add and commit `.gitignore`:

```bash
$ git add .gitignore
$ git commit -m "Ignore png files and the pictures folder."
$ git status
```

```output
On branch main
nothing to commit, working tree clean
```

As a bonus, using `.gitignore` helps us avoid accidentally adding files to the repository that we don't want to track:

```bash
$ git add a.png
```

```output
The following paths are ignored by one of your .gitignore files:
a.png
Use -f if you really want to add them.
```

If we really want to override our ignore settings, we can use `git add -f` to force Git to add something. For example, `git add -f a.png`. We can also always see the status of ignored files if we want:

```bash
$ git status --ignored
```

```output
On branch main
Ignored files:
 (use "git add -f <file>..." to include in what will be committed)

        a.png
        b.png
        c.png
        pictures/

nothing to commit, working tree clean
```

#block[
== Ignoring Nested Files
<ignoring-nested-files>
Given a directory structure that looks like:

```bash
pictures/cake
pictures/pizza
```

How would you ignore only `pictures/cake` and not `pictures/pizza`?

#block[
== Solution
<solution>
If you only want to ignore the contents of `pictures/cake`, you can change your `.gitignore` to ignore only the `/cake/` subfolder by adding the following line to your .gitignore:

```output
pictures/cake/
```

This line will ensure only the contents of `pictures/cake` is ignored, and not the contents of `pictures/pizza`.

As with most programming issues, there are a few alternative ways that one may ensure this ignore rule is followed. The "Ignoring Nested Files: Variation" exercise has a slightly different directory structure that presents an alternative solution. Further, the discussion page has more detail on ignore rules.

]
]
#block[
== Including Specific Files
<including-specific-files>
How would you ignore all `.png` files in your root directory except for `final.png`? Hint: Find out what `!` (the exclamation point operator) does

#block[
== Solution
<solution-1>
You would add the following two lines to your .gitignore:

```output
*.png           # ignore all png files
!final.png      # except final.png
```

The exclamation point operator will include a previously excluded entry.

Note also that, if you've previously committed `.png` files in this lesson, they will not be ignored with this new rule. Only future additions of `.png` files to the root directory will be ignored.

]
]
#block[
== Ignoring Nested Files: Variation
<ignoring-nested-files-variation>
Given a directory structure that looks similar to the earlier Nested Files exercise, but with a slightly different directory structure:

```bash
pictures/cake
pictures/pizza
pictures/pie
pictures/brownie
```

How would you ignore all of the contents in the pictures folder, but not `pictures/pie`?

Hint: think a bit about how you created an exception with the `!` operator before.

#block[
== Solution
<solution-2>
If you want to ignore the contents of `pictures/` but not those of `pictures/pie/`, you can change your `.gitignore` to ignore the contents of pictures folder, but create an exception for the contents of the `pictures/pie` subfolder. Your .gitignore would look like this:

```output
pictures/*              # ignore everything in pictures folder
!pictures/pie/          # do not ignore pictures/pie/ contents
```

]
]
#block[
== Ignoring all data Files in a Directory
<ignoring-all-data-files-in-a-directory>
Assuming you have an empty .gitignore file, and given a directory structure that looks like:

```bash
pictures/data/location/gps/a.dat
pictures/data/location/gps/b.dat
pictures/data/location/gps/c.dat
pictures/data/location/gps/info.txt
pictures/plots
```

What's the shortest `.gitignore` rule you could write to ignore all `.dat` files in `pictures/data/location/gps`? Do not ignore the `info.txt`.

#block[
== Solution
<solution-3>
Appending `pictures/data/location/gps/*.dat` will match every file in `pictures/data/location/gps` that ends with `.dat`. The file `pictures/data/location/gps/info.txt` will not be ignored.

]
]
#block[
== Ignoring all data Files in the repository
<ignoring-all-data-files-in-the-repository>
Let us assume you have many `.csv` files in different subdirectories of your repository. For example, you might have:

```bash
results/a.csv
data/experiment_1/b.csv
data/experiment_2/c.csv
data/experiment_2/variation_1/d.csv
```

How do you ignore all the `.csv` files, without explicitly listing the names of the corresponding folders?

#block[
== Solution
<solution-4>
In the `.gitignore` file, write:

```output
**/*.csv
```

This will ignore all the `.csv` files, regardless of their position in the directory tree. You can still include some specific exception with the exclamation point operator.

]
]
#block[
== The Order of Rules
<the-order-of-rules>
Given a `.gitignore` file with the following contents:

```bash
*.csv
!*.csv
```

What will be the result?

#block[
== Solution
<solution-5>
The `!` modifier will negate an entry from a previously defined ignore pattern. Because the `!*.csv` entry negates all of the previous `.csv` files in the `.gitignore`, none of them will be ignored, and all `.csv` files will be tracked.

]
]
#block[
== Log Files
<log-files>
You wrote a script that creates many intermediate log-files of the form `log_01`, `log_02`, `log_03`, etc. You want to keep them but you do not want to track them through `git`.

+ Write #strong[one] `.gitignore` entry that excludes files of the form `log_01`, `log_02`, etc.

+ Test your "ignore pattern" by creating some dummy files of the form `log_01`, etc.

+ You find that the file `log_01` is very important after all, add it to the tracked files without changing the `.gitignore` again.

+ Discuss with your neighbor what other types of files could reside in your directory that you do not want to track and thus would exclude via `.gitignore`.

#block[
== Solution
<solution-6>
+ append either `log_*` or `log*` as a new entry in your .gitignore
+ track `log_01` using `git add -f log_01`

]
]
#block[
- The .gitignore file is a text file that tells Git which files to track and which to ignore in the repository.
- You can list specific files or folders to be ignored by Git, or you can include files that would normally be ignored.

]
