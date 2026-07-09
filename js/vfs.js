// Virtual filesystem. A level's fs spec maps absolute paths to nodes:
//   file:  { c: "contents", mode?: "-rw-r--r--", owner?: "root", binary?: true, size?: 1033 }
//   dir:   nested plain object whose keys are child names
// Everything lives in memory and resets when the level reloads.

function isFileSpec(v) {
  return v !== null && typeof v === "object" && typeof v.c === "string";
}

function mkdir() {
  return { type: "dir", children: {} };
}

function mkfile(spec) {
  return {
    type: "file",
    c: spec.c,
    mode: spec.mode || "-rw-r--r--",
    owner: spec.owner || "student",
    binary: !!spec.binary,
    size: spec.size !== undefined ? spec.size : spec.c.length,
    archive: spec.archive || null, // payload extracted by `tar`
  };
}

export function makeVFS(spec) {
  const root = mkdir();

  function ensureDir(path) {
    const parts = path.split("/").filter(Boolean);
    let node = root;
    for (const p of parts) {
      if (!node.children[p]) node.children[p] = mkdir();
      node = node.children[p];
      if (node.type !== "dir") throw new Error(`vfs: ${p} is a file`);
    }
    return node;
  }

  function insert(dirNode, name, value) {
    if (isFileSpec(value)) {
      dirNode.children[name] = mkfile(value);
    } else {
      const d = dirNode.children[name] && dirNode.children[name].type === "dir"
        ? dirNode.children[name] : (dirNode.children[name] = mkdir());
      for (const [k, v] of Object.entries(value)) insert(d, k, v);
    }
  }

  // base layout every level gets
  for (const d of ["/home/student", "/etc", "/tmp", "/usr/bin", "/root"]) ensureDir(d);
  for (const [path, value] of Object.entries(spec || {})) {
    if (isFileSpec(value)) {
      const idx = path.lastIndexOf("/");
      insert(ensureDir(path.slice(0, idx) || "/"), path.slice(idx + 1), value);
    } else {
      const dir = ensureDir(path);
      for (const [k, v] of Object.entries(value)) insert(dir, k, v);
    }
  }

  const vfs = {
    root,

    // Resolve a path string (may be relative to cwd, support ~ . ..) to an
    // array of segments; does not require existence.
    normalize(cwd, path) {
      let p = path;
      if (p === "~" || p.startsWith("~/")) p = "/home/student" + p.slice(1);
      if (!p.startsWith("/")) p = cwd.replace(/\/$/, "") + "/" + p;
      const out = [];
      for (const seg of p.split("/")) {
        if (seg === "" || seg === ".") continue;
        if (seg === "..") out.pop();
        else out.push(seg);
      }
      return out;
    },

    get(cwd, path) {
      let node = root;
      for (const seg of this.normalize(cwd, path)) {
        if (node.type !== "dir" || !(seg in node.children)) return null;
        node = node.children[seg];
      }
      return node;
    },

    pathOf(cwd, path) {
      return "/" + this.normalize(cwd, path).join("/");
    },

    readable(node, ctx) {
      if (ctx && ctx.root) return true;
      if (node.owner === "root" && node.mode && node.mode[7] !== "r") {
        // others-read bit off on a root-owned file
        return false;
      }
      return true;
    },

    // Insert a whole fs spec (files + nested dirs) under an existing directory.
    addTree(cwd, base, spec) {
      const dir = ensureDir("/" + this.normalize(cwd, base).join("/"));
      for (const [k, v] of Object.entries(spec)) insert(dir, k, v);
    },

    write(cwd, path, content, append) {
      const segs = this.normalize(cwd, path);
      if (segs.length === 0) return "cannot write to /";
      const name = segs.pop();
      let dir = root;
      for (const seg of segs) {
        if (dir.type !== "dir" || !(seg in dir.children)) return `no such directory`;
        dir = dir.children[seg];
      }
      if (dir.type !== "dir") return `not a directory`;
      const existing = dir.children[name];
      if (existing && existing.type === "dir") return `is a directory`;
      if (existing && append) existing.c += content;
      else dir.children[name] = mkfile({ c: content });
      return null;
    },
  };
  return vfs;
}
