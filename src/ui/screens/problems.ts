import { getLang, t } from "../../i18n";
import type { Problem, ProblemStatus } from "../../storage/models";
import { deleteProblemDeep, getProblem, listProblems, saveProblem, sessionsForProblem } from "../../storage/repo";
import { fmtDate, h, mount } from "../dom";
import { navigate } from "../router";
import { shell } from "../shell";

export async function problemsScreen(root: HTMLElement): Promise<void> {
  const problems = await listProblems();

  const item = (p: Problem) =>
    h(
      "a",
      { class: "index-item", href: `#/problem/${p.id}` },
      h("span", { class: "index-name" }, p.title),
      h("span", { class: "index-desc" }, t(`problems.status.${p.status}` as "problems.status.active")),
    );

  mount(
    root,
    shell(
      h(
        "div",
        {},
        h("h1", { class: "screen-h" }, t("problems.title")),
        problems.length === 0
          ? h("p", { class: "muted" }, t("problems.empty"))
          : h("section", { class: "index" }, ...problems.map(item)),
      ),
      { back: "#/" },
    ),
  );
}

export async function problemDetailScreen(root: HTMLElement, params: Record<string, string>): Promise<void> {
  const id = params.id ?? "";
  const p = await getProblem(id);
  if (!p) {
    navigate("#/problems");
    return;
  }
  const walks = await sessionsForProblem(id);

  const setStatus = async (status: ProblemStatus): Promise<void> => {
    p.status = status;
    p.updatedAt = Date.now();
    await saveProblem(p);
    await problemDetailScreen(root, params);
  };

  const deleteBtn = h("button", { class: "quiet danger", type: "button" }, t("problem.delete"));
  let armed = false;
  deleteBtn.addEventListener("click", () => {
    if (!armed) {
      armed = true;
      deleteBtn.textContent = t("problem.deleteConfirm");
      window.setTimeout(() => {
        armed = false;
        deleteBtn.textContent = t("problem.delete");
      }, 3500);
      return;
    }
    void deleteProblemDeep(id).then(() => navigate("#/problems"));
  });

  const statusActions = h(
    "div",
    { class: "row wrap" },
    p.status !== "resolved"
      ? h("button", { class: "quiet", type: "button", onclick: () => void setStatus("resolved") }, t("problem.resolve"))
      : h("button", { class: "quiet", type: "button", onclick: () => void setStatus("active") }, t("problem.reopen")),
    p.status !== "parked"
      ? h("button", { class: "quiet", type: "button", onclick: () => void setStatus("parked") }, t("problem.park"))
      : h("button", { class: "quiet", type: "button", onclick: () => void setStatus("active") }, t("problem.reopen")),
    deleteBtn,
  );

  const walkEntries = walks.map((s) => {
    const min = Math.max(1, Math.round(s.elapsedSec / 60));
    return h(
      "div",
      { class: "walk-entry" },
      h("p", { class: "muted" }, `${fmtDate(s.startedAt, getLang())} · ${t("problem.walkMin", { n: min })}`),
      h("p", {}, s.drift ? h("em", {}, t("problem.noResult")) : `${t("problem.result")}: ${s.resultSentence}`),
      s.nextStepQuestion ? h("p", { class: "muted" }, `${t("problem.next")}: ${s.nextStepQuestion}`) : null,
    );
  });

  mount(
    root,
    shell(
      h(
        "div",
        {},
        h("h1", { class: "screen-h" }, p.title),
        h("p", { class: "question-epigraph static" }, p.question),
        h("p", { class: "muted" }, `${t(`problems.status.${p.status}` as "problems.status.active")} · ${t("problems.walks", { n: walks.length })}`),
        p.nextStepQuestion ? h("p", {}, `${t("problem.next")}: ${p.nextStepQuestion}`) : null,
        statusActions,
        h("div", { class: "thread-walks" }, ...walkEntries),
      ),
      { back: "#/problems" },
    ),
  );
}
