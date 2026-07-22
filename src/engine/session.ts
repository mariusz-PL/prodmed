/**
 * Silnik sesji spacerowej — czysty FSM.
 * Fazy: anchor → work ⇄ rest → consolidate → done.
 * Czas wstrzykiwany (tick z dt), efekty zwracane jako dane — zero I/O, zero Date.now().
 */

export type Mode = "problem" | "insight" | "reset";
export type Phase = "anchor" | "work" | "rest" | "consolidate" | "done";
export type BellKind = "work-start" | "interval" | "rest-start" | "rest-end" | "consolidate";

export type Effect = { type: "bell"; kind: BellKind } | { type: "phase"; phase: Phase };

export interface SessionConfig {
  mode: Mode;
  /** Sekundy czystej kotwicy na starcie (0 = od razu praca). */
  anchorSec: number;
  /** Dzwonek interwałowy co N sekund CZASU PRACY (0 = wyłączony). */
  bellEverySec: number;
  /** Wymuszony spoczynek po każdym wglądzie (0 = bez spoczynku). */
  restSec: number;
  /** Planowana długość całości (0 = sesja otwarta, bez auto-konsolidacji). */
  planSec: number;
  /** Ile sekund przed końcem planu zaczyna się konsolidacja. */
  consolidateSec: number;
}

export interface Insight {
  atSec: number;
  kind: "marker" | "voice";
  audioId?: string;
}

export interface EngineState {
  phase: Phase;
  elapsedSec: number;
  phaseElapsedSec: number;
  /** Licznik wyłącznie czasu w fazie work — kadencja dzwonków pauzuje w rest. */
  workElapsedSec: number;
  nextBellAtWorkSec: number | null;
  restRemainingSec: number;
  insights: Insight[];
}

export interface TickResult {
  state: EngineState;
  effects: Effect[];
}

export function init(cfg: SessionConfig): EngineState {
  return {
    phase: cfg.anchorSec > 0 ? "anchor" : "work",
    elapsedSec: 0,
    phaseElapsedSec: 0,
    workElapsedSec: 0,
    nextBellAtWorkSec: cfg.bellEverySec > 0 ? cfg.bellEverySec : null,
    restRemainingSec: 0,
    insights: [],
  };
}

function enterPhase(s: EngineState, phase: Phase, effects: Effect[], bell?: BellKind): void {
  s.phase = phase;
  s.phaseElapsedSec = 0;
  effects.push({ type: "phase", phase });
  if (bell) effects.push({ type: "bell", kind: bell });
}

export function tick(state: EngineState, cfg: SessionConfig, dtSec = 1): TickResult {
  if (state.phase === "done" || dtSec <= 0) return { state, effects: [] };

  const s: EngineState = { ...state, insights: state.insights };
  const effects: Effect[] = [];

  for (let i = 0; i < dtSec; i++) {
    if (s.phase === "done") break;
    s.elapsedSec++;
    s.phaseElapsedSec++;

    switch (s.phase) {
      case "anchor":
        if (s.phaseElapsedSec >= cfg.anchorSec) enterPhase(s, "work", effects, "work-start");
        break;
      case "work":
        s.workElapsedSec++;
        if (s.nextBellAtWorkSec !== null && s.workElapsedSec >= s.nextBellAtWorkSec) {
          effects.push({ type: "bell", kind: "interval" });
          s.nextBellAtWorkSec = s.workElapsedSec + cfg.bellEverySec;
        }
        break;
      case "rest":
        s.restRemainingSec--;
        if (s.restRemainingSec <= 0) enterPhase(s, "work", effects, "rest-end");
        break;
      case "consolidate":
        break;
    }

    const inWalk = s.phase === "anchor" || s.phase === "work" || s.phase === "rest";
    if (inWalk && cfg.planSec > 0 && s.elapsedSec >= cfg.planSec - cfg.consolidateSec) {
      enterPhase(s, "consolidate", effects, "consolidate");
    }
  }

  // Nadrabianie po ukryciu karty: z wielu zaległych dzwonków interwałowych graj tylko ostatni.
  const intervals = effects.filter((e) => e.type === "bell" && e.kind === "interval");
  if (intervals.length > 1) {
    let kept = 0;
    const deduped = effects.filter((e) => {
      if (e.type === "bell" && e.kind === "interval") return ++kept === intervals.length;
      return true;
    });
    return { state: s, effects: deduped };
  }

  return { state: s, effects };
}

export function captureInsight(
  state: EngineState,
  cfg: SessionConfig,
  insight: { kind: Insight["kind"]; audioId?: string },
): TickResult {
  if (state.phase !== "work") return { state, effects: [] };

  const record: Insight =
    insight.audioId === undefined
      ? { atSec: state.elapsedSec, kind: insight.kind }
      : { atSec: state.elapsedSec, kind: insight.kind, audioId: insight.audioId };

  const s: EngineState = { ...state, insights: [...state.insights, record] };
  const effects: Effect[] = [];

  if (cfg.restSec > 0) {
    s.restRemainingSec = cfg.restSec;
    enterPhase(s, "rest", effects, "rest-start");
  }

  return { state: s, effects };
}

export function beginConsolidate(state: EngineState): TickResult {
  if (state.phase === "consolidate" || state.phase === "done") return { state, effects: [] };
  const s: EngineState = { ...state, insights: state.insights };
  const effects: Effect[] = [];
  enterPhase(s, "consolidate", effects, "consolidate");
  return { state: s, effects };
}

export function finish(state: EngineState): TickResult {
  if (state.phase === "done") return { state, effects: [] };
  const s: EngineState = { ...state, insights: state.insights };
  const effects: Effect[] = [];
  enterPhase(s, "done", effects);
  return { state: s, effects };
}
