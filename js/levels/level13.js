import { PW } from "./gen-data.js";

// (missing command, Rocky package that provides it)
const PAIRS = [
  ["mpicc", "openmpi-devel"], ["mpirun", "openmpi"], ["gfortran", "gcc-gfortran"],
  ["cmake", "cmake"], ["lstopo", "hwloc"], ["perf", "perf"],
  ["numactl", "numactl"], ["htop", "htop"], ["tmux", "tmux"],
  ["make", "make"], ["gcc", "gcc"], ["git", "git"],
];

export default {
  n: 13,
  title: "dnf detective",
  commands: ["dnf", "which", "man"],
  reading: [
    { label: "Docs: package managers", url: "#/docs/linux" },
    { label: "dnf(8)", url: "https://man7.org/linux/man-pages/man8/dnf.8.html" },
  ],
  variants: PW[13].map((pass, i) => ({ pass, cmd: PAIRS[i][0], pkg: PAIRS[i][1] })),
  build(v) {
    return {
      goal: `<p>You try to build HPL and immediately hit
        <code>bash: ${v.cmd}: command not found</code>. On Rocky Linux, software comes from
        the <strong>dnf</strong> package manager — but which package contains
        <code>${v.cmd}</code>? The package is not always named after the command (on
        Ubuntu it would be a different name again — a classic tutorial trap).</p>
        <p>Ask dnf: <code>dnf provides ${v.cmd}</code>. Then install the package with
        <code>sudo dnf install &lt;package&gt;</code>. The post-install scriptlet prints
        the password.</p>`,
      fs: {
        "/home/student": {
          "build.log": { c: `make arch=Linux_UWC\nmake[1]: Entering directory 'hpl-2.3'\n/bin/sh: line 1: ${v.cmd}: command not found\nmake[1]: *** [Makefile:112: build] Error 127\n` },
        },
      },
      canned: {
        [`dnf provides ${v.cmd}`]: `Last metadata expiration check: 0:41:12 ago.\n${v.pkg}-9.el9.x86_64 : Provides /usr/bin/${v.cmd}\nRepo        : appstream\nMatched from:\nFilename    : /usr/bin/${v.cmd}`,
        [`dnf provides /usr/bin/${v.cmd}`]: `${v.pkg}-9.el9.x86_64 : Provides /usr/bin/${v.cmd}\nRepo        : appstream`,
        [`dnf search ${v.cmd}`]: `Last metadata expiration check: 0:41:12 ago.\n=== Name Matched: ${v.cmd} ===\n${v.pkg}.x86_64 : ${v.cmd} and related tools`,
        [`dnf install ${v.pkg}`]: { out: "", err: "Error: This command has to be run with superuser privileges (use sudo)", code: 1 },
      },
      hooks: {
        sudo(args, stdin, ctx) {
          const line = args.join(" ");
          if (line === `dnf install ${v.pkg}` || line === `dnf install -y ${v.pkg}`) {
            return {
              out: `Dependencies resolved.\n================================================================\n Package            Arch     Version      Repo        Size\n================================================================\nInstalling:\n ${v.pkg}           x86_64   9.el9        appstream   2.1 M\n\nTransaction Summary: Install 1 Package\n\nInstalled: ${v.pkg}-9.el9.x86_64\n\nRunning scriptlet: ${v.pkg}-9.el9.x86_64\n  [${v.pkg}] configured for UWC cluster. Access token: ${v.pass}\n\nComplete!`,
              code: 0,
            };
          }
          if (line.startsWith("dnf install")) {
            return { out: "", err: `No match for argument: ${args[2] || ""}\nError: Unable to find a match. (Hint: is that the package 'dnf provides' pointed at?)`, code: 1 };
          }
          return { out: "", err: "student may only run 'sudo dnf install <pkg>' on this host.", code: 1 };
        },
      },
    };
  },
};
