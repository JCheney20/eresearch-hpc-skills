import { PW } from "./gen-data.js";

const HOSTS = ["compute1", "compute2", "cn01", "cn02", "node01", "node02",
  "compute1", "cn03", "node03", "compute2", "cn01", "node01"];

export default {
  n: 12,
  title: "SSH keys and the 600 rule",
  commands: ["ssh", "chmod", "ls", "cat"],
  reading: [
    { label: "Docs: SSH keys on a cluster", url: "#/docs/ssh" },
    { label: "ssh(1)", url: "https://man7.org/linux/man-pages/man1/ssh.1.html" },
  ],
  variants: PW[12].map((pass, i) => ({ pass, host: HOSTS[i] })),
  build(v) {
    const keyPath = "/home/student/.ssh/id_ed25519";
    return {
      goal: `<p>Clusters live and die by <strong>SSH key authentication</strong>: your
        private key (<code>~/.ssh/id_ed25519</code>) stays secret, the public half goes in
        each node's <code>authorized_keys</code>, and you hop between nodes without
        passwords.</p>
        <p>Your key pair already exists, but <code>ssh ${v.host}</code> refuses to use it.
        Look at the key's permissions with <code>ls -l ~/.ssh</code>: SSH refuses any
        private key readable by other users. Fix it (owner read/write only — that's octal
        mode <code>600</code>), then log into <code>${v.host}</code>. The node's login
        banner holds the password.</p>`,
      fs: {
        "/home/student/.ssh": {
          "id_ed25519": { c: "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAA...(private key material)...\n-----END OPENSSH PRIVATE KEY-----\n", mode: "-rw-r--r--" },
          "id_ed25519.pub": { c: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA student@uwc-hpc\n", mode: "-rw-r--r--" },
          "known_hosts": { c: `${v.host} ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA\n` },
        },
      },
      hooks: {
        ssh(args, stdin, ctx) {
          const host = args.find(a => !a.startsWith("-"));
          if (host !== v.host && host !== `student@${v.host}`) {
            return { out: "", err: `ssh: Could not resolve hostname ${host || "?"}: Name or service not known`, code: 255 };
          }
          const key = ctx.vfs.get("/", "/home/student/.ssh/id_ed25519");
          if (key.mode !== "-rw-------") {
            return {
              out: "",
              err: `@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\n@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @\n@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@\nPermissions ${key.mode} for '/home/student/.ssh/id_ed25519' are too open.\nIt is required that your private key files are NOT accessible by others.\nThis private key will be ignored.\nstudent@${v.host}: Permission denied (publickey).`,
              code: 255,
            };
          }
          return {
            out: `Welcome to ${v.host} (Rocky Linux 9.4)\n\n  *** UWC cluster compute node ***\n  Password for the next level: ${v.pass}\n\nConnection to ${v.host} closed.`,
            code: 0,
          };
        },
        "ssh-keygen"() {
          return { out: "/home/student/.ssh/id_ed25519 already exists.\nOverwrite (y/n)? n", code: 0 };
        },
      },
    };
  },
};
