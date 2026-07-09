import { PW } from "./gen-data.js";

const MODES = ["-rw-rw-rw-", "-rw-rw-r--", "-rw-r--r--"];
const SHOWN = ["0666", "0664", "0644"];

export default {
  n: 20,
  title: "The MUNGE key fiasco",
  commands: ["cat", "ls", "chmod", "systemctl", "journalctl", "munge"],
  reading: [
    { label: "Docs: MUNGE authentication", url: "#/docs/munge" },
    { label: "Docs: systemd triage", url: "#/docs/systemd" },
  ],
  variants: PW[20].map((pass, i) => ({ pass, mode: MODES[i % 3], shown: SHOWN[i % 3] })),
  build(v) {
    const failedStatus = {
      out: `× munge.service - MUNGE authentication service\n     Loaded: loaded (/usr/lib/systemd/system/munge.service; enabled)\n     Active: failed (Result: exit-code) since Wed 2026-07-08 08:01:22 SAST\n    Process: 2101 ExecStart=/usr/sbin/munged (code=exited, status=1/FAILURE)\n\nJul 08 08:01:22 uwc-hpc munged[2101]: Error: Keyfile is insecure: "/etc/munge/munge.key" should not be readable or writable by others (currently ${v.shown}, expected 0400)\nJul 08 08:01:22 uwc-hpc systemd[1]: munge.service: Failed with result 'exit-code'.`,
      code: 3,
    };
    return {
      goal: `<p>Slurm cannot authenticate between nodes because <strong>MUNGE</strong> is
        down. A teammate followed an upstream tutorial to distribute the munge key and left
        their notes in <code>~/tutorial-notes.txt</code> — those instructions contain
        <em>three separate bugs</em> (they are real bugs from a real tutorial; see the
        errata-flavoured docs). Read the notes and spot them.</p>
        <p>The damage on <em>this</em> node: <code>/etc/munge/munge.key</code> ended up
        with the wrong permissions, and <code>munged</code> refuses to start
        (<code>systemctl status munge</code> tells you exactly why, like in Level 14).
        Fix the key with the permissions munged demands (Level 12 taught you
        <code>chmod</code>; you will need <code>sudo</code> here), then
        <code>sudo systemctl restart munge</code> and check its status — the healthy
        daemon logs the password as its key fingerprint.</p>`,
      fs: {
        "/home/student": {
          "tutorial-notes.txt": { c: [
            "How I copied the munge key (following the tutorial):",
            "",
            "  1. on the head node:   scp /etc/munge/munge.key compute1:/etc/tmp/munge.key",
            "     (tutorial says /etc/tmp but the next step reads /tmp/munge.key ... ??)",
            "  2. then ON COMPUTE1 I ran the scp again, from compute1 to compute1,",
            "     because the tutorial's step 2 is written from the compute node",
            "  3. permissions: head node says chmod 600, compute node says chmod 400.",
            "     I picked 66" + "6 so everyone can read it. problem solved?",
            "",
            "munge still broken. leaving this for the next person. sorry.",
          ].join("\n") },
        },
        "/etc/munge/munge.key": { c: "(binary key material)", binary: true, size: 1024, owner: "root", mode: v.mode },
      },
      canned: {
        "systemctl status munge": failedStatus,
        "systemctl status munged": failedStatus,
        "journalctl -u munge": `Jul 08 08:01:22 uwc-hpc munged[2101]: Error: Keyfile is insecure: "/etc/munge/munge.key" should not be readable or writable by others (currently ${v.shown}, expected 0400)\nJul 08 08:01:22 uwc-hpc systemd[1]: munge.service: Failed with result 'exit-code'.`,
        "munge -n": { out: "", err: "munge: Error: Failed to access \"/run/munge/munge.socket.2\": No such file or directory (is munged running?)", code: 1 },
      },
      hooks: {
        sudo(args, stdin, ctx) {
          const line = args.join(" ");
          if (/^chmod 0?400 \/etc\/munge\/munge\.key$/.test(line)) {
            const key = ctx.vfs.get("/", "/etc/munge/munge.key");
            key.mode = "-r--------";
            ctx.state.keyFixed = true;
            return { out: "", code: 0 };
          }
          if (/^chmod \d+ \/etc\/munge\/munge\.key$/.test(line)) {
            return { out: "", err: "chmod applied - but munged demands exactly 0400 (read-only for owner). Try again.", code: 0 };
          }
          if (line === "systemctl restart munge" || line === "systemctl restart munged") {
            if (!ctx.state.keyFixed) {
              return { out: "", err: "Job for munge.service failed: keyfile still insecure. See 'systemctl status munge'.", code: 1 };
            }
            ctx.state.mungeUp = true;
            return { out: "", code: 0 };
          }
          return { out: "", err: "sudo: only 'sudo chmod ... /etc/munge/munge.key' and 'sudo systemctl restart munge' are permitted here.", code: 1 };
        },
        systemctl(args, stdin, ctx) {
          if (ctx.state.mungeUp && args[0] === "status" && (args[1] === "munge" || args[1] === "munged")) {
            return {
              out: `● munge.service - MUNGE authentication service\n     Loaded: loaded (/usr/lib/systemd/system/munge.service; enabled)\n     Active: active (running) since Wed 2026-07-08 08:14:07 SAST\n   Main PID: 2287 (munged)\n\nJul 08 08:14:07 uwc-hpc munged[2287]: Notice: Running on uwc-hpc\nJul 08 08:14:07 uwc-hpc munged[2287]: Info: key fingerprint: ${v.pass}`,
              code: 0,
            };
          }
          return undefined; // fall through to canned/default
        },
        munge(args, stdin, ctx) {
          if (ctx.state.mungeUp && args[0] === "-n") {
            return { out: "MUNGE:AwQFAAA...(credential)...:", code: 0 };
          }
          return undefined;
        },
        unmunge(args, stdin, ctx) {
          if (ctx.state.mungeUp && stdin.startsWith("MUNGE:")) {
            return { out: `STATUS:          Success (0)\nUID:             student (1000)\nGID:             student (1000)\nLENGTH:          0`, code: 0 };
          }
          return undefined;
        },
      },
    };
  },
};
