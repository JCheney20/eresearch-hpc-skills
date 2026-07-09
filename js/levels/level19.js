import { PW } from "./gen-data.js";

const UIDS = [1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010, 1011, 1012];
const USERS = ["jdoe", "asmith", "bpetersen", "nkhumalo", "tvanwyk", "lmokoena",
  "rdaniels", "kabrahams", "sjacobs", "mfebruary", "zndlovu", "cadams"];

export default {
  n: 19,
  title: "UID drift",
  commands: ["ls", "cat", "grep", "id"],
  reading: [
    { label: "Docs: users must match across nodes", url: "#/docs/nfs" },
    { label: "passwd(5)", url: "https://man7.org/linux/man-pages/man5/passwd.5.html" },
  ],
  variants: PW[19].map((pass, i) => ({ pass, uid: UIDS[i], user: USERS[i] })),
  build(v) {
    return {
      goal: `<p>You are on <strong>compute1</strong>, looking at the NFS-shared
        <code>/home/shared</code>. A results file in there belongs to… somebody. NFS does
        not send usernames over the wire — only <strong>numeric UIDs</strong>. If user
        accounts were created in a different order on each node, UID 1001 might be
        <code>alice</code> on the head node and <code>bob</code> here: classic
        <em>UID drift</em>, and the reason cluster user accounts must be kept identical
        everywhere.</p>
        <p>Find the numeric owner of <code>/home/shared/results.dat</code> with
        <code>ls -ln</code> (l = long, n = numeric). Then look in <code>/etc/passwd</code>
        to see who that UID is <em>on this node</em>. The owner left a hidden note in
        <code>/home/shared</code> named <code>.note-&lt;uid&gt;</code> — read it.</p>`,
      fs: {
        "/home/shared": {
          "results.dat": { c: "HPL run 2026-07-07: 412.3 GFLOP/s (2 nodes)\n", owner: String(v.uid) },
          [`.note-${v.uid}`]: { c: `${v.user} here. I keep forgetting my level password, so:\n${v.pass}\nAlso: we REALLY need to sync UIDs between the nodes.\n` },
          ".note-999": { c: "wrong note - nothing here.\n" },
        },
        "/etc/passwd": { c: `root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000::/home/student:/bin/bash\n${v.user}:x:${v.uid}:${v.uid}::/home/${v.user}:/bin/bash\n` },
      },
      env: { HOSTNAME: "compute1" },
    };
  },
};
