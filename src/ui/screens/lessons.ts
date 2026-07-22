import { getLang, t } from "../../i18n";
import { LESSONS } from "../../lessons/content";
import { loadLessons, saveLessons } from "../../storage/repo";
import { h, mount } from "../dom";
import { navigate } from "../router";
import { shell } from "../shell";

export function lessonsScreen(root: HTMLElement): void {
  const progress = loadLessons();
  const lessons = LESSONS[getLang()];

  mount(
    root,
    shell(
      h(
        "div",
        {},
        h("h1", { class: "screen-h" }, t("lessons.title")),
        h("p", { class: "muted" }, t("lessons.intro")),
        h(
          "section",
          { class: "index" },
          ...lessons.map((l, i) =>
            h(
              "a",
              { class: "index-item", href: `#/lesson/${i + 1}` },
              h("span", { class: "index-name" }, `L${i + 1} — ${l.title}`),
              h("span", { class: "index-desc" }, progress.read[i] ? `✓ ${t("lesson.done")}` : l.lead),
            ),
          ),
        ),
      ),
      { back: "#/" },
    ),
  );
}

export function lessonScreen(root: HTMLElement, params: Record<string, string>): void {
  const n = Number(params.n ?? "1");
  const lessons = LESSONS[getLang()];
  const lesson = lessons[n - 1];
  if (!lesson) {
    navigate("#/lessons");
    return;
  }
  const progress = loadLessons();

  const markBtn = h(
    "button",
    { class: "primary", type: "button" },
    progress.read[n - 1] ? `✓ ${t("lesson.done")}` : t("lesson.mark"),
  );
  markBtn.addEventListener("click", () => {
    progress.read[n - 1] = true;
    saveLessons(progress);
    navigate("#/lessons");
  });

  mount(
    root,
    shell(
      h(
        "article",
        { class: "lesson" },
        h("p", { class: "eyebrow" }, `L${n} / 6`),
        h("h1", { class: "screen-h" }, lesson.title),
        h("p", { class: "lesson-lead" }, lesson.lead),
        ...lesson.body.map((par) => h("p", { class: "lesson-par" }, par)),
        markBtn,
      ),
      { back: "#/lessons" },
    ),
  );
}
