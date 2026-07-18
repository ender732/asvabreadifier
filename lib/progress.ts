import type { TagPerformance } from "@/lib/adaptiveDrill";
import type { AsvabScores } from "@/lib/asvabScoring";

export const PROGRESS_STORAGE_KEY = "asvab-user-progress";
export const SAFE_WORD_STORAGE_KEY = "asvab-safe-word";

export type AssessmentSnapshot = {
  overallScore: number;
  subtests: {
    AR: number;
    MK: number;
    WK: number;
    PC: number;
  };
};

export type UserProgress = {
  version: 1;
  updatedAt: string;
  scores: AsvabScores;
  performance: TagPerformance[];
  assessment: AssessmentSnapshot | null;
};

export const EMPTY_SCORES: AsvabScores = {
  GS: 0,
  AR: 0,
  MK: 0,
  MC: 0,
  WK: 0,
  PC: 0,
  CT: 0,
};

export const EMPTY_PERFORMANCE: TagPerformance[] = [
  { subject: "MK", tag: "Algebra", attempts: 0, correct: 0 },
  { subject: "AR", tag: "Percentages", attempts: 0, correct: 0 },
  { subject: "AR", tag: "Word Problems", attempts: 0, correct: 0 },
  { subject: "WK", tag: "Synonyms", attempts: 0, correct: 0 },
  { subject: "WK", tag: "Context Clues", attempts: 0, correct: 0 },
];

const SAFE_WORD_PARTS = [
  "coral",
  "tide",
  "lantern",
  "ember",
  "cipher",
  "harbor",
  "signal",
  "orbit",
  "cedar",
  "flint",
  "nova",
  "ridge",
  "vector",
  "maple",
  "quark",
  "prism",
  "delta",
  "forge",
  "glyph",
  "haven",
  "ivory",
  "jade",
  "keel",
  "lotus",
  "mirth",
  "nexus",
  "onyx",
  "petal",
  "quartz",
  "raven",
  "sage",
  "torch",
];

export function createEmptyProgress(): UserProgress {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    scores: { ...EMPTY_SCORES },
    performance: EMPTY_PERFORMANCE.map((item) => ({ ...item })),
    assessment: null,
  };
}

export function normalizeSafeWord(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function isValidSafeWord(value: string): boolean {
  const normalized = normalizeSafeWord(value);
  return normalized.length >= 4 && normalized.length <= 64;
}

export function generateSafeWord(): string {
  const pick = () =>
    SAFE_WORD_PARTS[Math.floor(Math.random() * SAFE_WORD_PARTS.length)];
  return `${pick()}-${pick()}-${pick()}`;
}

export function assessmentFromScores(scores: AsvabScores): AssessmentSnapshot {
  const subtests = {
    AR: clampPercent(scores.AR),
    MK: clampPercent(scores.MK),
    WK: clampPercent(scores.WK),
    PC: clampPercent(scores.PC),
  };
  const overallScore = Math.round(
    (subtests.AR + subtests.MK + subtests.WK + subtests.PC) / 4,
  );
  return { overallScore, subtests };
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function readLocalProgress(): UserProgress | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as UserProgress;
    if (parsed?.version !== 1 || !parsed.scores || !parsed.performance) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeLocalProgress(progress: UserProgress): void {
  if (typeof window === "undefined") return;
  const next = { ...progress, updatedAt: new Date().toISOString() };
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("asvab-progress-changed"));
}

export function readStoredSafeWord(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SAFE_WORD_STORAGE_KEY);
}

export function writeStoredSafeWord(safeWord: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SAFE_WORD_STORAGE_KEY, normalizeSafeWord(safeWord));
}

export function clearStoredSafeWord(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SAFE_WORD_STORAGE_KEY);
}

export function progressApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_PROGRESS_API;
  if (configured) return configured.replace(/\/$/, "");

  // Default to the live Netlify site so Capacitor / local builds can sync
  // against the same cloud store as https://asvabme.netlify.app/
  return "https://asvabme.netlify.app/.netlify/functions/progress";
}

export async function saveProgressToCloud(
  safeWord: string,
  progress: UserProgress,
): Promise<void> {
  const response = await fetch(progressApiUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      safeWord: normalizeSafeWord(safeWord),
      progress,
    }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Could not save progress.");
  }
}

export async function loadProgressFromCloud(
  safeWord: string,
): Promise<UserProgress> {
  const response = await fetch(
    `${progressApiUrl()}?safeWord=${encodeURIComponent(normalizeSafeWord(safeWord))}`,
  );

  if (response.status === 404) {
    throw new Error("No saved progress found for that safe word.");
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(payload?.error ?? "Could not load progress.");
  }

  const payload = (await response.json()) as { progress: UserProgress };
  return payload.progress;
}

export function subscribeToLocalProgress(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === PROGRESS_STORAGE_KEY) onStoreChange();
  };
  const handleCustom = () => onStoreChange();
  window.addEventListener("storage", handleStorage);
  window.addEventListener("asvab-progress-changed", handleCustom);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("asvab-progress-changed", handleCustom);
  };
}

export function getLocalProgressSnapshot(): string | null {
  return localStorage.getItem(PROGRESS_STORAGE_KEY);
}
