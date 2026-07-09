// Headless playthrough: solves every level's intended path through the real
// shell engine for every variant. node tools/smoke.mjs
import { LEVELS } from "../js/levels/index.js";
import { makeVFS } from "../js/vfs.js";
import { Shell } from "../js/shell.js";

const term = { write() {}, onData() {} }; // mock xterm

function mkShell(level, v) {
  const built = level.build(v);
  built.vfs = makeVFS(built.fs);
  return new Shell(term, level, built);
}

let failures = 0;
function check(n, i, desc, out, expect) {
  if (!out.includes(expect)) {
    failures++;
    console.error(`FAIL level ${n} variant ${i}: ${desc}\n  expected to contain: ${expect}\n  got: ${JSON.stringify(out).slice(0, 200)}`);
  }
}

for (const level of LEVELS) {
  for (let i = 0; i < level.variants.length; i++) {
    const v = level.variants[i];
    const sh = mkShell(level, v);
    const run = c => { const r = sh.run(c); return (r.out || "") + (r.err || ""); };
    const n = level.n;

    switch (n) {
      case 0:
        check(n, i, "cat welcome file", run(`cat "${v.name}"`), v.pass); break;
      case 1:
        check(n, i, "cat ./-", run("cat ./-"), v.pass); break;
      case 2:
        check(n, i, "cat quoted spaces", run(`cat "${v.name}"`), v.pass);
        check(n, i, "cat escaped spaces", run(v.name.split(" ").join("\\ ").replace(/^/, "cat ")), v.pass);
        break;
      case 3:
        check(n, i, "ls -a shows hidden", run("ls -a inhere"), v.name);
        check(n, i, "cat hidden", run(`cat inhere/${v.name}`), v.pass);
        break;
      case 4: {
        const fileOut = run("file inhere/*");
        const textFile = fileOut.split("\n").find(l => l.includes("ASCII text"));
        check(n, i, "file finds one text file", fileOut, "ASCII text");
        check(n, i, "cat the text file", run(`cat ${textFile.split(":")[0]}`), v.pass);
        break;
      }
      case 5: {
        const found = run(`find inhere -type f -size ${v.size}c`).trim();
        check(n, i, "find by size", found, ".secret-holder");
        check(n, i, "single result", String(found.split("\n").length), "1");
        check(n, i, "cat found", run(`cat "${found}"`), v.pass);
        break;
      }
      case 6:
        check(n, i, "grep needle", run(`grep ${v.needle} data.txt`), v.pass); break;
      case 7: {
        const out = run("sort data.txt | uniq -u").trim();
        check(n, i, "sort|uniq -u yields one line", out, v.pass);
        check(n, i, "exactly one line", String(out.split("\n").length), "1");
        break;
      }
      case 8:
        check(n, i, "base64 -d", run("base64 -d data.txt"), v.pass); break;
      case 9:
        check(n, i, "echo $VAR", run(`echo $${v.name}`), v.pass);
        check(n, i, "env | grep", run(`env | grep ${v.name}`), v.pass);
        break;
      case 10:
        check(n, i, "history | grep echo", run("history | grep echo"), v.pass); break;
      case 11:
        run(`tar -xzf ${v.name}.tar.gz`);
        check(n, i, "cat extracted README", run(`cat ${v.name}/README`), v.pass);
        break;
      case 12:
        check(n, i, "ssh refused before chmod", run(`ssh ${v.host}`), "UNPROTECTED");
        run("chmod 600 .ssh/id_ed25519");
        check(n, i, "ssh after chmod 600", run(`ssh ${v.host}`), v.pass);
        break;
      case 13:
        check(n, i, "dnf provides", run(`dnf provides ${v.cmd}`), v.pkg);
        check(n, i, "sudo dnf install", run(`sudo dnf install ${v.pkg}`), v.pass);
        break;
      case 14:
        check(n, i, "list failed", run("systemctl list-units --failed"), v.unit);
        check(n, i, "status shows pass", run(`systemctl status ${v.unit}`), v.pass);
        break;
      case 15:
        check(n, i, "journalctl | grep incident", run("journalctl -u slurmd | grep incident"), v.pass);
        check(n, i, "grep fatal finds cause", run("journalctl -u slurmd | grep fatal"), "NodeName");
        break;
      case 16:
        check(n, i, "ruleset has wrong subnet", run("nft list ruleset"), "10.50.100.0/24");
        check(n, i, "kernel log shows DPT", run("journalctl -k"), `DPT=${v.port}`);
        break;
      case 17:
        check(n, i, "tracking unsynced", run("chronyc tracking"), "Not synchronised");
        check(n, i, "hosts names head IP", run("cat /etc/hosts"), `${v.ip} headnode`);
        break;
      case 18:
        check(n, i, "exports show option", run("cat /etc/exports"), v.opt);
        check(n, i, "exportfs -v shows option", run("exportfs -v"), v.opt);
        break;
      case 19:
        check(n, i, "ls -ln shows uid", run("ls -ln /home/shared"), String(v.uid));
        check(n, i, "note has pass", run(`cat /home/shared/.note-${v.uid}`), v.pass);
        break;
      case 20:
        check(n, i, "status explains keyfile", run("systemctl status munge"), "Keyfile is insecure");
        check(n, i, "restart blocked before fix", run("sudo systemctl restart munge"), "failed");
        run("sudo chmod 400 /etc/munge/munge.key");
        check(n, i, "restart works after fix", (sh.run("sudo systemctl restart munge").code === 0) ? "ok" : "bad", "ok");
        check(n, i, "healthy status prints pass", run("systemctl status munge"), v.pass);
        break;
      case 21: {
        check(n, i, "sinfo idle", run("sinfo"), "idle");
        check(n, i, "sbatch submits", run("sbatch hello.batch"), String(v.jobid));
        check(n, i, "output file has pass", run(`cat slurm-${v.jobid}.out`), v.pass);
        break;
      }
      case 22: {
        const expected = Math.floor(Math.sqrt(0.8 * v.nodes * v.mem * 2 ** 30 / 8) / v.nb) * v.nb;
        check(n, i, "formula matches generator", v.pass, String(expected));
        check(n, i, "HPL.dat shows NB", run("cat HPL.dat"), `${v.nb}`);
        check(n, i, "free -g shows mem", run("free -g"), ` ${v.mem} `);
        break;
      }
      case 23: {
        const rpeak = Math.round(v.cores * v.ghz * 16);
        check(n, i, "pass format", v.pass, `${v.p}x${v.q}-${rpeak}`);
        check(n, i, "lscpu shows cores", run("lscpu"), `CPU(s):                  ${v.cores}`);
        check(n, i, "lscpu shows avx2", run("lscpu"), "avx2");
        check(n, i, "batch shows ntasks", run("cat hpl.batch"), `--ntasks=${v.ranks}`);
        break;
      }
      case 24: {
        const cands = run("grep UWC_HPC /var/log/cluster.log");
        check(n, i, "flag among candidates", cands, v.flag);
        check(n, i, "multiple decoys present", String(cands.trim().split("\n").length >= 4), "true");
        check(n, i, "causal munge error present", run("grep -i 'Invalid credential' /var/log/cluster.log"), "compute1");
        check(n, i, "flag sits on auth-failure line", run("grep 'support bundle' /var/log/cluster.log"), v.flag);
        break;
      }
    }
  }
}

if (failures === 0) console.log(`smoke: OK — all ${LEVELS.length} levels x ${LEVELS[0].variants.length} variants solvable via intended path`);
else { console.error(`smoke: ${failures} failure(s)`); process.exit(1); }
