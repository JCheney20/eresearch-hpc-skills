// Small DOM helpers and the trainer's three symbols.

export function el(tag, cls, html) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html !== undefined) n.innerHTML = html;
  return n;
}

export function svg(name) {
  return document.createElementNS("http://www.w3.org/2000/svg", name);
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/* Inline SVG rather than emoji or an icon webfont: these sit on the type
   baseline and take the surrounding colour, which emoji cannot do. One set,
   drawn here, so the page never mixes icon libraries. */
export const ICON = {
  copy:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linejoin="round">' +
    '<rect x="5.5" y="5.5" width="8" height="8" rx="1.4"/>' +
    '<path d="M10.5 2.5H3.9A1.4 1.4 0 0 0 2.5 3.9v6.6"/></svg>',
  locked:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3.2" y="7" width="9.6" height="6.6" rx="1.4"/>' +
    '<path d="M5.6 7V5.1a2.4 2.4 0 0 1 4.8 0V7"/></svg>',
  unlocked:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3.2" y="7" width="9.6" height="6.6" rx="1.4"/>' +
    '<path d="M5.6 7V5.1a2.4 2.4 0 0 1 4.6-.7"/></svg>',
  tick:
    '<svg class="icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" ' +
    'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M3 8.4 6.4 12 13 4.6"/></svg>',
};

/* Copy to the clipboard, with a fallback for browsers that will not hand out
   the async API outside a secure context. */
export function copyText(btn, text) {
  const done = () => {
    btn.classList.add("copied");
    setTimeout(() => btn.classList.remove("copied"), 1200);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done, () => fallback(text, done));
  } else {
    fallback(text, done);
  }
}

function fallback(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.append(ta);
  ta.select();
  try { document.execCommand("copy"); done(); } catch { /* nothing else to try */ }
  ta.remove();
}

/* Read a colour token. xterm.js paints into a canvas and needs a literal
   colour, which is why the terminal palette in css/tokens.css is hex. */
export function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
