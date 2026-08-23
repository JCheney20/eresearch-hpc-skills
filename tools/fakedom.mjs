// A DOM small enough to fit in one file and real enough to render the track.
//
// Not a browser. Just enough createElement / classList / append / query
// machinery for js/track/ui/* to build every screen start to finish, so
// tools/render-smoke.mjs can assert what came out. Anything a screen only
// *uses* rather than *builds* — layout, painting, focus — is a no-op that
// returns plausible values.

class ClassList {
  constructor(node) { this.node = node; }
  get _list() { return this.node._class.split(/\s+/).filter(Boolean); }
  _set(list) { this.node._class = [...new Set(list)].join(" "); }
  add(...c) { this._set([...this._list, ...c]); }
  remove(...c) { this._set(this._list.filter(x => !c.includes(x))); }
  toggle(c, on) { on === undefined ? (this.contains(c) ? this.remove(c) : this.add(c)) : (on ? this.add(c) : this.remove(c)); }
  contains(c) { return this._list.includes(c); }
  get length() { return this._list.length; }
}

class Text {
  constructor(t) { this.nodeType = 3; this.textContent = String(t); this.childNodes = []; }
}

class El {
  constructor(tag, ns) {
    this.nodeType = 1;
    this.tagName = String(tag).toUpperCase();
    this.namespaceURI = ns || null;
    this.childNodes = [];
    this.parentNode = null;
    this.attrs = Object.create(null);
    this.dataset = {};
    this.style = {};
    this._class = "";
    this._id = "";
    this._listeners = Object.create(null);
    this.hidden = false;
    this.disabled = false;
    this.classList = new ClassList(this);
    if (this.tagName === "INPUT" || this.tagName === "TEXTAREA") this.value = "";
  }

  get className() { return this._class; }
  set className(v) { this._class = String(v || ""); }
  get id() { return this._id; }
  set id(v) { this._id = String(v || ""); if (this._id) REGISTRY.set(this._id, this); }

  setAttribute(n, v) {
    if (n === "id") { this.id = v; return; }
    if (n === "class") { this.className = v; return; }
    this.attrs[n] = String(v);
  }
  getAttribute(n) { return n === "id" ? this._id : n === "class" ? this._class : (this.attrs[n] ?? null); }
  hasAttribute(n) { return this.getAttribute(n) !== null; }
  removeAttribute(n) { delete this.attrs[n]; }

  append(...kids) {
    for (const k of kids) {
      const node = typeof k === "string" ? new Text(k) : k;
      node.parentNode = this;
      this.childNodes.push(node);
    }
  }
  appendChild(k) { this.append(k); return k; }
  replaceChildren(...kids) { this.childNodes = []; this.append(...kids); }
  remove() {
    if (!this.parentNode) return;
    this.parentNode.childNodes = this.parentNode.childNodes.filter(c => c !== this);
    this.parentNode = null;
  }
  get firstChild() { return this.childNodes[0] || null; }
  removeChild(c) { this.childNodes = this.childNodes.filter(x => x !== c); c.parentNode = null; return c; }

  get textContent() {
    return this.childNodes.map(c => c.nodeType === 3 ? c.textContent : c.textContent).join("");
  }
  set textContent(v) { this.childNodes = []; if (v !== "") this.append(new Text(v)); }

  // innerHTML is write-mostly here: the track uses it for small static
  // fragments (an icon, a bold word). We keep the source verbatim so tests
  // can assert on it, and expose its text for textContent.
  get innerHTML() { return this._html !== undefined ? this._html : this.childNodes.map(c => c.nodeType === 3 ? c.textContent : c.innerHTML).join(""); }
  set innerHTML(v) {
    this._html = String(v);
    this.childNodes = [];
    const text = this._html.replace(/<[^>]*>/g, "");
    if (text) this.append(new Text(text));
  }

  addEventListener(type, fn) { (this._listeners[type] ||= []).push(fn); }
  removeEventListener(type, fn) { this._listeners[type] = (this._listeners[type] || []).filter(f => f !== fn); }
  dispatch(type, ev = {}) {
    for (const fn of this._listeners[type] || []) fn.call(this, { type, preventDefault() {}, target: this, ...ev });
  }
  click() { this.dispatch("click"); }
  focus() { DOC.activeElement = this; }
  blur() {}

  getBoundingClientRect() { return { left: 0, top: 0, right: 300, bottom: 120, width: 300, height: 120 }; }

  querySelectorAll(sel) {
    const out = [];
    walk(this, n => { if (matches(n, sel)) out.push(n); });
    return out;
  }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
}

function walk(node, fn) {
  for (const c of node.childNodes) {
    if (c.nodeType !== 1) continue;
    fn(c);
    walk(c, fn);
  }
}

function matches(node, sel) {
  return sel.split(",").map(s => s.trim()).some(one => {
    const m = /^([a-zA-Z]*)((?:[.#][\w-]+)*)$/.exec(one);
    if (!m) return false;
    if (m[1] && node.tagName !== m[1].toUpperCase()) return false;
    for (const part of m[2].match(/[.#][\w-]+/g) || []) {
      if (part[0] === "." && !node.classList.contains(part.slice(1))) return false;
      if (part[0] === "#" && node.id !== part.slice(1)) return false;
    }
    return true;
  });
}

const REGISTRY = new Map();

const DOC = {
  activeElement: null,
  createElement: tag => new El(tag),
  createElementNS: (ns, tag) => new El(tag, ns),
  createTextNode: t => new Text(t),
  getElementById: id => REGISTRY.get(id) || null,
  addEventListener() {},
  removeEventListener() {},
  execCommand() { return true; },
};
DOC.documentElement = new El("html");
DOC.body = new El("body");
DOC.querySelector = sel => DOC.body.querySelector(sel);
DOC.querySelectorAll = sel => DOC.body.querySelectorAll(sel);

function makeStorage() {
  const map = new Map();
  return {
    getItem: k => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: k => map.delete(k),
    clear: () => map.clear(),
  };
}

/* A terminal that records instead of painting, so a smoke test can read what
   the shell actually printed. */
export function recordingTerminal() {
  const out = [];
  return {
    written: out,
    text: () => out.join(""),
    write(s) { out.push(s); },
    onData() {},
    open() {},
    focus() {},
    reset() { out.length = 0; },
    dispose() {},
    loadAddon() {},
  };
}

export function installFakeDom(g) {
  const terminals = [];

  /* Node defines some of these as getter-only on globalThis (navigator is one),
     so assignment has to go through defineProperty rather than `=`. */
  const put = (name, value) =>
    Object.defineProperty(g, name, { value, writable: true, configurable: true });

  put("document", DOC);
  put("navigator", { clipboard: null });
  put("localStorage", makeStorage());
  put("location", { hash: "#/", pathname: "/", search: "" });
  put("history", { replaceState() {} });
  put("requestAnimationFrame", fn => { fn(0); return 1; });
  put("cancelAnimationFrame", () => {});
  put("ResizeObserver", class { observe() {} disconnect() {} });
  put("getComputedStyle", () => ({ getPropertyValue: () => "#0E1430" }));
  put("scrollTo", () => {});
  put("confirm", () => true);
  put("addEventListener", () => {});
  put("removeEventListener", () => {});
  put("Terminal", class {
    constructor() { Object.assign(this, recordingTerminal()); terminals.push(this); }
  });
  put("FitAddon", { FitAddon: class { fit() {} activate() {} dispose() {} } });
  put("__terminals", terminals);

  return { document: DOC, terminals, registry: REGISTRY };
}

export { El, Text };
