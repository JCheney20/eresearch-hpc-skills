// Simulated shell driving an xterm.js terminal against a level's VFS.
// Commands are pure functions (argv, stdin, ctx) -> { out, err, code }.
// Supported syntax: quotes, \-escapes, $VAR, ~, a simple * glob, pipes,
// and > / >> redirection into the home directory. See `help` for limits.

import { COREUTILS, MAN } from "./commands/coreutils.js";
import { SCENARIO } from "./commands/scenario.js";

const HOME = "/home/student";

export function tokenize(line) {
  const toks = [];
  let cur = "", inTok = false, q = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === q) { q = null; }
      else if (ch === "\\" && q === '"' && i + 1 < line.length) { cur += line[++i]; }
      else cur += ch;
      inTok = true;
    } else if (ch === "'" || ch === '"') {
      q = ch; inTok = true;
    } else if (ch === "\\" && i + 1 < line.length) {
      cur += line[++i]; inTok = true;
    } else if (ch === " " || ch === "\t") {
      if (inTok) { toks.push(cur); cur = ""; inTok = false; }
    } else if (ch === "|" || ch === ">") {
      if (inTok) { toks.push(cur); cur = ""; inTok = false; }
      if (ch === ">" && line[i + 1] === ">") { toks.push(">>"); i++; }
      else toks.push(ch);
    } else {
      cur += ch; inTok = true;
    }
  }
  if (inTok) toks.push(cur);
  return toks;
}

function expand(tok, ctx) {
  if (tok === "~") return HOME;
  if (tok.startsWith("~/")) return HOME + tok.slice(1);
  return tok.replace(/\$\{?(\w+)\}?/g, (_, name) => ctx.env[name] ?? "");
}

function glob(tok, ctx) {
  if (!tok.includes("*") || tok.startsWith("-")) return [tok];
  const dirPart = tok.includes("/") ? tok.slice(0, tok.lastIndexOf("/")) : "";
  const pat = tok.slice(tok.lastIndexOf("/") + 1);
  const dirNode = ctx.vfs.get(ctx.cwd, dirPart === "" ? "." : dirPart);
  if (!dirNode || dirNode.type !== "dir") return [tok];
  const re = new RegExp("^" + pat.split("*").map(s => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$");
  const hits = Object.keys(dirNode.children).filter(n => !n.startsWith(".") && re.test(n)).sort();
  if (hits.length === 0) return [tok];
  return hits.map(h => (dirPart ? dirPart + "/" : "") + h);
}

export class Shell {
  constructor(term, level, built, onPassword) {
    this.term = term;
    this.level = level;
    this.onPassword = onPassword;
    this.ctx = {
      vfs: built.vfs,
      cwd: HOME,
      env: Object.assign({ HOME, USER: "student", HOSTNAME: "uwc-hpc", SHELL: "/bin/bash", PATH: "/usr/local/bin:/usr/bin:/bin" }, built.env || {}),
      canned: built.canned || {},
      hooks: built.hooks || {},
      history: [],
      histSeed: built.histSeed || null, // pre-seeded `history` output (level 10)
      state: {},
      term,
      root: false,
      shell: this,
    };
    this.buf = "";
    this.pos = 0;
    this.histIdx = -1;
    this.savedBuf = "";
    term.onData(d => this.onData(d));
  }

  promptStr() {
    let dir = this.ctx.cwd;
    if (dir === HOME) dir = "~";
    else if (dir.startsWith(HOME + "/")) dir = "~" + dir.slice(HOME.length);
    else dir = dir.split("/").pop() || "/";
    return `[student@${this.ctx.env.HOSTNAME} ${dir}]$ `;
  }

  start(banner) {
    if (banner) this.print(banner + "\n");
    this.prompt();
  }

  print(s) {
    this.term.write(s.replace(/\n/g, "\r\n"));
  }

  prompt() {
    this.term.write("\r\n\x1b[1m" + this.promptStr() + "\x1b[0m");
    this.buf = ""; this.pos = 0; this.histIdx = -1;
  }

  redraw() {
    // clear from prompt and rewrite buffer, restoring cursor position
    this.term.write("\r\x1b[K\x1b[1m" + this.promptStr() + "\x1b[0m" + this.buf);
    const back = this.buf.length - this.pos;
    if (back > 0) this.term.write(`\x1b[${back}D`);
  }

  onData(d) {
    for (let i = 0; i < d.length; i++) {
      const ch = d[i];
      if (ch === "\r") { this.term.write("\r\n"); this.exec(this.buf); return; }
      if (ch === "\x7f") { // backspace
        if (this.pos > 0) { this.buf = this.buf.slice(0, this.pos - 1) + this.buf.slice(this.pos); this.pos--; this.redraw(); }
      } else if (ch === "\x03") { // Ctrl-C
        this.term.write("^C"); this.prompt();
      } else if (ch === "\x0c") { // Ctrl-L
        this.term.write("\x1b[2J\x1b[H"); this.redraw();
      } else if (ch === "\t") {
        this.complete();
      } else if (ch === "\x1b") { // escape sequences
        const seq = d.slice(i, i + 3);
        if (seq === "\x1b[A") this.histNav(-1);
        else if (seq === "\x1b[B") this.histNav(1);
        else if (seq === "\x1b[C") { if (this.pos < this.buf.length) { this.pos++; this.term.write("\x1b[C"); } }
        else if (seq === "\x1b[D") { if (this.pos > 0) { this.pos--; this.term.write("\x1b[D"); } }
        i += 2;
      } else if (ch >= " ") {
        this.buf = this.buf.slice(0, this.pos) + ch + this.buf.slice(this.pos);
        this.pos++;
        this.redraw();
      }
    }
  }

  histNav(dir) {
    const h = this.ctx.history;
    if (h.length === 0) return;
    if (this.histIdx === -1) {
      if (dir === 1) return;
      this.savedBuf = this.buf;
      this.histIdx = h.length - 1;
    } else {
      this.histIdx += dir;
    }
    if (this.histIdx >= h.length) { this.histIdx = -1; this.buf = this.savedBuf; }
    else if (this.histIdx < 0) { this.histIdx = 0; }
    if (this.histIdx !== -1) this.buf = h[this.histIdx];
    this.pos = this.buf.length;
    this.redraw();
  }

  complete() {
    const before = this.buf.slice(0, this.pos);
    const m = before.match(/(\S*)$/);
    const partial = m ? m[1] : "";
    const isFirst = before.trimStart() === partial;
    let cands = [];
    if (isFirst) {
      cands = [...Object.keys(COREUTILS), ...Object.keys(SCENARIO)].filter(c => c.startsWith(partial));
    } else {
      const slash = partial.lastIndexOf("/");
      const dirPart = slash >= 0 ? partial.slice(0, slash + 1) : "";
      const frag = partial.slice(slash + 1);
      const dirNode = this.ctx.vfs.get(this.ctx.cwd, dirPart || ".");
      if (dirNode && dirNode.type === "dir") {
        cands = Object.keys(dirNode.children)
          .filter(n => n.startsWith(frag) && (frag.startsWith(".") || !n.startsWith(".")))
          .map(n => dirPart + (n.includes(" ") ? n.replace(/ /g, "\\ ") : n)
            + (dirNode.children[n].type === "dir" ? "/" : ""));
      }
    }
    cands = [...new Set(cands)].sort();
    if (cands.length === 1) {
      const add = cands[0].slice(partial.length) + (cands[0].endsWith("/") || !isFirst ? "" : " ");
      this.buf = before + add + this.buf.slice(this.pos);
      this.pos += add.length;
      this.redraw();
    } else if (cands.length > 1) {
      // common prefix, else list
      let cp = cands[0];
      for (const c of cands) { while (!c.startsWith(cp)) cp = cp.slice(0, -1); }
      if (cp.length > partial.length) {
        const add = cp.slice(partial.length);
        this.buf = before + add + this.buf.slice(this.pos);
        this.pos += add.length;
        this.redraw();
      } else {
        this.print("\n" + cands.map(c => c.replace(/\/$/, "")).join("  ") + "\n");
        this.redraw();
      }
    }
  }

  exec(line) {
    const trimmed = line.trim();
    if (trimmed === "") { this.prompt(); return; }

    // bash-style !N re-runs command N from the seeded history (level 10)
    if (/^!\d+$/.test(trimmed) && this.ctx.histSeed) {
      const n = Number(trimmed.slice(1));
      const entry = this.ctx.histSeed.find(([num]) => num === n);
      if (entry) { this.print(entry[1] + "\n"); this.exec(entry[1]); return; }
      this.print(`bash: !${n}: event not found\n`);
      this.prompt(); return;
    }

    this.ctx.history.push(trimmed);
    const result = this.run(trimmed);
    if (result.out) this.print(result.out.endsWith("\n") ? result.out : result.out + "\n");
    if (result.err) this.print(result.err.endsWith("\n") ? result.err : result.err + "\n");
    if (this.onPassword && result.out) this.onPassword(result.out);
    this.prompt();
  }

  // Run a full command line (pipes + redirection); returns {out, err, code}.
  run(line) {
    const toks = tokenize(line);
    if (toks.length === 0) return { out: "", err: "", code: 0 };

    // split into pipeline stages and trailing redirection
    const stages = [[]];
    let redir = null, redirAppend = false;
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (t === "|") stages.push([]);
      else if (t === ">" || t === ">>") {
        redirAppend = t === ">>";
        redir = toks[i + 1];
        i++;
      } else stages[stages.length - 1].push(t);
    }

    let stdin = "";
    let out = "", err = "", code = 0;
    for (const stage of stages) {
      if (stage.length === 0) return { out: "", err: "bash: syntax error near unexpected token `|'", code: 2 };
      const argv = stage.flatMap(t => glob(expand(t, this.ctx), this.ctx));
      const r = this.dispatch(argv, stdin);
      out = r.out || ""; err = (err ? err + "\n" : "") + (r.err || ""); code = r.code || 0;
      stdin = out;
    }

    if (redir) {
      const e = this.ctx.vfs.write(this.ctx.cwd, expand(redir, this.ctx), out.endsWith("\n") || out === "" ? out : out + "\n", redirAppend);
      if (e) return { out: "", err: `bash: ${redir}: ${e}`, code: 1 };
      return { out: "", err, code };
    }
    return { out, err: err.replace(/^\n+/, ""), code };
  }

  dispatch(argv, stdin) {
    let [cmd, ...args] = argv;

    if (cmd === "sudo") {
      if (this.ctx.hooks.sudo) return this.ctx.hooks.sudo(args, stdin, this.ctx);
      return { out: "", err: "student is not in the sudoers file. This incident will be reported.", code: 1 };
    }

    // per-level hook overrides come first
    if (this.ctx.hooks[cmd]) {
      const r = this.ctx.hooks[cmd](args, stdin, this.ctx);
      if (r !== undefined) return r;
    }
    if (COREUTILS[cmd]) return COREUTILS[cmd](args, stdin, this.ctx);
    if (SCENARIO[cmd]) return SCENARIO[cmd](args, stdin, this.ctx);
    return { out: "", err: `bash: ${cmd}: command not found`, code: 127 };
  }
}

export { MAN };
