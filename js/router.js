// Hash router: #/  #/levels  #/level/N  #/cheatsheet  #/docs  #/docs/topic

export function startRouter(routes) {
  function dispatch() {
    const hash = location.hash.replace(/^#/, "") || "/";
    const parts = hash.split("/").filter(Boolean);
    window.scrollTo(0, 0);
    if (parts.length === 0) return routes.home();
    if (parts[0] === "levels") return routes.home();
    if (parts[0] === "level" && /^\d+$/.test(parts[1])) return routes.level(Number(parts[1]));
    if (parts[0] === "cheatsheet") return routes.cheatsheet();
    if (parts[0] === "docs") return routes.docs(parts[1] || null);
    return routes.home();
  }
  window.addEventListener("hashchange", dispatch);
  dispatch();
}
