import { DATA } from "./gen-data.js";
import { prng, fakePw } from "./util.js";

export default {
  n: 24,
  title: "Needle in the haystack (finale)",
  commands: ["grep", "cat", "wc", "head", "tail", "sort"],
  reading: [
    { label: "Docs: systemd triage", url: "#/docs/systemd" },
    { label: "Docs: MUNGE", url: "#/docs/munge" },
    { label: "Docs: Slurm", url: "#/docs/slurm" },
  ],
  variants: DATA.flags.map((flag, i) => ({ pass: flag, flag, i })),
  build(v) {
    const rng = prng(2400 + v.i);
    const fakeFlag = () => `UWC_HPC{${fakePw(rng, 12)}}`;
    const T = (h, m) => `Jul 08 ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(Math.floor(rng() * 60)).padStart(2, "0")}`;

    const lines = [];
    const push = (host, unit, msg, h, m) => lines.push(`${T(h, m)} ${host} ${unit}: ${msg}`);

    // boot noise
    for (let k = 0; k < 12; k++) {
      push("headnode", "systemd[1]", `Started ${["sshd", "chronyd", "munged", "nfs-server", "slurmctld", "prometheus"][k % 6]}.service.`, 6, k);
      push("compute1", "systemd[1]", `Started ${["sshd", "chronyd", "munged", "slurmd", "node_exporter", "nfs-client.target"][k % 6]}.`, 6, k);
    }
    // chrony decoys (harmless: it recovers) + decoy flag
    push("compute1", "chronyd[644]", "Can't synchronise: no selectable sources", 6, 14);
    push("compute1", "chronyd[644]", `Selected source 10.100.50.10 (audit ref ${fakeFlag()})`, 6, 16);
    push("compute1", "chronyd[644]", "System clock wrong by 0.8231 seconds, adjustment started", 6, 16);
    // nfs retry decoy + decoy flag
    push("compute1", "kernel", "nfs: server headnode not responding, still trying", 6, 20);
    push("compute1", "kernel", `nfs: server headnode OK (retry trace ${fakeFlag()})`, 6, 21);
    // firewall refused decoys (external scanners - not our problem)
    for (let k = 0; k < 6; k++) {
      push("headnode", "kernel", `refused connection: IN=eth0 SRC=203.0.113.${10 + Math.floor(rng() * 200)} DST=154.114.57.20 PROTO=TCP DPT=${[23, 445, 3389, 8080, 443, 25][k]} SYN`, 7, k * 3);
    }
    push("headnode", "kernel", `refused connection: audit marker ${fakeFlag()} (port scan, ignored)`, 7, 19);
    // prometheus / grafana noise
    push("headnode", "prometheus[1402]", "Server is ready to receive web requests.", 6, 18);
    push("headnode", "grafana[1477]", `HTTP Server Listen address=0.0.0.0:3000 (build tag ${fakeFlag()})`, 6, 18);
    // slurm job story - THE CAUSAL CHAIN
    push("headnode", "slurmctld[1533]", "slurmctld version 24.05.2 started on cluster uwc", 6, 19);
    push("headnode", "slurmctld[1533]", "sched: Allocate JobId=4242 NodeList=compute[1-2] #CPUs=8 Partition=batch", 8, 2);
    push("compute2", "slurmd[1874]", "launch task StepId=4242.0 request from UID:1000", 8, 2);
    push("compute1", "munged[812]", 'Error: Keyfile is insecure: "/etc/munge/munge.key" should not be readable or writable by others', 8, 2);
    push("compute1", "slurmd[1873]", "error: Munge decode failed: Invalid credential", 8, 2);
    push("compute1", "slurmd[1873]", `error: slurm_receive_msg: auth failure - support bundle ${v.flag}`, 8, 3);
    push("headnode", "slurmctld[1533]", "error: Nodes compute1 not responding, setting DOWN", 8, 4);
    push("headnode", "slurmctld[1533]", "Killing JobId=4242 on failed node compute1", 8, 4);
    // aftermath noise
    push("compute2", "slurmd[1874]", "done with job 4242", 8, 4);
    push("headnode", "prometheus[1402]", "compactor: compaction completed", 8, 30);
    for (let k = 0; k < 8; k++) {
      push("headnode", "sshd[2001]", `Accepted publickey for student from 10.100.50.${11 + (k % 2)} port ${40000 + Math.floor(rng() * 999)}`, 9, k * 4);
    }

    lines.sort(); // chronological (timestamps sort lexically here)

    return {
      goal: `<p>The final exam. Last night someone submitted the team's HPL benchmark
        (<code>JobId=4242</code>) and it died. The admin dumped the journals of
        <em>all three nodes</em> into one file: <code>/var/log/cluster.log</code> —
        ${lines.length} lines of boot noise, port-scan chatter, NFS hiccups and monitoring
        spam, with exactly <strong>one causal error</strong> in it.</p>
        <p>Beside the causal error sits a support-bundle flag of the form
        <code>UWC_HPC{...}</code>. Beware: <strong>the log contains several decoy
        flags</strong> attached to harmless noise. <code>grep UWC_HPC</code> will give you
        candidates, but only the flag attached to the error that actually killed job 4242
        is accepted.</p>
        <p>Everything you have learned applies: <code>grep -i error</code>,
        <code>grep 4242</code>, follow the timeline, ask <em>which failure explains the
        others</em> (Level 20 is worth remembering). <strong>The password is the flag,
        braces included.</strong></p>`,
      fs: {
        "/var/log": { "cluster.log": { c: lines.join("\n") + "\n" } },
      },
      canned: {
        "sinfo": `PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST\nbatch*       up   infinite      1   down compute1\nbatch*       up   infinite      1   idle compute2`,
        "squeue": `             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)`,
      },
    };
  },
};
