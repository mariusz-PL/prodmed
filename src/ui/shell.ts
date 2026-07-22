import { t } from "../i18n";
import { h } from "./dom";

/** Wspólna rama ekranów treściowych (sesja renderuje się bez ramy, pełnoekranowo). */
export function shell(content: HTMLElement, opts: { nav?: boolean; back?: string } = {}): HTMLElement {
  const { nav = true, back } = opts;
  return h(
    "div",
    { class: "app-frame" },
    h(
      "header",
      { class: "topbar" },
      back
        ? h("a", { class: "back-link", href: back }, `← ${t("common.back")}`)
        : h("span", {}),
      h("a", { class: "wordmark", href: "#/" }, "ProdMed"),
    ),
    h("main", { class: "screen" }, content),
    nav
      ? h(
          "nav",
          { class: "footer-nav" },
          h("a", { href: "#/method" }, t("nav.method")),
          h("a", { href: "#/lessons" }, t("nav.lessons")),
          h("a", { href: "#/problems" }, t("nav.problems")),
          h("a", { href: "#/settings" }, t("nav.settings")),
        )
      : h("span", {}),
  );
}
