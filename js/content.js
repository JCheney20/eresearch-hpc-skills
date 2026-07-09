// Static content: the Linux basics cheatsheet and the condensed docs.
// Every command gets one line of "what it does" plus one usable example.

export const CHEATSHEET_HTML = `
<p>One line per command, one example each. This is the whole toolbox for
levels 0–12 and most of what you will type on a real cluster.</p>

<h2>Moving around</h2>
<table>
<tr><th>Command</th><th>What it does</th><th>Example</th></tr>
<tr><td><code>pwd</code></td><td>print where you are</td><td><code>pwd</code></td></tr>
<tr><td><code>ls</code></td><td>list files; <code>-a</code> shows hidden, <code>-l</code> long form, <code>-n</code> numeric owners</td><td><code>ls -la ~/inhere</code></td></tr>
<tr><td><code>cd</code></td><td>change directory; <code>cd ..</code> up, <code>cd</code> alone goes home</td><td><code>cd inhere</code></td></tr>
</table>

<h2>Reading files</h2>
<table>
<tr><th>Command</th><th>What it does</th><th>Example</th></tr>
<tr><td><code>cat</code></td><td>print a whole file</td><td><code>cat readme</code></td></tr>
<tr><td><code>head</code> / <code>tail</code></td><td>first / last lines (<code>-n N</code> to choose how many)</td><td><code>tail -n 5 log.txt</code></td></tr>
<tr><td><code>file</code></td><td>what a file <em>is</em> (text? data? archive?) before you open it</td><td><code>file inhere/*</code></td></tr>
<tr><td><code>wc</code></td><td>count lines (<code>-l</code>), words, bytes</td><td><code>wc -l data.txt</code></td></tr>
</table>

<h2>Searching — the important one</h2>
<table>
<tr><th>Command</th><th>What it does</th><th>Example</th></tr>
<tr><td><code>grep</code></td><td>print only lines matching a pattern; <code>-i</code> ignore case, <code>-v</code> invert, <code>-n</code> line numbers, <code>-c</code> count</td><td><code>grep -i error build.log</code></td></tr>
<tr><td><code>find</code></td><td>locate files by name/type/size in a directory tree</td><td><code>find . -type f -size 1033c</code></td></tr>
</table>

<h2>Pipes and redirection</h2>
<table>
<tr><th>Syntax</th><th>What it does</th><th>Example</th></tr>
<tr><td><code>a | b</code></td><td>feed a's output into b — chains freely</td><td><code>sort data.txt | uniq -u</code></td></tr>
<tr><td><code>&gt; file</code></td><td>write output to a file (overwrite); <code>&gt;&gt;</code> appends</td><td><code>echo hi &gt; notes.txt</code></td></tr>
<tr><td><code>sort</code></td><td>sort lines (<code>-n</code> numeric, <code>-r</code> reverse)</td><td><code>sort -n sizes.txt</code></td></tr>
<tr><td><code>uniq</code></td><td>collapse <em>adjacent</em> duplicates — sort first! <code>-u</code> only-once lines, <code>-c</code> counts</td><td><code>sort f | uniq -c</code></td></tr>
</table>

<h2>Quoting</h2>
<table>
<tr><th>Problem</th><th>Fix</th><th>Example</th></tr>
<tr><td>filename with spaces</td><td>quote it, escape it, or Tab-complete it</td><td><code>cat "my file"</code> · <code>cat my\\ file</code></td></tr>
<tr><td>filename is <code>-</code></td><td>use a path so it can't look like an option</td><td><code>cat ./-</code></td></tr>
<tr><td>many files at once</td><td><code>*</code> expands to every matching name</td><td><code>file inhere/*</code></td></tr>
</table>

<h2>Permissions</h2>
<table>
<tr><th>Command</th><th>What it does</th><th>Example</th></tr>
<tr><td><code>ls -l</code></td><td>read the mode string: <code>-rw-r--r--</code> = owner rw, group r, others r</td><td><code>ls -l ~/.ssh</code></td></tr>
<tr><td><code>chmod</code></td><td>set permissions in octal: 600 = private file, 400 = read-only-owner, 700 = private dir</td><td><code>chmod 600 ~/.ssh/id_ed25519</code></td></tr>
</table>
<p class="dim">Memorise two: SSH private keys want <code>600</code>; munge keys want <code>400</code>.</p>

<h2>Environment &amp; shell</h2>
<table>
<tr><th>Command</th><th>What it does</th><th>Example</th></tr>
<tr><td><code>echo $VAR</code></td><td>print one variable</td><td><code>echo $PATH</code></td></tr>
<tr><td><code>env</code></td><td>print all variables</td><td><code>env | grep -i slurm</code></td></tr>
<tr><td><code>export</code></td><td>set a variable for child programs</td><td><code>export OMP_NUM_THREADS=4</code></td></tr>
<tr><td><code>which</code></td><td>where PATH found a command (debugs "command not found")</td><td><code>which mpicc</code></td></tr>
<tr><td><code>history</code></td><td>your past commands; <code>!N</code> re-runs number N</td><td><code>history | grep ssh</code></td></tr>
<tr><td><code>man</code></td><td>the manual — always faster than guessing</td><td><code>man grep</code></td></tr>
<tr><td><code>tar</code></td><td>unpack source tarballs</td><td><code>tar -xzf hpl-2.3.tar.gz</code></td></tr>
</table>
`;

const doc = (title, body) => `<div class="doc-card"><h2>${title}</h2>${body}</div>`;

export const DOCS = {
  linux: `<h1>Linux survival</h1>
${doc("Paths", `<p><code>/</code> is the root; <code>~</code> is your home (<code>/home/student</code>);
<code>.</code> is here, <code>..</code> is one up. A <em>relative</em> path starts where you are:
<code>cat ./-</code> means "the file called <code>-</code> in this directory" — which is how you
read files whose names look like options.</p>`)}
${doc("Hidden files", `<p>Names starting with <code>.</code> don't show in plain <code>ls</code> —
config files (<code>.bashrc</code>), SSH keys (<code>.ssh/</code>) and secrets hide this way.
<b>Example:</b> <code>ls -a ~</code></p>`)}
${doc("The package manager (Rocky: dnf)", `<p>Software comes from repositories.
<code>dnf search foo</code> finds packages, <code>dnf provides /usr/bin/foo</code> answers
"which package contains this command", <code>sudo dnf install foo</code> installs. Package
names differ per distro (Ubuntu's OpenMPI dev package is <code>libopenmpi-dev</code>, Rocky's is
<code>openmpi-devel</code>) — a classic tutorial trap.<br><b>Example:</b> <code>dnf provides mpicc</code></p>`)}
${doc("PATH", `<p><code>$PATH</code> is the colon-separated list of directories searched for
commands. Built software in <code>~/opt/.../bin</code> "doesn't exist" until its directory is on
PATH.<br><b>Example:</b> <code>export PATH=$PATH:$HOME/opt/openmpi/bin</code></p>`)}`,

  ssh: `<h1>SSH on a cluster</h1>
${doc("Key pairs", `<p><code>ssh-keygen -t ed25519</code> makes <code>~/.ssh/id_ed25519</code>
(private — never leaves your machine, mode <code>600</code>) and <code>id_ed25519.pub</code>
(public — append it to <code>~/.ssh/authorized_keys</code> on every node you want to enter).
With NFS-shared /home, one authorized_keys works everywhere.<br>
<b>Example:</b> <code>chmod 600 ~/.ssh/id_ed25519</code></p>`)}
${doc("Why SSH refuses your key", `<p>If the private key is readable by anyone else, ssh prints
<code>UNPROTECTED PRIVATE KEY FILE</code> and ignores it. Fix: <code>chmod 600</code>.</p>`)}
${doc("ProxyJump", `<p>Compute nodes sit on a private network behind the head node. Reach them
in one hop: <code>ssh -J student@headnode student@compute1</code>, or in
<code>~/.ssh/config</code>: <code>Host compute* → ProxyJump headnode</code>.</p>`)}`,

  systemd: `<h1>systemd triage</h1>
${doc("The 3-step ritual", `<ol>
<li><code>systemctl list-units --failed</code> — is anything dead?</li>
<li><code>systemctl status &lt;unit&gt;</code> — state, PID, and the last few log lines.</li>
<li><code>journalctl -u &lt;unit&gt;</code> — the full log. Pipe it:
<code>journalctl -u slurmd | grep -iE "error|fatal"</code></li></ol>
<p>States: <code>active (running)</code> good · <code>inactive</code> stopped ·
<code>failed</code> crashed — read the journal.</p>`)}
${doc("Reading a journal", `<p>Ignore <code>debug:</code> noise. Hunt <code>error:</code> and
especially <code>fatal:</code> — a daemon's last message before dying is almost always the true
cause. Later errors are usually <em>consequences</em>: find the <b>first</b> failure in the
timeline.<br><b>Example:</b> <code>journalctl -u munge | grep -i error | head -n 3</code></p>`)}`,

  firewall: `<h1>nftables in five minutes</h1>
${doc("Reading a ruleset", `<p><code>nft list ruleset</code> shows what the kernel enforces.
Rules run top-to-bottom; first match wins; the chain's <code>policy drop</code> rejects
everything nothing accepted. The standard skeleton:</p>
<pre>ct state established,related accept   # replies to outbound traffic
iifname "lo" accept                    # localhost
tcp dport 22 accept                    # ssh
ip saddr 10.100.50.0/24 accept         # trust the private cluster net
policy drop                            # everything else dies</pre>`)}
${doc("One trusted subnet beats port whack-a-mole", `<p>Cluster services (NFS 2049, Slurm
6817/6818, node-exporter 9100, MPI's ephemeral ports…) all flow inside the private network, so
one <code>ip saddr &lt;cluster-net&gt; accept</code> covers them — and exposes nothing publicly.
Get the subnet wrong (say, transposing <code>10.100.50.0</code> into <code>10.50.100.0</code> —
a real tutorial bug) and everything cluster-internal silently dies.</p>`)}
${doc("Seeing the drops", `<p>With logging on, every refused packet hits the journal:
<b>Example:</b> <code>journalctl -k | grep refused</code> — read SRC, DST and DPT to see who
was trying to reach what.</p>`)}
${doc("One stack only", `<p>Never run firewalld and hand-written nftables together (Tutorial 4
quietly tried) — two stacks fight and you debug ghosts. Pick one.</p>`)}`,

  chrony: `<h1>chrony — cluster time</h1>
${doc("Design", `<p>The head node syncs to the internet (or free-runs as
<code>local stratum 10</code>) and serves time to the private net
(<code>allow 10.100.50.0/24</code>). Every compute node has exactly one line:
<code>server &lt;head-ip&gt; iburst</code>. Compute nodes must NOT point at public pools they
can't reach.</p>`)}
${doc("Diagnosis", `<p><b><code>chronyc tracking</code></b> — who am I synced to, at what
stratum? <code>Stratum 0 / Not synchronised</code> = free-running clock, trouble.
<b><code>chronyc sources</code></b> — the servers I'm polling; <code>Reach 0</code> means
unreachable. On the head: <code>chronyc clients</code> shows which nodes are asking.<br>
<b>Example:</b> <code>chronyc tracking</code></p>`)}
${doc("Why HPC cares", `<p>MUNGE credentials embed timestamps: skewed clocks give
<code>Rewound credential</code> / <code>Expired credential</code> errors and Slurm jobs
mysteriously fail. Also: <code>make</code> misbehaves when NFS file times come from the future.</p>`)}`,

  nfs: `<h1>NFS — the shared /home</h1>
${doc("Server side", `<p><code>/etc/exports</code> declares what is shared with whom:</p>
<pre>/home 10.100.50.0/24(rw,sync,no_subtree_check)</pre>
<p><code>exportfs -v</code> shows the live table; <code>exportfs -ra</code> reloads after edits.
<b>Danger options:</b> <code>no_root_squash</code> (remote root = root on your files),
<code>insecure</code> (any user process may speak NFS), <code>anonuid=0</code> (anonymous users
become root). Default <code>root_squash</code> exists for a reason — keep it.</p>`)}
${doc("Client side", `<p><b>Example:</b> <code>mount -t nfs headnode:/home /home</code> — made
permanent in <code>/etc/fstab</code>. <code>showmount -e headnode</code> lists what a server
offers. Check what's mounted: <code>mount | grep nfs</code>.</p>`)}
${doc("UIDs must match", `<p>NFS transmits numeric UIDs, not usernames. If <code>alice</code> is
1001 on the head but 1002 on compute1, she owns the wrong files there. Keep
<code>/etc/passwd</code> user creation order identical on every node (or use central identity).
Diagnose with <code>ls -ln</code> (numeric) vs <code>ls -l</code>.</p>`)}`,

  slurm: `<h1>Slurm — the scheduler</h1>
${doc("Who runs what", `<p><code>slurmctld</code> (head) decides; <code>slurmd</code> (every
compute node) executes; both trust each other via MUNGE. Users never run MPI by hand — they
describe jobs and Slurm places them.</p>`)}
${doc("The user lifecycle", `<pre>sinfo                 # cluster state: idle / alloc / down / drain
sbatch job.batch      # submit -> "Submitted batch job 4242"
squeue                # PD pending, R running
cat slurm-4242.out    # output lands beside your script</pre>
<p><code>scontrol show job 4242</code> for the post-mortem.</p>`)}
${doc("Batch script anatomy", `<pre>#!/usr/bin/env bash
#SBATCH --job-name=hpl
#SBATCH --nodes=2
#SBATCH --ntasks=8            # = P*Q in HPL.dat
#SBATCH --ntasks-per-node=4
#SBATCH --time=02:00:00
srun --mpi=pmix xhpl</pre>
<p><code>#SBATCH</code> lines are directives to the scheduler, not comments.
<code>srun</code> launches the MPI ranks Slurm allocated.</p>`)}
${doc("When nodes go dark", `<p><code>sinfo</code> shows <code>down</code>/<code>drain</code> →
on that node: <code>systemctl status slurmd</code>, then <code>journalctl -u slurmd</code>.
Auth errors there almost always mean MUNGE (key or clock).</p>`)}`,

  munge: `<h1>MUNGE — how nodes trust each other</h1>
${doc("The contract", `<p>One shared secret key, <code>/etc/munge/munge.key</code>,
<b>byte-identical on every node</b>, owned by munge, mode <b>0400</b>. Slurm daemons sign every
message with it. Break any part and you get <code>Invalid credential</code> and dead jobs.</p>`)}
${doc("Testing", `<p><b>Example:</b> <code>munge -n | unmunge</code> (local round-trip) —
<code>munge -n | ssh compute1 unmunge</code> (cross-node: proves same key + same time).</p>`)}
${doc("The classic failures", `<ul>
<li><b>Wrong permissions</b>: munged refuses to start — <code>Keyfile is insecure</code>. Fix:
<code>chmod 400</code>, owner <code>munge:munge</code>.</li>
<li><b>Different keys</b> per node: <code>Invalid credential</code>. Copy ONE key head→computes
(to a path that exists — an upstream tutorial scp'd into nonexistent <code>/etc/tmp/</code>,
then read from <code>/tmp/</code>, then ran the copy from the wrong host, with inconsistent
600-vs-400 modes… three bugs in three lines).</li>
<li><b>Clock skew</b>: <code>Rewound/Expired credential</code> — that's chrony's department.</li>
</ul>`)}`,

  hpl: `<h1>HPL — the benchmark</h1>
${doc("What it is", `<p>High-Performance Linpack solves a dense N×N linear system with MPI +
BLAS; its GFLOP/s score is the classic cluster number (the TOP500 metric). You tune it through
<code>HPL.dat</code>, then submit it with Slurm.</p>`)}
${doc("HPL.dat, the three knobs that matter", `<pre>N   problem size:  N ≈ sqrt(0.8 × total_mem_bytes / 8)
    (fill ~80% of ALL nodes' RAM with 8-byte doubles;
     round DOWN to a multiple of NB)
NB  block size: 128-256, 192 is a good start
P,Q process grid: P×Q = total MPI ranks, near-square, P ≤ Q</pre>
<p><b>Example:</b> 2 nodes × 4 GiB, NB=192:
sqrt(0.8 × 8 × 2<sup>30</sup> / 8) ≈ 29 305 → round down → <b>N = 29 184</b>.</p>`)}
${doc("RPeak — the theoretical ceiling", `<pre>RPeak = cores × GHz × FLOPs-per-cycle</pre>
<p>FLOPs/cycle: 16 with AVX2+FMA, 32 with AVX-512 (check <code>lscpu</code> flags).
A 4-core 2.5 GHz AVX2 node: 4 × 2.5 × 16 = <b>160 GFLOP/s</b>. Your measured RMax over RPeak
is the efficiency — 70–90% is healthy for HPL.</p>`)}
${doc("Building it", `<p>HPL needs a BLAS (OpenBLAS — note the repo moved to
<code>OpenMathLib/OpenBLAS</code>) and MPI (OpenMPI), built with
<code>-O3 -march=native</code>-class flags. The ritual: untar, edit <code>Make.&lt;arch&gt;</code>,
<code>make arch=&lt;arch&gt;</code>, and <code>xhpl</code> appears in <code>bin/</code>.<br>
<b>Example:</b> <code>tar -xzf hpl-2.3.tar.gz</code></p>`)}`,
};

export const DOCS_INDEX_HTML = `
<p>The big cluster tutorials, condensed to what you actually type. Each page is a set of small
cards: what the thing is, the commands that matter, one example each.</p>
<table>
<tr><th>Page</th><th>Covers</th></tr>
<tr><td><a href="#/docs/linux">linux</a></td><td>paths, hidden files, dnf, PATH</td></tr>
<tr><td><a href="#/docs/ssh">ssh</a></td><td>key pairs, the 600 rule, ProxyJump</td></tr>
<tr><td><a href="#/docs/systemd">systemd</a></td><td>systemctl / journalctl triage ritual</td></tr>
<tr><td><a href="#/docs/firewall">firewall</a></td><td>reading nftables, trusted subnets, refused-packet logs</td></tr>
<tr><td><a href="#/docs/chrony">chrony</a></td><td>head-as-clock design, chronyc tracking/sources, why MUNGE cares</td></tr>
<tr><td><a href="#/docs/nfs">nfs</a></td><td>exports, dangerous options, fstab, UID drift</td></tr>
<tr><td><a href="#/docs/slurm">slurm</a></td><td>sinfo → sbatch → squeue → output, batch anatomy</td></tr>
<tr><td><a href="#/docs/munge">munge</a></td><td>the shared key contract and its classic failures</td></tr>
<tr><td><a href="#/docs/hpl">hpl</a></td><td>HPL.dat (N, NB, P×Q), RPeak, building from source</td></tr>
</table>
<p>See also the <a href="#/cheatsheet">Linux basics cheatsheet</a>.</p>
`;
