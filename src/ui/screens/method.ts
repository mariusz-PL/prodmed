import { getLang, t } from "../../i18n";
import { METHOD } from "../../lessons/content";
import { h, mount } from "../dom";
import { shell } from "../shell";

export function methodScreen(root: HTMLElement): void {
  const m = METHOD[getLang()];

  mount(
    root,
    shell(
      h(
        "article",
        { class: "method" },
        h("h1", { class: "screen-h" }, m.title),
        h("p", { class: "method-intro" }, m.intro),
        ...m.sections.flatMap((s) => [
          h("h2", { class: "section-h" }, s.heading),
          ...s.paragraphs.map((par) => h("p", { class: "lesson-par" }, par)),
        ]),
        h("h2", { class: "section-h" }, m.sourcesHeading),
        h("ul", { class: "sources" }, ...m.sources.map((src) => h("li", {}, src))),
        h(
          "p",
          { class: "lab-note" },
          t("laboratorium"),
          " · ",
          h("a", { href: "https://postcognitive.pl", rel: "noopener" }, "postcognitive.pl"),
        ),
      ),
      { back: "#/" },
    ),
  );
}
