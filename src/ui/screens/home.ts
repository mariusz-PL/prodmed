import { getLang, t } from "../../i18n";
import { discardActive, hasActiveSession } from "../../session/controller";
import { listSessions, loadLessons } from "../../storage/repo";
import { fmtDate, h, mount } from "../dom";
import { navigate } from "../router";
import { shell } from "../shell";

export async function homeScreen(root: HTMLElement): Promise<void> {
  const lessons = loadLessons();
  const readCount = lessons.read.filter(Boolean).length;
  const recent = (await listSessions()).slice(0, 3);

  const resume = hasActiveSession()
    ? h(
        "section",
        { class: "resume-banner" },
        h("p", {}, t("home.resume")),
        h(
          "div",
          { class: "row" },
          h("button", { class: "primary small", onclick: () => navigate("#/session") }, t("home.resume.cta")),
          h(
            "button",
            {
              class: "quiet",
              onclick: () => {
                void discardActive().then(() => homeScreen(root));
              },
            },
            t("home.resume.discard"),
          ),
        ),
      )
    : null;

  const modeEntry = (mode: "problem" | "insight" | "reset", name: string, desc: string) =>
    h(
      "a",
      { class: "index-item", href: `#/load?mode=${mode}` },
      h("span", { class: "index-name" }, name),
      h("span", { class: "index-desc" }, desc),
    );

  const recentItems =
    recent.length === 0
      ? [h("p", { class: "muted" }, t("home.recent.empty"))]
      : recent.map((s) => {
          const min = Math.max(1, Math.round(s.elapsedSec / 60));
          const what = s.drift ? t("home.drift") : s.resultSentence || t(`mode.${s.mode}` as "mode.reset");
          return h(
            "div",
            { class: "recent-item" },
            h("span", { class: "muted" }, `${fmtDate(s.startedAt, getLang())} · ${min} min`),
            h("span", { class: "recent-what" }, what),
          );
        });

  mount(
    root,
    shell(
      h(
        "div",
        {},
        resume,
        h("h1", { class: "greeting" }, t("home.greeting")),
        h(
          "section",
          { class: "index" },
          modeEntry("problem", t("mode.problem"), t("mode.problem.desc")),
          modeEntry("insight", t("mode.insight"), t("mode.insight.desc")),
          modeEntry("reset", t("mode.reset"), t("mode.reset.desc")),
        ),
        h(
          "section",
          { class: "home-lessons" },
          h(
            "a",
            { class: "index-item", href: "#/lessons" },
            h("span", { class: "index-name" }, t("home.lessons")),
            h("span", { class: "index-desc" }, t("home.lessonProgress", { done: readCount })),
          ),
        ),
        h("section", { class: "recent" }, h("h2", { class: "section-h" }, t("home.recent")), ...recentItems),
        h("p", { class: "lab-note" }, t("laboratorium")),
      ),
    ),
  );
}
