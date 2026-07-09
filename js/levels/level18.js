import { DATA } from "./gen-data.js";

const EXPLAIN = {
  "no_root_squash": "lets a root user on ANY client act as root on the server's files",
  "insecure": "accepts requests from unprivileged ports, so any user process can speak NFS",
  "anonuid=0": "maps anonymous/squashed users to UID 0 - i.e. everyone becomes root",
};

export default {
  n: 18,
  title: "Who exported /home?",
  commands: ["exportfs", "showmount", "cat", "mount"],
  reading: [
    { label: "Docs: NFS shared /home", url: "#/docs/nfs" },
    { label: "exports(5)", url: "https://man7.org/linux/man-pages/man5/exports.5.html" },
  ],
  variants: DATA.nfsOpts.map((opt, i) => ({ pass: opt, opt, i })),
  build(v) {
    const line = `/home 10.100.50.0/24(rw,sync,no_subtree_check,${v.opt})`;
    return {
      goal: `<p>The cluster shares <code>/home</code> from the head node over
        <strong>NFS</strong>, so every node sees the same files — that is how your SSH
        keys and job scripts follow you between nodes.</p>
        <p>Inspect this server's exports with <code>exportfs -v</code> or
        <code>cat /etc/exports</code>, and check what clients see with
        <code>showmount -e headnode</code>. The export works, but it carries
        <strong>one dangerous option</strong> copied straight from an old tutorial —
        an option that quietly hands out far more privilege than a shared home directory
        needs. The docs page on NFS explains what each option does.</p>
        <p><strong>The password is the dangerous option, exactly as written in the
        export</strong> (e.g. <code>some_option</code>).</p>`,
      fs: {
        "/etc/exports": { c: `# UWC cluster: shared home for all nodes\n${line}\n` },
        "/etc/fstab": { c: "# (this is the SERVER - clients mount headnode:/home)\n/dev/vda1 / xfs defaults 0 0\n" },
      },
      canned: {
        "exportfs -v": `/home         10.100.50.0/24(sync,wdelay,hide,no_subtree_check,${v.opt},rw,secure_locks,acl)`,
        "exportfs": `/home         10.100.50.0/24`,
        "showmount -e headnode": `Export list for headnode:\n/home 10.100.50.0/24`,
        "showmount -e localhost": `Export list for localhost:\n/home 10.100.50.0/24`,
        "mount": `proc on /proc type proc (rw,nosuid,nodev,noexec)\n/dev/vda1 on / type xfs (rw,relatime)\nnfsd on /proc/fs/nfsd type nfsd (rw,relatime)`,
      },
    };
  },
};
