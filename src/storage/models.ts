import type { Insight, Mode, SessionConfig } from "../engine/session";
import type { Lang } from "../i18n";

export type ProblemStatus = "active" | "resolved" | "parked";

export interface Problem {
  id: string;
  /** Tryb, w którym wątek powstał: problem (biznes/decyzje) lub insight (idea/rozwój). */
  mode: Exclude<Mode, "reset">;
  title: string;
  question: string;
  nextStepQuestion: string;
  variables: string;
  status: ProblemStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SessionRecord {
  id: string;
  mode: Mode;
  problemId?: string;
  startedAt: number;
  endedAt: number;
  elapsedSec: number;
  config: SessionConfig;
  insights: Insight[];
  resultSentence: string;
  nextStepQuestion: string;
  drift: boolean;
}

export interface AudioNote {
  id: string;
  blob: Blob;
  mime: string;
  createdAt: number;
}

export interface Settings {
  lang: Lang;
  anchorMin: number;
  bellEveryMin: number;
  restSec: number;
  lastPlanMin: number;
}

export const DEFAULT_SETTINGS: Settings = {
  lang: "pl",
  anchorMin: 4,
  bellEveryMin: 5,
  restSec: 75,
  lastPlanMin: 25,
};

export interface LessonProgress {
  read: boolean[];
}

export const DEFAULT_LESSONS: LessonProgress = { read: [false, false, false, false, false, false] };

/** Zrzut aktywnej sesji do localStorage — przetrwanie przeładowania strony w trakcie spaceru. */
export interface ActiveSessionSnapshot {
  config: SessionConfig;
  problemId?: string;
  questionShown: string;
  startedAt: number;
  lastWallMs: number;
  engine: import("../engine/session").EngineState;
}
