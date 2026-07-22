import { checkMicPermission, recordingSupported } from "../../audio/recorder";
import type { Mode } from "../../engine/session";
import { t } from "../../i18n";
import { startSession } from "../../session/controller";
import type { Problem } from "../../storage/models";
import { listProblems, loadSettings, saveProblem, saveSettings } from "../../storage/repo";
import { h, mount } from "../dom";
import { navigate } from "../router";
import { shell } from "../shell";

const DURATIONS = [15, 25, 40, 60, 0]; // 0 = otwarta

export async function loadScreen(root: HTMLElement, params: Record<string, string>): Promise<void> {
  const mode = (["problem", "insight", "reset"].includes(params.mode ?? "") ? params.mode : "problem") as Mode;
  const settings = loadSettings();
  let planMin = settings.lastPlanMin;
  let selected: Problem | null = null;

  const threads =
    mode === "reset" ? [] : (await listProblems()).filter((p) => p.mode === mode && p.status === "active");

  // --- pola formularza ---
  const questionEl = h("textarea", {
    class: "textarea",
    rows: "2",
    placeholder: mode === "insight" ? t("load.idea.ph") : t("load.question.ph"),
  });
  const nextStepEl = h("input", { class: "input", type: "text" });
  const variablesEl = h("textarea", { class: "textarea", rows: "2" });
  const echo = h("p", { class: "question-echo" }, "");
  questionEl.addEventListener("input", () => {
    echo.textContent = questionEl.value.trim();
  });

  const fields = h(
    "div",
    {},
    h(
      "div",
      { class: "field" },
      h("label", { class: "label" }, mode === "insight" ? t("load.idea") : t("load.question")),
      questionEl,
      echo,
    ),
    h(
      "div",
      { class: "field" },
      h("label", { class: "label" }, t("load.nextStep")),
      nextStepEl,
      h("p", { class: "hint" }, t("load.nextStep.hint")),
    ),
    h(
      "div",
      { class: "field" },
      h("label", { class: "label" }, t("load.variables")),
      variablesEl,
      h("p", { class: "hint" }, t("load.variables.hint")),
    ),
  );

  const applyProblem = (p: Problem | null): void => {
    selected = p;
    for (const el of threadList.querySelectorAll(".thread-item")) el.classList.remove("selected");
    if (p) {
      const btn = threadList.querySelector(`[data-id="${p.id}"]`);
      btn?.classList.add("selected");
      questionEl.value = p.question;
      echo.textContent = p.question;
      nextStepEl.value = p.nextStepQuestion;
      variablesEl.value = p.variables;
    } else {
      newBtn.classList.add("selected");
      questionEl.value = "";
      echo.textContent = "";
      nextStepEl.value = "";
      variablesEl.value = "";
    }
  };

  const newBtn = h(
    "button",
    { class: "thread-item selected", type: "button", onclick: () => applyProblem(null) },
    `+ ${t("load.newThread")}`,
  );
  const threadList = h(
    "div",
    { class: "thread-list" },
    newBtn,
    ...threads.map((p) =>
      h(
        "button",
        { class: "thread-item", type: "button", "data-id": p.id, onclick: () => applyProblem(p) },
        h("span", { class: "thread-title" }, p.title),
        p.nextStepQuestion ? h("span", { class: "thread-carried" }, `${t("load.carried")}: ${p.nextStepQuestion}`) : null,
      ),
    ),
  );

  // --- długość ---
  const segBtns = DURATIONS.map((min) =>
    h(
      "button",
      {
        class: `seg-btn${min === planMin ? " active" : ""}`,
        type: "button",
        onclick: (ev) => {
          planMin = min;
          for (const b of segWrap.querySelectorAll(".seg-btn")) b.classList.remove("active");
          (ev.currentTarget as HTMLElement).classList.add("active");
        },
      },
      min === 0 ? t("load.duration.open") : `${min} ${t("load.min")}`,
    ),
  );
  const segWrap = h("div", { class: "seg" }, ...segBtns);

  // --- mikrofon ---
  const micStatus = h("span", { class: "muted" }, recordingSupported() ? "" : t("audio.unsupported"));
  const micRow =
    mode === "reset"
      ? null
      : h(
          "div",
          { class: "mic-row" },
          h("span", { class: "label" }, t("load.mic")),
          recordingSupported()
            ? h(
                "button",
                {
                  class: "quiet",
                  type: "button",
                  onclick: () => {
                    micStatus.textContent = "…";
                    void checkMicPermission().then((ok) => {
                      micStatus.textContent = ok ? t("load.mic.ok") : t("load.mic.denied");
                    });
                  },
                },
                t("load.mic.check"),
              )
            : h("span", {}),
          micStatus,
        );

  const start = async (): Promise<void> => {
    const questionText = questionEl.value.trim();
    if (mode !== "reset" && !questionText && !selected) {
      questionEl.focus();
      return;
    }
    let problemId: string | undefined;
    if (mode !== "reset") {
      const now = Date.now();
      if (selected) {
        selected.question = questionText || selected.question;
        selected.title = (questionText || selected.question).slice(0, 72);
        selected.nextStepQuestion = nextStepEl.value.trim();
        selected.variables = variablesEl.value.trim();
        selected.updatedAt = now;
        await saveProblem(selected);
        problemId = selected.id;
      } else {
        const p: Problem = {
          id: crypto.randomUUID(),
          mode: mode as "problem" | "insight",
          title: questionText.slice(0, 72),
          question: questionText,
          nextStepQuestion: nextStepEl.value.trim(),
          variables: variablesEl.value.trim(),
          status: "active",
          createdAt: now,
          updatedAt: now,
        };
        await saveProblem(p);
        problemId = p.id;
      }
    }
    saveSettings({ ...settings, lastPlanMin: planMin });
    const shown = nextStepEl.value.trim() || questionEl.value.trim();
    startSession({
      mode,
      questionShown: shown,
      planMin,
      settings,
      ...(problemId !== undefined ? { problemId } : {}),
    });
    navigate("#/session");
  };

  mount(
    root,
    shell(
      h(
        "div",
        {},
        h("h1", { class: "screen-h" }, t(`load.title.${mode}` as "load.title.problem")),
        mode !== "reset" && threads.length > 0
          ? h("div", { class: "field" }, h("label", { class: "label" }, t("load.threads")), threadList)
          : null,
        mode !== "reset" ? fields : null,
        h("div", { class: "field" }, h("label", { class: "label" }, t("load.duration")), segWrap),
        micRow,
        h("p", { class: "anchor-note" }, t("load.anchorNote")),
        h("button", { class: "primary", type: "button", onclick: () => void start() }, t("load.start")),
      ),
      { back: "#/", nav: false },
    ),
  );
}
