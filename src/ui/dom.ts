/** Mikropomocnik DOM — funkcyjny render bez frameworka. */

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | boolean | ((ev: Event) => void)> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === undefined) continue;
    if (typeof v === "function") {
      el.addEventListener(k.replace(/^on/, "").toLowerCase(), v);
    } else if (v === true) {
      el.setAttribute(k, "");
    } else {
      el.setAttribute(k, v);
    }
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return el;
}

export function mount(root: HTMLElement, ...children: Child[]): void {
  root.replaceChildren();
  for (const c of children) if (c) root.append(typeof c === "string" ? document.createTextNode(c) : c);
}

export function fmtClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function fmtDate(ms: number, lang: string): string {
  const d = new Date(ms);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return lang === "pl" ? `${dd}.${mm}.${d.getFullYear()}` : `${d.getFullYear()}-${mm}-${dd}`;
}
