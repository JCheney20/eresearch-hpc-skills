import { PW } from "./gen-data.js";

const NAMES = ["readme", "README", "welcome.txt", "note", "motd", "message",
  "README.txt", "hello.txt", "start-here", "first-steps", "welcome", "instructions"];

export default {
  n: 0,
  title: "Welcome to uwc-hpc",
  commands: ["ls", "cat", "help"],
  reading: [
    { label: "Cheatsheet: Linux basics", url: "#/cheatsheet" },
    { label: "ls(1) — list directory contents", url: "https://man7.org/linux/man-pages/man1/ls.1.html" },
  ],
  variants: PW[0].map((pass, i) => ({ pass, name: NAMES[i] })),
  build(v) {
    return {
      goal: `<p>Welcome to <strong>UWC_HPC</strong>. You are logged into the head node of a small
        Rocky Linux cluster. The terminal below is real enough to learn in: type commands,
        press Enter, read output.</p>
        <p>The password for <strong>Level 1</strong> is stored in a file called
        <code>${v.name}</code> located in your home directory. List the files around you with
        <code>ls</code>, then print the file with <code>cat ${v.name.includes(" ") ? `"${v.name}"` : v.name}</code>.</p>
        <p>When you have it, paste it into the box under the terminal (or open Level 1 and
        enter it there). Type <code>help</code> at any time to see what this shell can do.</p>`,
      fs: {
        "/home/student": {
          [v.name]: { c: `Welcome to the UWC student cluster.\n\nThe password for Level 1 is: ${v.pass}\n` },
        },
      },
    };
  },
};
