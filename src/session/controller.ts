import { ensureAudio, playBell, resumeAudio, vibrate } from "../audio/bell";
import { VoiceRecorder } from "../audio/recorder";
import {
  beginConsolidate,
  captureInsight,
  finish,
  init,
  tick,
  type Effect,
  type EngineState,
  type Mode,
  type SessionConfig,
} from "../engine/session";
import { clearActive, deleteAudio, getProblem, loadActive, saveActive, saveAudio, saveProblem, saveSession } from "../storage/repo";
import type { ActiveSessionSnapshot, SessionRecord, Settings } from "../storage/models";

export interface SessionView {
  engine: EngineState;
  config: SessionConfig;
  questionShown: string;
  recording: boolean;
  locked: boolean;
  toast: string | null;
}

type Listener = (view: SessionView) => void;

let engine: EngineState | null = null;
let config: SessionConfig | null = null;
let problemId: string | undefined;
let questionShown = "";
let startedAt = 0;
let lastWallMs = 0;
let timerId: number | null = null;
let listener: Listener | null = null;
let locked = false;
let toast: string | null = null;
let toastTimer: number | null = null;
let wakeLock: WakeLockSentinel | null = null;
const recorder = new VoiceRecorder();
let visibilityHooked = false;

function view(): SessionView | null {
  if (!engine || !config) return null;
  return { engine, config, questionShown, recording: recorder.active, locked, toast };
}

function notify(): void {
  const v = view();
  if (v && listener) listener(v);
}

function showToast(msg: string): void {
  toast = msg;
  if (toastTimer !== null) window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast = null;
    notify();
  }, 2200);
  notify();
}

function playEffects(effects: Effect[], silent = false): void {
  if (silent) return;
  for (const e of effects) {
    if (e.type === "bell") {
      playBell(e.kind);
      vibrate(e.kind);
    }
  }
}

async function requestWakeLock(): Promise<void> {
  try {
    if ("wakeLock" in navigator && !wakeLock) {
      wakeLock = await navigator.wakeLock.request("screen");
      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch {
    /* brak wsparcia lub odmowa — sesja działa dalej, ekran może zgasnąć */
  }
}

function persist(): void {
  if (!engine || !config) return;
  const snap: ActiveSessionSnapshot = {
    config,
    questionShown,
    startedAt,
    lastWallMs,
    engine,
    ...(problemId !== undefined ? { problemId } : {}),
  };
  saveActive(snap);
}

function step(silent = false): void {
  if (!engine || !config) return;
  const wall = Date.now();
  const dt = Math.min(Math.round((wall - lastWallMs) / 1000), 6 * 3600);
  if (dt < 1) return;
  const r = tick(engine, config, dt);
  engine = r.state;
  lastWallMs += dt * 1000;
  playEffects(r.effects, silent);
  persist();
  notify();
}

function startLoop(): void {
  stopLoop();
  lastWallMs = Date.now();
  timerId = window.setInterval(() => step(), 1000);
  if (!visibilityHooked) {
    visibilityHooked = true;
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && engine) {
        resumeAudio();
        void requestWakeLock();
        step(true); // nadrabianie po ukryciu — bez salwy dzwonków
      }
    });
  }
}

function stopLoop(): void {
  if (timerId !== null) {
    window.clearInterval(timerId);
    timerId = null;
  }
}

export function hasActiveSession(): boolean {
  return engine !== null || loadActive() !== null;
}

export function startSession(opts: {
  mode: Mode;
  problemId?: string;
  questionShown: string;
  planMin: number;
  settings: Settings;
}): void {
  ensureAudio(); // gest użytkownika „Wychodzę" — odblokowanie audio na iOS
  const planSec = opts.planMin > 0 ? opts.planMin * 60 : 0;
  config = {
    mode: opts.mode,
    anchorSec: Math.max(0, Math.round(opts.settings.anchorMin * 60)),
    bellEverySec: Math.max(0, Math.round(opts.settings.bellEveryMin * 60)),
    restSec: opts.mode === "reset" ? 0 : opts.settings.restSec,
    planSec,
    consolidateSec: planSec > 0 ? Math.min(180, Math.max(60, Math.floor(planSec / 8))) : 180,
  };
  engine = init(config);
  problemId = opts.problemId;
  questionShown = opts.questionShown;
  startedAt = Date.now();
  locked = false;
  toast = null;
  void requestWakeLock();
  startLoop();
  persist();
}

/** Wznowienie po przeładowaniu strony (snapshot z localStorage). */
export function resumeSession(): boolean {
  if (engine) return true;
  const snap = loadActive();
  if (!snap) return false;
  config = snap.config;
  engine = snap.engine;
  problemId = snap.problemId;
  questionShown = snap.questionShown;
  startedAt = snap.startedAt;
  lastWallMs = snap.lastWallMs;
  ensureAudio();
  void requestWakeLock();
  step(true); // dolicz czas nieobecności bez dźwięków
  startLoop();
  return true;
}

export async function discardActive(): Promise<void> {
  const snap = loadActive();
  if (snap) for (const ins of snap.engine.insights) if (ins.audioId) await deleteAudio(ins.audioId);
  if (engine) for (const ins of engine.insights) if (ins.audioId) await deleteAudio(ins.audioId);
  cleanup();
}

export function subscribe(cb: Listener): () => void {
  listener = cb;
  notify();
  return () => {
    if (listener === cb) listener = null;
  };
}

export function setLocked(value: boolean): void {
  locked = value;
  notify();
}

export function markInsight(savedMsg: string): void {
  if (!engine || !config) return;
  const r = captureInsight(engine, config, { kind: "marker" });
  engine = r.state;
  playEffects(r.effects);
  persist();
  showToast(savedMsg);
}

export async function startVoice(): Promise<boolean> {
  if (!engine || engine.phase !== "work") return false;
  try {
    await recorder.start();
    notify();
    return true;
  } catch {
    return false;
  }
}

export async function stopVoice(savedMsg: string): Promise<void> {
  if (!engine || !config) return;
  const result = await recorder.stop();
  if (!result) {
    notify();
    return;
  }
  const id = crypto.randomUUID();
  await saveAudio({ id, blob: result.blob, mime: result.mime, createdAt: Date.now() });
  const r = captureInsight(engine, config, { kind: "voice", audioId: id });
  engine = r.state;
  playEffects(r.effects);
  persist();
  showToast(savedMsg);
}

export function cancelVoice(): void {
  recorder.cancel();
  notify();
}

export function endWalk(): void {
  if (!engine) return;
  const r = beginConsolidate(engine);
  engine = r.state;
  playEffects(r.effects);
  persist();
  notify();
}

export interface FinishInput {
  resultSentence: string;
  nextStepQuestion: string;
  drift: boolean;
}

export async function finishAndSave(input: FinishInput): Promise<SessionRecord | null> {
  if (!engine || !config) return null;
  stopLoop();
  const r = finish(engine);
  engine = r.state;

  const record: SessionRecord = {
    id: crypto.randomUUID(),
    mode: config.mode,
    startedAt,
    endedAt: Date.now(),
    elapsedSec: engine.elapsedSec,
    config,
    insights: engine.insights,
    resultSentence: input.drift ? "" : input.resultSentence.trim(),
    nextStepQuestion: input.nextStepQuestion.trim(),
    drift: input.drift,
    ...(problemId !== undefined ? { problemId } : {}),
  };
  await saveSession(record);

  if (problemId) {
    const p = await getProblem(problemId);
    if (p) {
      p.updatedAt = Date.now();
      if (record.nextStepQuestion) p.nextStepQuestion = record.nextStepQuestion;
      await saveProblem(p);
    }
  }

  cleanup();
  return record;
}

function cleanup(): void {
  stopLoop();
  recorder.cancel();
  if (wakeLock) {
    void wakeLock.release().catch(() => undefined);
    wakeLock = null;
  }
  engine = null;
  config = null;
  problemId = undefined;
  questionShown = "";
  locked = false;
  toast = null;
  clearActive();
}

export function currentView(): SessionView | null {
  return view();
}
