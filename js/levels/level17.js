import { DATA } from "./gen-data.js";

export default {
  n: 17,
  title: "Time is broken",
  commands: ["chronyc", "cat", "journalctl", "grep"],
  reading: [
    { label: "Docs: chrony and cluster time", url: "#/docs/chrony" },
    { label: "Docs: MUNGE (why clocks matter)", url: "#/docs/munge" },
  ],
  variants: DATA.ips.map((ip, i) => ({ pass: ip, ip })),
  build(v) {
    return {
      goal: `<p>You are on <strong>compute1</strong>. Slurm jobs are failing and
        <code>journalctl -u munge</code> is full of <code>Rewound credential</code>
        errors — MUNGE authentication breaks when node clocks disagree, which is why every
        cluster runs a time daemon (<strong>chrony</strong>) with the head node as the
        one true clock.</p>
        <p>Interrogate chrony with <code>chronyc tracking</code> (synchronised? to whom?
        what stratum?) and <code>chronyc sources</code>. Then read
        <code>/etc/chrony.conf</code>: this compute node is still pointing at the public
        Rocky pool servers it can't reach from the private network, instead of at the
        head node.</p>
        <p><strong>The password is the IP address this node <em>should</em> be syncing
        from</strong> — the head node's cluster IP (check <code>/etc/hosts</code>).</p>`,
      fs: {
        "/etc/chrony.conf": { c: "# Rocky default - WRONG for a cluster compute node.\npool 2.rocky.pool.ntp.org iburst\ndriftfile /var/lib/chrony/drift\nmakestep 1.0 3\nrtcsync\n# hint: a compute node should have exactly one 'server <head-ip> iburst' line\n" },
        "/etc/hosts": { c: `127.0.0.1 localhost\n${v.ip} headnode\n10.100.50.11 compute1\n10.100.50.12 compute2\n` },
      },
      env: { HOSTNAME: "compute1" },
      canned: {
        "chronyc tracking": `Reference ID    : 00000000 ()\nStratum         : 0\nRef time (UTC)  : Thu Jan 01 00:00:00 1970\nSystem time     : 0.000000000 seconds\nLeap status     : Not synchronised`,
        "chronyc sources": `MS Name/IP address         Stratum Poll Reach LastRx Last sample\n===============================================================================\n^? 2.rocky.pool.ntp.org          0   6     0     -     +0ns[   +0ns] +/-    0ns`,
        "journalctl -u munge": `Jul 08 07:31:02 compute1 munged[812]: Notice: Running on compute1\nJul 08 07:31:44 compute1 unmunge[1190]: Error: Rewound credential\nJul 08 07:32:10 compute1 unmunge[1211]: Error: Rewound credential\nJul 08 07:33:51 compute1 unmunge[1254]: Error: Rewound credential`,
        "journalctl -u chronyd": `Jul 08 07:30:12 compute1 chronyd[644]: chronyd version 4.5 starting\nJul 08 07:30:20 compute1 chronyd[644]: No suitable source for synchronisation\nJul 08 07:35:20 compute1 chronyd[644]: No suitable source for synchronisation`,
        "systemctl status chronyd": `● chronyd.service - NTP client/server\n     Active: active (running) since Wed 2026-07-08 07:30:12 SAST\n   Main PID: 644 (chronyd)\n\nJul 08 07:30:20 compute1 chronyd[644]: No suitable source for synchronisation`,
      },
    };
  },
};
