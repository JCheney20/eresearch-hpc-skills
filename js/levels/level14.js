import { PW } from "./gen-data.js";

const UNITS = ["chronyd", "munge", "nfs-server", "slurmd", "prometheus", "grafana-server",
  "slurmctld", "node_exporter", "sshd-keygen", "nfs-mountd", "chronyd", "munge"];

const ALL = ["sshd", "chronyd", "munge", "nfs-server", "slurmctld", "slurmd",
  "prometheus", "grafana-server", "node_exporter"];

export default {
  n: 14,
  title: "Is it running?",
  commands: ["systemctl", "journalctl", "grep"],
  reading: [
    { label: "Docs: systemd triage", url: "#/docs/systemd" },
    { label: "systemctl(1)", url: "https://man7.org/linux/man-pages/man1/systemctl.1.html" },
  ],
  variants: PW[14].map((pass, i) => ({ pass, unit: UNITS[i], i })),
  build(v) {
    const canned = {
      "systemctl list-units --failed":
        `  UNIT              LOAD   ACTIVE SUB    DESCRIPTION\n● ${v.unit}.service  loaded failed failed ${v.unit} daemon\n\nLOAD   = Reflects whether the unit definition was properly loaded.\nACTIVE = The high-level unit activation state.\n\n1 loaded units listed.`,
      "systemctl --failed":
        `  UNIT              LOAD   ACTIVE SUB    DESCRIPTION\n● ${v.unit}.service  loaded failed failed ${v.unit} daemon\n\n1 loaded units listed.`,
      [`systemctl status ${v.unit}`]: {
        out: `× ${v.unit}.service - ${v.unit} daemon\n     Loaded: loaded (/usr/lib/systemd/system/${v.unit}.service; enabled)\n     Active: failed (Result: exit-code) since Wed 2026-07-08 06:12:03 SAST\n    Process: 1204 ExecStart=/usr/sbin/${v.unit} (code=exited, status=1/FAILURE)\n\nJul 08 06:12:03 uwc-hpc ${v.unit}[1204]: error: cannot read configuration\nJul 08 06:12:03 uwc-hpc ${v.unit}[1204]: recovery hint written to journal: ${v.pass}\nJul 08 06:12:03 uwc-hpc systemd[1]: ${v.unit}.service: Failed with result 'exit-code'.`,
        code: 3,
      },
      [`journalctl -u ${v.unit}`]:
        `Jul 08 06:12:01 uwc-hpc systemd[1]: Starting ${v.unit} daemon...\nJul 08 06:12:03 uwc-hpc ${v.unit}[1204]: error: cannot read configuration\nJul 08 06:12:03 uwc-hpc ${v.unit}[1204]: recovery hint written to journal: ${v.pass}\nJul 08 06:12:03 uwc-hpc systemd[1]: ${v.unit}.service: Failed with result 'exit-code'.`,
    };
    for (const u of ALL) {
      if (u === v.unit) continue;
      canned[`systemctl status ${u}`] =
        `● ${u}.service - ${u} daemon\n     Loaded: loaded (/usr/lib/systemd/system/${u}.service; enabled)\n     Active: active (running) since Wed 2026-07-08 06:11:48 SAST\n   Main PID: ${900 + ALL.indexOf(u)} (${u})`;
    }
    return {
      goal: `<p>Every service on a modern Linux box — the SSH daemon, the time daemon, the
        scheduler — is managed by <strong>systemd</strong>. When "the cluster is broken",
        step one is always: <em>is the service even running?</em></p>
        <p>One of this node's services has died. Find it with
        <code>systemctl list-units --failed</code>, then inspect it with
        <code>systemctl status &lt;unit&gt;</code>. The status output shows the last few
        journal lines — the password is in there.</p>`,
      fs: {},
      canned,
    };
  },
};
