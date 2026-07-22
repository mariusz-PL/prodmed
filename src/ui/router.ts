/** Hash-router: "#/sciezka/:param" → handler(params). */

export type RouteHandler = (params: Record<string, string>) => void;

interface Route {
  parts: string[];
  handler: RouteHandler;
}

const routes: Route[] = [];
let fallback: RouteHandler = () => {};

export function route(pattern: string, handler: RouteHandler): void {
  routes.push({ parts: pattern.replace(/^#?\//, "").split("/"), handler });
}

export function setFallback(handler: RouteHandler): void {
  fallback = handler;
}

export function navigate(hash: string): void {
  if (location.hash === hash) dispatch();
  else location.hash = hash;
}

function dispatch(): void {
  const raw = location.hash.replace(/^#?\//, "");
  const [path, query = ""] = raw.split("?");
  const segs = (path ?? "").split("/").filter((s) => s.length > 0);
  const queryParams: Record<string, string> = {};
  for (const pair of query.split("&")) {
    const [k, v] = pair.split("=");
    if (k) queryParams[k] = decodeURIComponent(v ?? "");
  }

  for (const r of routes) {
    const rp = r.parts.filter((s) => s.length > 0);
    if (rp.length !== segs.length) continue;
    const params: Record<string, string> = { ...queryParams };
    let ok = true;
    for (let i = 0; i < rp.length; i++) {
      const p = rp[i]!;
      const s = segs[i]!;
      if (p.startsWith(":")) params[p.slice(1)] = decodeURIComponent(s);
      else if (p !== s) {
        ok = false;
        break;
      }
    }
    if (ok) {
      window.scrollTo(0, 0);
      r.handler(params);
      return;
    }
  }
  fallback(queryParams);
}

export function startRouter(): void {
  window.addEventListener("hashchange", dispatch);
  dispatch();
}
