// Learner-visible content release. Connections are recommendations only: every
// challenge can be opened directly, regardless of completion state.

const UPDATED = "2026-09-03";

function local(number, revision, kind, slug, title, commands, recommendedAfter = [], extra = {}) {
  return {
    number, revision, id: number + revision, kind, slug, title, commands,
    author: "Justin Cheney", updated: UPDATED,
    source: { label: "UWC HPC Skills" },
    recommendedAfter,
    ...extra,
  };
}

function imported(number, revision, slug, title, contentName, recommendedAfter = []) {
  return local(number, revision, "reading", slug, title, [], recommendedAfter, {
    contentUrl: `/content/challenges/${contentName}.json`,
    minimumReadSeconds: 120,
    workInProgress: true,
  });
}

export const CONTENT_RELEASE = {
  releaseId: "open-curriculum-001",
  topics: [
    {
      key: "linux",
      name: "Linux",
      blurb: "Learn what the shell is, move around safely, work with files, and connect to another computer.",
      challenges: [
        imported("000", "002", "what-is-a-terminal", "Introducing the Shell", "shell-introduction"),
        imported("016", "001", "navigating-files", "Navigating Files and Directories", "navigating-files", ["000"]),
        local("001", "001", "interactive", "where-am-i", "Where am I", ["pwd", "ls"], ["016"]),
        local("002", "001", "interactive", "moving-around", "Moving around", ["cd"], ["001"]),
        local("003", "001", "interactive", "same-command-more-questions", "Same command, more questions", ["ls -l", "ll"], ["002"]),
        local("004", "001", "interactive", "ask-the-machine", "Ask the machine", ["man", "tldr"], ["003"]),
        imported("01B", "001", "finding-things", "Finding Things", "finding-things", ["004"]),
        local("006", "001", "interactive", "finding-the-line", "Finding the line", ["grep"], ["01B"]),
        local("007", "001", "interactive", "finding-the-file", "Finding the file", ["grep -r"], ["006"]),
        imported("018", "001", "pipes-and-filters", "Pipes and Filters", "pipes-and-filters", ["007"]),

        imported("017", "001", "working-with-files", "Working With Files and Directories", "working-with-files", ["000"]),
        local("005", "001", "interactive", "reading-files", "Reading files", ["cat", "head", "tail"], ["017"]),
        imported("01A", "001", "shell-scripts", "Shell Scripts", "shell-scripts", ["005"]),
        imported("019", "001", "loops", "Loops", "loops", ["01A"]),

      ],
    },
    {
      key: "git",
      name: "Git",
      blurb: "Keep a history of your work, understand changes, and collaborate without losing earlier versions.",
      challenges: [
        imported("014", "002", "keeping-a-record-introduction", "Automated Version Control", "git-basics", ["017"]),
        imported("01C", "001", "git-setup", "Setting Up Git", "git-setup", ["014"]),
        imported("01D", "001", "git-create", "Creating a Repository", "git-create", ["01C"]),
        imported("01E", "001", "git-changes", "Tracking Changes", "git-changes", ["01D"]),
        local("00B", "001", "interactive", "what-changed", "What changed", ["git status", "git log"], ["01E"], {
          line: "What changed in this project, and when?",
        }),
        local("00C", "001", "interactive", "saving-your-work", "Saving your work", ["git add", "git commit"], ["01E"], {
          line: "How do you save your work in steps?",
        }),
        imported("01F", "001", "git-history", "Exploring History", "git-history", ["01E"]),
        imported("020", "001", "git-ignore", "Ignoring Things", "git-ignore", ["01E"]),
        imported("021", "001", "git-remotes", "Remotes in GitHub", "git-remotes", ["01F", "020"]),
        local("00D", "001", "interactive", "getting-the-latest", "Getting the latest", ["git clone", "git pull"], ["021"], {
          line: "How does someone else's work get onto your machine?",
        }),
        imported("022", "001", "git-collaboration", "Collaborating", "git-collaboration", ["021"]),
        imported("023", "001", "git-conflicts", "Conflicts", "git-conflicts", ["022"]),
      ],
    },
    {
      key: "hpc",
      name: "HPC",
      blurb: "Understand shared computing, move data, request resources, and follow work through a scheduler.",
      challenges: [
        local("008", "001", "interactive", "getting-on-the-cluster", "Getting on the cluster", ["ssh"], ["018", "019"]),
        local("013", "001", "reading", "moving-files-introduction", "How files move between computers", [], ["008"], {
          line: "Local files, remote files, and why the direction matters.",
        }),
        local("009", "001", "interactive", "bringing-files-back", "Bringing files back", ["scp"], ["013"], {
          line: "Which direction does a copy go, and what does a remote path look like?",
        }),
        local("00A", "001", "interactive", "when-the-link-drops", "When the link drops", ["rsync"], ["009"], {
          line: "How do you finish a copy over a link that keeps dropping?",
        }),
        local("015", "001", "reading", "running-work-introduction", "What an HPC cluster is", [], ["018", "019"], {
          line: "Why shared computing separates login, scheduling, and running work.",
        }),
        local("00E", "001", "interactive", "is-there-room", "Is there room", ["df -h", "free -h"], ["015"], {
          line: "Is there disk space, and is there memory?",
        }),
        local("00F", "001", "interactive", "whats-running", "What is running", ["sinfo", "squeue"], ["00E"], {
          line: "What is running on the cluster, and what is waiting?",
        }),
        local("010", "001", "interactive", "submitting-a-job", "Submitting a job", ["sbatch"], ["00F"], {
          line: "How do you send a job to the queue, and where does its output go?",
        }),
        local("011", "001", "interactive", "watching-it-change", "Watching it change", ["watch"], ["010"], {
          line: "How do you watch something change without retyping the command?",
        }),
        imported("024", "001", "chpc-scc-tutorial-1", "CHPC SCC Tutorial 1", "chpc-scc-tutorial-1", ["015"]),
        imported("025", "001", "chpc-scc-tutorial-2", "CHPC SCC Tutorial 2", "chpc-scc-tutorial-2", ["024"]),
        imported("026", "001", "chpc-scc-tutorial-3", "CHPC SCC Tutorial 3", "chpc-scc-tutorial-3", ["025"]),
        imported("027", "001", "chpc-scc-tutorial-4", "CHPC SCC Tutorial 4", "chpc-scc-tutorial-4", ["026"]),
        local("012", "001", "interactive", "putting-it-together", "Putting it together", [], ["00A", "023", "011"], {
          line: "Find something in an output file, check the queue, and bring a result back.",
          note: "This is also where the trainer points you at signing up for a real cluster account.",
        }),
      ],
    },
  ],
};
