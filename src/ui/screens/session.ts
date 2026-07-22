import { t } from "../../i18n";
import {
  cancelVoice,
  currentView,
  endWalk,
  finishAndSave,
  markInsight,
  resumeSession,
  setLocked,
  startVoice,
  stopVoice,
  subscribe,
  type SessionView,
} from "../../session/controller";
import { getAudio } from "../../storage/repo";
import { fmtClock, h, mount } from "../dom";
import { navigate } from "../router";

let unsub: (() => void) | null = null;

export function leaveSession(): void {
  if (unsub) {
    unsub();
    unsub = null;
  }
}

export function sessionScreen(root: HTMLElement): void {
  leaveSession();
  if (!currentView() && !resumeSession()) {
    navigate("#/");
    return;
  }

  let phaseShown: string | null = null;
  let els: {
    clock?: HTMLElement;
    phaseWord?: HTMLElement;
    hint?: HTMLElement;
    ring?: HTMLElement;
    toast?: HTMLElement;
    count?: HTMLElement;
    restCount?: HTMLElement;
    lockOverlay?: HTMLElement;
  } = {};

  const container = h("div", { class: "session" });
  mount(root, container);

  // auto-przyciemnienie po bezczynności
  let dimTimer: number | null = null;
  const undim = (): void => {
    container.classList.remove("dimmed");
    if (dimTimer !== null) window.clearTimeout(dimTimer);
    dimTimer = window.setTimeout(() => container.classList.add("dimmed"), 9000);
  };
  container.addEventListener("pointerdown", undim);
  undim();

  const buildWalkSkeleton = (v: SessionView): void => {
    const phase = v.engine.phase;
    els = {};

    const ring = h("div", { class: "ring", role: "button", "aria-label": t("session.workHint") });
    els.ring = ring;
    attachRingGestures(ring);

    els.phaseWord = h("p", { class: "phase-word" }, t(`phase.${phase}` as "phase.work"));
    els.hint = h("p", { class: "session-hint" }, "");
    els.restCount = h("p", { class: "rest-count" }, "");
    els.toast = h("p", { class: "toast", "aria-live": "polite" }, "");
    els.clock = h("span", { class: "clock" }, "");
    els.count = h("span", { class: "insight-count" }, "");

    const lockBtn = h(
      "button",
      { class: "quiet lock-btn", type: "button", onclick: () => setLocked(true) },
      t("session.lock"),
    );
    const endBtn = h(
      "button",
      { class: "quiet end-btn", type: "button", onclick: () => endWalk() },
      t("session.end"),
    );

    els.lockOverlay = buildLockOverlay();

    mount(
      container,
      els.phaseWord,
      h("div", { class: "ring-wrap" }, ring),
      h("p", { class: "question-epigraph" }, v.questionShown),
      els.hint,
      els.restCount,
      els.toast,
      h("div", { class: "session-bottom" }, els.clock, els.count, lockBtn, endBtn),
      els.lockOverlay,
    );
  };

  const buildConsolidate = (v: SessionView): void => {
    els = {};
    els.clock = h("span", { class: "clock" }, "");

    const sentence = h("textarea", {
      class: "textarea",
      rows: "3",
      placeholder: t("cons.sentence.ph"),
    });
    const nextStep = h("input", { class: "input", type: "text" });

    const insightsWrap = h("div", { class: "insight-chips" });
    for (const ins of v.engine.insights) {
      const chip = h("span", { class: "chip" }, `${fmtClock(ins.atSec)} · ${ins.kind === "voice" ? "▸" : t("cons.marker")}`);
      if (ins.kind === "voice" && ins.audioId) {
        let audio: HTMLAudioElement | null = null;
        chip.classList.add("chip-voice");
        chip.addEventListener("click", () => {
          if (audio) {
            audio.paused ? void audio.play() : audio.pause();
            return;
          }
          void getAudio(ins.audioId!).then((note) => {
            if (!note) return;
            audio = new Audio(URL.createObjectURL(note.blob));
            void audio.play();
          });
        });
      }
      insightsWrap.append(chip);
    }

    const save = async (drift: boolean): Promise<void> => {
      const text = sentence.value.trim();
      if (!drift && !text && v.config.mode !== "reset") {
        sentence.focus();
        return;
      }
      const record = await finishAndSave({
        resultSentence: text,
        nextStepQuestion: nextStep.value.trim(),
        drift,
      });
      leaveSession();
      navigate(record?.problemId ? `#/problem/${record.problemId}` : "#/");
    };

    mount(
      container,
      h("p", { class: "phase-word" }, t("phase.consolidate")),
      h(
        "div",
        { class: "cons-form" },
        v.engine.insights.length > 0
          ? h("div", { class: "field" }, h("label", { class: "label" }, t("cons.insights")), insightsWrap)
          : null,
        h("div", { class: "field" }, h("label", { class: "label" }, t("cons.sentence")), sentence),
        h("div", { class: "field" }, h("label", { class: "label" }, t("cons.nextStep")), nextStep),
        h("button", { class: "primary", type: "button", onclick: () => void save(false) }, t("cons.save")),
        h("button", { class: "quiet drift-btn", type: "button", onclick: () => void save(true) }, t("cons.drift")),
        h("p", { class: "hint center" }, t("cons.driftNote")),
        h("div", { class: "session-bottom" }, els.clock),
      ),
    );
    container.classList.remove("dimmed");
    if (dimTimer !== null) window.clearTimeout(dimTimer);
  };

  const update = (v: SessionView): void => {
    const phase = v.engine.phase;
    if (phase === "done") return;

    if (phase !== phaseShown) {
      phaseShown = phase;
      if (phase === "consolidate") buildConsolidate(v);
      else buildWalkSkeleton(v);
    }

    if (els.clock) els.clock.textContent = fmtClock(v.engine.elapsedSec);

    if (phase === "consolidate") return;

    if (els.phaseWord) els.phaseWord.textContent = t(`phase.${phase}` as "phase.work");
    if (els.hint) {
      els.hint.textContent =
        phase === "anchor"
          ? t("session.anchorHint")
          : phase === "rest"
            ? t("session.restHint")
            : v.config.mode === "reset"
              ? t("session.anchorHint")
              : t("session.workHint");
    }
    if (els.restCount) {
      els.restCount.textContent = phase === "rest" ? String(v.engine.restRemainingSec) : "";
    }
    if (els.ring) {
      els.ring.classList.toggle("work", phase === "work");
      els.ring.classList.toggle("rest", phase === "rest");
      els.ring.classList.toggle("recording", v.recording);
    }
    if (els.count) {
      const n = v.engine.insights.length;
      els.count.textContent = n > 0 ? `${t("session.insights")}: ${n}` : "";
    }
    if (els.toast) els.toast.textContent = v.toast ?? (v.recording ? t("session.recording") : "");
    if (els.lockOverlay) els.lockOverlay.classList.toggle("visible", v.locked);
  };

  unsub = subscribe(update);
}

function attachRingGestures(ring: HTMLElement): void {
  let holdTimer: number | null = null;
  let recording = false;
  let maxTimer: number | null = null;

  const clearTimers = (): void => {
    if (holdTimer !== null) window.clearTimeout(holdTimer);
    if (maxTimer !== null) window.clearTimeout(maxTimer);
    holdTimer = null;
    maxTimer = null;
  };

  const stopRec = (): void => {
    if (recording) {
      recording = false;
      void stopVoice(t("session.savedVoice"));
    }
  };

  ring.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    const v = currentView();
    if (!v || v.locked || v.engine.phase !== "work") return;
    clearTimers();
    holdTimer = window.setTimeout(() => {
      void startVoice().then((ok) => {
        if (ok) {
          recording = true;
          maxTimer = window.setTimeout(stopRec, 60000);
        }
      });
    }, 450);
  });

  ring.addEventListener("pointerup", () => {
    const v = currentView();
    if (!v || v.locked) return;
    if (holdTimer !== null && !recording) {
      clearTimers();
      if (v.engine.phase === "work") markInsight(t("session.savedMarker"));
    } else {
      clearTimers();
      stopRec();
    }
  });

  ring.addEventListener("pointercancel", () => {
    clearTimers();
    if (recording) {
      recording = false;
      cancelVoice();
    }
  });
}

function buildLockOverlay(): HTMLElement {
  const unlockBtn = h("button", { class: "unlock-btn", type: "button" }, t("session.unlockHold"));
  let timer: number | null = null;

  unlockBtn.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    unlockBtn.classList.add("holding");
    timer = window.setTimeout(() => {
      setLocked(false);
      unlockBtn.classList.remove("holding");
    }, 1200);
  });
  const cancel = (): void => {
    unlockBtn.classList.remove("holding");
    if (timer !== null) window.clearTimeout(timer);
    timer = null;
  };
  unlockBtn.addEventListener("pointerup", cancel);
  unlockBtn.addEventListener("pointercancel", cancel);

  return h("div", { class: "lock-overlay" }, unlockBtn);
}
