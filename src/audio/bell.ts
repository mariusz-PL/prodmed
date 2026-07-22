import type { BellKind } from "../engine/session";

/** Dzwonki syntetyzowane Web Audio — zero assetów, brzmienie misy: ton + niharmoniczna składowa. */

let ctx: AudioContext | null = null;

/** Wywołać z gestu użytkownika (start sesji) — odblokowuje audio na iOS. */
export function ensureAudio(): void {
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function resumeAudio(): void {
  if (ctx && ctx.state === "suspended") void ctx.resume();
}

function strike(freq: number, when: number, peak: number, durSec: number): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  for (const [ratio, gainMul] of [
    [1, 1],
    [2.756, 0.28],
  ] as const) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak * gainMul, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + durSec);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + durSec + 0.05);
  }
}

export function playBell(kind: BellKind): void {
  if (!ctx) return;
  switch (kind) {
    case "interval":
      strike(528, 0, 0.1, 2.0);
      break;
    case "work-start":
      strike(396, 0, 0.11, 1.8);
      strike(528, 0.35, 0.1, 2.2);
      break;
    case "rest-start":
      strike(297, 0, 0.09, 2.4);
      break;
    case "rest-end":
      strike(396, 0, 0.1, 1.8);
      break;
    case "consolidate":
      strike(660, 0, 0.1, 1.6);
      strike(528, 0.3, 0.1, 1.8);
      strike(396, 0.62, 0.11, 2.6);
      break;
  }
}

export function vibrate(kind: BellKind): void {
  if (!("vibrate" in navigator)) return;
  navigator.vibrate(kind === "interval" ? [45] : [35, 70, 35]);
}
