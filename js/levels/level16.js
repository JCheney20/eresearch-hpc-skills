import { DATA } from "./gen-data.js";

const SERVICE = {
  2049: ["NFS", "nfs-server"], 6817: ["the Slurm controller", "slurmctld"],
  6818: ["the Slurm node daemon", "slurmd"], 9100: ["node-exporter metrics", "node_exporter"],
  51820: ["the WireGuard VPN", "wireguard"], 3000: ["Grafana", "grafana"],
  9090: ["Prometheus", "prometheus"], 20049: ["NFS-over-RDMA", "nfs-rdma"],
  111: ["the RPC portmapper", "rpcbind"], 8889: ["JupyterLab", "jupyter"],
  9093: ["Alertmanager", "alertmanager"], 6819: ["the Slurm database daemon", "slurmdbd"],
};

export default {
  n: 16,
  title: "The firewall says no",
  commands: ["nft", "journalctl", "grep", "cat", "ip"],
  reading: [
    { label: "Docs: nftables firewalls", url: "#/docs/firewall" },
    { label: "nft(8)", url: "https://man7.org/linux/man-pages/man8/nft.8.html" },
  ],
  variants: DATA.ports.map((port, i) => ({ pass: String(port), port, svc: SERVICE[port] })),
  build(v) {
    const ruleset = `table inet filter {
  chain input {
    type filter hook input priority filter; policy drop;
    ct state established,related accept
    ct state invalid drop
    iifname "lo" accept
    ip protocol icmp accept comment "allow ping"
    tcp dport 22 accept comment "ssh from anywhere"
    ip saddr 10.50.100.0/24 accept comment "trust the private cluster network"
    log prefix "refused connection: " counter
  }
  chain forward {
    type filter hook forward priority filter; policy drop;
  }
}`;
    const klog = `Jul 08 07:02:11 uwc-hpc kernel: refused connection: IN=eth1 OUT= SRC=10.100.50.11 DST=10.100.50.10 PROTO=TCP SPT=51742 DPT=${v.port} SYN
Jul 08 07:02:12 uwc-hpc kernel: refused connection: IN=eth1 OUT= SRC=10.100.50.11 DST=10.100.50.10 PROTO=TCP SPT=51742 DPT=${v.port} SYN
Jul 08 07:02:14 uwc-hpc kernel: refused connection: IN=eth1 OUT= SRC=10.100.50.11 DST=10.100.50.10 PROTO=TCP SPT=51742 DPT=${v.port} SYN`;
    return {
      goal: `<p>compute1 (<code>10.100.50.11</code>) cannot reach ${v.svc[0]} on the head
        node, and the head node's <strong>nftables firewall</strong> is the suspect.
        Read the live ruleset with <code>nft list ruleset</code>, top to bottom, the way
        the kernel does: first matching rule wins, and the chain
        <code>policy drop</code> eats whatever nothing accepted.</p>
        <p>There is supposed to be one rule trusting the whole private cluster network —
        but look carefully at its subnet and compare it with where compute1 actually
        lives. (This transposed-octet bug is lifted from a real tutorial; see the
        firewall doc.) The kernel also logs every refused packet: find them with
        <code>journalctl -k | grep refused</code>.</p>
        <p><strong>The password is the destination port number being blocked</strong>
        (digits only).</p>`,
      fs: {
        "/etc/hosts": { c: "127.0.0.1 localhost\n10.100.50.10 headnode uwc-hpc\n10.100.50.11 compute1\n10.100.50.12 compute2\n" },
      },
      canned: {
        "nft list ruleset": ruleset,
        "journalctl -k": klog,
        "journalctl -k | grep refused": klog, // convenience if piping fails them
        "ip a": `1: lo: <LOOPBACK,UP> inet 127.0.0.1/8\n2: eth0: <BROADCAST,UP> inet 154.114.57.20/24 (public)\n3: eth1: <BROADCAST,UP> inet 10.100.50.10/24 (cluster)`,
      },
    };
  },
};
