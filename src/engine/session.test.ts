import { describe, expect, test } from "vitest";
import {
  beginConsolidate,
  captureInsight,
  finish,
  init,
  tick,
  type EngineState,
  type SessionConfig,
} from "./session";

const cfg = (over: Partial<SessionConfig> = {}): SessionConfig => ({
  mode: "problem",
  anchorSec: 240,
  bellEverySec: 300,
  restSec: 75,
  planSec: 0,
  consolidateSec: 180,
  ...over,
});

/** Advance n seconds in 1s ticks, collecting all effects. */
function run(state: EngineState, c: SessionConfig, n: number) {
  const effects = [];
  for (let i = 0; i < n; i++) {
    const r = tick(state, c, 1);
    state = r.state;
    effects.push(...r.effects);
  }
  return { state, effects };
}

describe("init", () => {
  test("starts in anchor when anchorSec > 0", () => {
    const s = init(cfg());
    expect(s.phase).toBe("anchor");
    expect(s.elapsedSec).toBe(0);
    expect(s.insights).toEqual([]);
  });

  test("starts directly in work when anchorSec = 0", () => {
    const s = init(cfg({ anchorSec: 0 }));
    expect(s.phase).toBe("work");
  });
});

describe("anchor → work", () => {
  test("transitions to work after anchorSec with a work-start bell", () => {
    const { state, effects } = run(init(cfg({ anchorSec: 3 })), cfg({ anchorSec: 3 }), 3);
    expect(state.phase).toBe("work");
    expect(effects).toContainEqual({ type: "phase", phase: "work" });
    expect(effects).toContainEqual({ type: "bell", kind: "work-start" });
  });
});

describe("interval bells in work", () => {
  test("rings every bellEverySec of work time, not before", () => {
    const c = cfg({ anchorSec: 0, bellEverySec: 10 });
    let r = run(init(c), c, 9);
    expect(r.effects.filter((e) => e.type === "bell")).toHaveLength(0);
    r = run(r.state, c, 1); // work second 10
    expect(r.effects).toContainEqual({ type: "bell", kind: "interval" });
    r = run(r.state, c, 10); // work second 20
    expect(r.effects.filter((e) => e.type === "bell" && e.kind === "interval")).toHaveLength(1);
  });

  test("no interval bells when bellEverySec = 0", () => {
    const c = cfg({ anchorSec: 0, bellEverySec: 0 });
    const { effects } = run(init(c), c, 120);
    expect(effects.filter((e) => e.type === "bell")).toHaveLength(0);
  });

  test("a large catch-up tick emits at most one interval bell but keeps cadence", () => {
    const c = cfg({ anchorSec: 0, bellEverySec: 10 });
    const r = tick(init(c), c, 35); // would cross 10, 20, 30
    expect(r.effects.filter((e) => e.type === "bell" && e.kind === "interval")).toHaveLength(1);
    // next bell must be at work-second 40, i.e. after 5 more seconds
    const r2 = run(r.state, c, 4);
    expect(r2.effects.filter((e) => e.type === "bell")).toHaveLength(0);
    const r3 = run(r2.state, c, 1);
    expect(r3.effects).toContainEqual({ type: "bell", kind: "interval" });
  });
});

describe("insight → rest", () => {
  test("capture records insight at total elapsed time and enters rest", () => {
    const c = cfg({ anchorSec: 5, restSec: 20 });
    let state = run(init(c), c, 65).state; // 5 anchor + 60 work
    const r = captureInsight(state, c, { kind: "marker" });
    expect(r.state.insights).toEqual([{ atSec: 65, kind: "marker" }]);
    expect(r.state.phase).toBe("rest");
    expect(r.effects).toContainEqual({ type: "bell", kind: "rest-start" });
  });

  test("voice insight keeps its audio id", () => {
    const c = cfg({ anchorSec: 0 });
    const state = run(init(c), c, 10).state;
    const r = captureInsight(state, c, { kind: "voice", audioId: "a1" });
    expect(r.state.insights[0]).toEqual({ atSec: 10, kind: "voice", audioId: "a1" });
  });

  test("rest ends after restSec and returns to work with rest-end bell", () => {
    const c = cfg({ anchorSec: 0, restSec: 3 });
    let state = captureInsight(run(init(c), c, 10).state, c, { kind: "marker" }).state;
    const { state: after, effects } = run(state, c, 3);
    expect(after.phase).toBe("work");
    expect(effects).toContainEqual({ type: "bell", kind: "rest-end" });
  });

  test("capture with restSec = 0 stays in work", () => {
    const c = cfg({ anchorSec: 0, restSec: 0 });
    const state = run(init(c), c, 10).state;
    const r = captureInsight(state, c, { kind: "marker" });
    expect(r.state.phase).toBe("work");
  });

  test("bell cadence pauses during rest (counts work time only)", () => {
    const c = cfg({ anchorSec: 0, bellEverySec: 10, restSec: 30 });
    // 7s work, then insight -> 30s rest, then bell should come after 3 MORE work seconds
    let state = run(init(c), c, 7).state;
    state = captureInsight(state, c, { kind: "marker" }).state;
    let r = run(state, c, 30); // full rest, no interval bells inside
    expect(r.effects.filter((e) => e.type === "bell" && e.kind === "interval")).toHaveLength(0);
    expect(r.state.phase).toBe("work");
    r = run(r.state, c, 2);
    expect(r.effects.filter((e) => e.type === "bell")).toHaveLength(0);
    r = run(r.state, c, 1);
    expect(r.effects).toContainEqual({ type: "bell", kind: "interval" });
  });

  test("capture is ignored outside work", () => {
    const c = cfg({ anchorSec: 100 });
    const state = run(init(c), c, 10).state; // still anchor
    const r = captureInsight(state, c, { kind: "marker" });
    expect(r.state).toBe(state);
    expect(r.effects).toEqual([]);
  });
});

describe("consolidation", () => {
  test("auto-enters consolidate when planSec reached minus consolidateSec", () => {
    const c = cfg({ anchorSec: 0, bellEverySec: 0, planSec: 100, consolidateSec: 30 });
    const { state, effects } = run(init(c), c, 70);
    expect(state.phase).toBe("consolidate");
    expect(effects).toContainEqual({ type: "bell", kind: "consolidate" });
  });

  test("auto-consolidate preempts rest", () => {
    const c = cfg({ anchorSec: 0, restSec: 60, planSec: 80, consolidateSec: 30 });
    let state = run(init(c), c, 40).state;
    state = captureInsight(state, c, { kind: "marker" }).state; // rest at 40s
    const { state: after } = run(state, c, 10); // hits 50 = planSec - consolidateSec
    expect(after.phase).toBe("consolidate");
  });

  test("no auto-consolidate in open-ended session (planSec = 0)", () => {
    const c = cfg({ anchorSec: 0, planSec: 0 });
    const { state } = run(init(c), c, 3600);
    expect(state.phase).toBe("work");
  });

  test("manual beginConsolidate works from work", () => {
    const c = cfg({ anchorSec: 0 });
    const state = run(init(c), c, 10).state;
    const r = beginConsolidate(state);
    expect(r.state.phase).toBe("consolidate");
    expect(r.effects).toContainEqual({ type: "bell", kind: "consolidate" });
  });

  test("no bells inside consolidate; time keeps counting", () => {
    const c = cfg({ anchorSec: 0, bellEverySec: 5, planSec: 20, consolidateSec: 10 });
    let r = run(init(c), c, 10); // enters consolidate
    const before = r.state.elapsedSec;
    r = run(r.state, c, 30);
    expect(r.state.elapsedSec).toBe(before + 30);
    expect(r.effects.filter((e) => e.type === "bell")).toHaveLength(0);
  });

  test("finish moves consolidate → done and done ticks are inert", () => {
    const c = cfg({ anchorSec: 0 });
    let state = beginConsolidate(run(init(c), c, 10).state).state;
    const r = finish(state);
    expect(r.state.phase).toBe("done");
    const after = tick(r.state, c, 60);
    expect(after.state.elapsedSec).toBe(r.state.elapsedSec);
    expect(after.effects).toEqual([]);
  });
});
