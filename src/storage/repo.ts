import type { EngineState } from "../engine/session";
import { del, get, getAll, getByIndex, put, wipeAll } from "./db";
import {
  DEFAULT_LESSONS,
  DEFAULT_SETTINGS,
  type ActiveSessionSnapshot,
  type AudioNote,
  type LessonProgress,
  type Problem,
  type SessionRecord,
  type Settings,
} from "./models";

const LS_SETTINGS = "prodmed:settings";
const LS_LESSONS = "prodmed:lessons";
const LS_ACTIVE = "prodmed:active";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
}

export function loadLessons(): LessonProgress {
  try {
    const raw = localStorage.getItem(LS_LESSONS);
    if (!raw) return { read: [...DEFAULT_LESSONS.read] };
    const parsed = JSON.parse(raw) as LessonProgress;
    if (!Array.isArray(parsed.read) || parsed.read.length !== 6) return { read: [...DEFAULT_LESSONS.read] };
    return parsed;
  } catch {
    return { read: [...DEFAULT_LESSONS.read] };
  }
}

export function saveLessons(p: LessonProgress): void {
  localStorage.setItem(LS_LESSONS, JSON.stringify(p));
}

export function loadActive(): ActiveSessionSnapshot | null {
  try {
    const raw = localStorage.getItem(LS_ACTIVE);
    if (!raw) return null;
    const snap = JSON.parse(raw) as ActiveSessionSnapshot;
    if (!snap.engine || !snap.config) return null;
    return snap;
  } catch {
    return null;
  }
}

export function saveActive(snap: ActiveSessionSnapshot): void {
  localStorage.setItem(LS_ACTIVE, JSON.stringify(snap));
}

export function clearActive(): void {
  localStorage.removeItem(LS_ACTIVE);
}

// --- Problems ---

export async function listProblems(): Promise<Problem[]> {
  const all = await getAll<Problem>("problems");
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getProblem(id: string): Promise<Problem | undefined> {
  return get<Problem>("problems", id);
}

export async function saveProblem(p: Problem): Promise<void> {
  await put("problems", p);
}

export async function deleteProblemDeep(id: string): Promise<void> {
  const sessions = await getByIndex<SessionRecord>("sessions", "byProblem", id);
  for (const s of sessions) {
    for (const ins of s.insights) if (ins.audioId) await del("audio", ins.audioId);
    await del("sessions", s.id);
  }
  await del("problems", id);
}

// --- Sessions ---

export async function listSessions(): Promise<SessionRecord[]> {
  const all = await getAll<SessionRecord>("sessions");
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function sessionsForProblem(problemId: string): Promise<SessionRecord[]> {
  const all = await getByIndex<SessionRecord>("sessions", "byProblem", problemId);
  return all.sort((a, b) => b.startedAt - a.startedAt);
}

export async function saveSession(s: SessionRecord): Promise<void> {
  await put("sessions", s);
}

// --- Audio ---

export async function saveAudio(note: AudioNote): Promise<void> {
  await put("audio", note);
}

export async function getAudio(id: string): Promise<AudioNote | undefined> {
  return get<AudioNote>("audio", id);
}

export async function deleteAudio(id: string): Promise<void> {
  return del("audio", id);
}

// --- Export / import ---

export interface BackupShape {
  app: "prodmed";
  version: 1;
  exportedAt: number;
  problems: Problem[];
  sessions: SessionRecord[];
  settings: Settings;
  lessons: LessonProgress;
}

export async function exportJson(): Promise<string> {
  const backup: BackupShape = {
    app: "prodmed",
    version: 1,
    exportedAt: Date.now(),
    problems: await listProblems(),
    sessions: await listSessions(),
    settings: loadSettings(),
    lessons: loadLessons(),
  };
  return JSON.stringify(backup, null, 2);
}

export async function importJson(raw: string): Promise<{ problems: number; sessions: number }> {
  const parsed = JSON.parse(raw) as Partial<BackupShape>;
  if (parsed.app !== "prodmed" || parsed.version !== 1) throw new Error("bad backup");
  const problems = parsed.problems ?? [];
  const sessions = parsed.sessions ?? [];
  for (const p of problems) await put("problems", p);
  for (const s of sessions) await put("sessions", s);
  if (parsed.settings) saveSettings({ ...DEFAULT_SETTINGS, ...parsed.settings });
  if (parsed.lessons) saveLessons(parsed.lessons);
  return { problems: problems.length, sessions: sessions.length };
}

export async function exportMarkdown(lang: "pl" | "en"): Promise<string> {
  const problems = await listProblems();
  const sessions = await listSessions();
  const fmt = (ms: number) => {
    const d = new Date(ms);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}.${mm}.${d.getFullYear()}`;
  };
  const L = lang === "pl";
  const lines: string[] = [L ? "# ProdMed — dziennik spacerów" : "# ProdMed — walking journal", ""];

  for (const p of problems) {
    lines.push(`## ${p.title}`);
    lines.push(`${L ? "Pytanie" : "Question"}: ${p.question}`);
    if (p.nextStepQuestion) lines.push(`${L ? "Następny krok" : "Next step"}: ${p.nextStepQuestion}`);
    lines.push("");
    for (const s of sessions.filter((s) => s.problemId === p.id)) {
      const min = Math.round(s.elapsedSec / 60);
      lines.push(`### ${fmt(s.startedAt)} — ${min} min`);
      lines.push(
        s.drift
          ? L
            ? "_dryf — bez wyniku_"
            : "_drift — no result_"
          : `${L ? "Wynik" : "Result"}: ${s.resultSentence}`,
      );
      if (s.nextStepQuestion) lines.push(`${L ? "Dalej" : "Next"}: ${s.nextStepQuestion}`);
      if (s.insights.length > 0) lines.push(`${L ? "Wglądy" : "Insights"}: ${s.insights.length}`);
      lines.push("");
    }
  }

  const loose = sessions.filter((s) => !s.problemId);
  if (loose.length > 0) {
    lines.push(L ? "## Spacery bez wątku" : "## Walks without a thread");
    lines.push("");
    for (const s of loose) {
      const min = Math.round(s.elapsedSec / 60);
      lines.push(`### ${fmt(s.startedAt)} — ${min} min (${s.mode})`);
      if (!s.drift && s.resultSentence) lines.push(`${L ? "Wynik" : "Result"}: ${s.resultSentence}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export async function wipeEverything(): Promise<void> {
  await wipeAll();
  localStorage.removeItem(LS_SETTINGS);
  localStorage.removeItem(LS_LESSONS);
  localStorage.removeItem(LS_ACTIVE);
}
