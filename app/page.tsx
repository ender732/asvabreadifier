"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

const ASSESSMENT_STORAGE_KEY = "asvab-assessment-data";

type SubtestCode = "AR" | "MK" | "WK" | "PC";

type StoredAssessmentData = {
  overallScore: number;
  subtests: Record<SubtestCode, number>;
};

const subtests = [
  {
    name: "Arithmetic Reasoning",
    shortName: "AR",
    description: "Word problems & applied math",
    color: "#315c4b",
  },
  {
    name: "Math Knowledge",
    shortName: "MK",
    description: "Algebra, geometry & concepts",
    color: "#5876a8",
  },
  {
    name: "Word Knowledge",
    shortName: "WK",
    description: "Vocabulary & word meaning",
    color: "#b27b3a",
  },
  {
    name: "Paragraph Comprehension",
    shortName: "PC",
    description: "Reading & interpretation",
    color: "#8a6d9e",
  },
];

function subscribeToAssessmentData(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === ASSESSMENT_STORAGE_KEY) onStoreChange();
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

function getAssessmentSnapshot() {
  return localStorage.getItem(ASSESSMENT_STORAGE_KEY);
}

function getServerAssessmentSnapshot() {
  return null;
}

function parseAssessmentData(raw: string | null): StoredAssessmentData | null {
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as Partial<StoredAssessmentData>;
    const scores = value.subtests;
    const isValidScore = (score: unknown) =>
      typeof score === "number" && score >= 0 && score <= 100;

    if (
      !isValidScore(value.overallScore) ||
      !scores ||
      !isValidScore(scores.AR) ||
      !isValidScore(scores.MK) ||
      !isValidScore(scores.WK) ||
      !isValidScore(scores.PC)
    ) {
      return null;
    }

    return value as StoredAssessmentData;
  } catch {
    return null;
  }
}

function ProgressRing({
  score,
  hasAssessment,
}: {
  score: number;
  hasAssessment: boolean;
}) {
  const radius = 82;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      className="relative size-52 sm:size-60"
      aria-label={hasAssessment ? `${score}% progress` : "Progress not tested"}
    >
      <svg className="size-full -rotate-90" viewBox="0 0 200 200" role="img">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#e7e4dc"
          strokeWidth="12"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#315c4b"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-semibold tracking-[-0.05em] text-[#183229]">
          {hasAssessment ? score : "N/A"}
        </span>
        <span className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-[#6f766f]">
          {hasAssessment ? "Target score" : "Not tested"}
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const storedAssessment = useSyncExternalStore(
    subscribeToAssessmentData,
    getAssessmentSnapshot,
    getServerAssessmentSnapshot,
  );
  const assessment = parseAssessmentData(storedAssessment);
  const hasPriorScores = assessment !== null;
  const overallScore = assessment?.overallScore ?? 0;

  return (
    <div className="min-h-screen bg-[#f4f2eb] text-[#1f2924]">
      <header className="border-b border-[#dcd9cf] bg-[#f8f7f2]/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#315c4b] text-sm font-bold tracking-wide text-white">
              A+
            </div>
            <div>
              <p className="font-semibold leading-tight tracking-tight">ASVAB Ready</p>
              <p className="text-xs text-[#747b76]">Cyber Career Prep</p>
            </div>
          </div>
          <div className="grid size-10 place-items-center rounded-full border border-[#d3d1c8] bg-white text-sm font-semibold text-[#315c4b]">
            JD
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.18em] text-[#8b6b3d]">
            Study dashboard
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.045em] text-[#183229] sm:text-5xl">
            {hasPriorScores
              ? "Keep moving toward your Cyber goal."
              : "Welcome to your Navy Cyber Prep. Let’s establish your baseline."}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#667069]">
            {hasPriorScores
              ? "Focus your practice across the four core subtests that shape your Armed Forces Qualification Test score."
              : "Take a short baseline assessment to identify your strongest topics and the areas where practice will help most."}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.35fr]">
          <section className="flex flex-col items-center justify-center rounded-[2rem] border border-[#dedbd1] bg-[#fcfbf7] px-6 py-10 shadow-[0_16px_45px_rgba(49,62,54,0.07)] sm:px-10">
            <div className="mb-7 text-center">
              <h2 className="text-xl font-semibold tracking-tight">Overall progress</h2>
              <p className="mt-1 text-sm text-[#727a74]">
                {hasPriorScores
                  ? "Cyber qualification target"
                  : "Baseline not established"}
              </p>
            </div>
            <ProgressRing
              score={overallScore}
              hasAssessment={hasPriorScores}
            />
            <div className="mt-8 flex w-full max-w-xs items-center justify-between border-t border-[#e3e0d7] pt-6 text-sm">
              <span className="text-[#727a74]">Current estimate</span>
              <span className="font-semibold text-[#315c4b]">
                {hasPriorScores ? `${overallScore} / 100` : "Not Tested"}
              </span>
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#dedbd1] bg-white p-6 shadow-[0_16px_45px_rgba(49,62,54,0.06)] sm:p-8">
            <div className="mb-7 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Core subtests</h2>
                <p className="mt-1 text-sm text-[#727a74]">Your mastery by subject</p>
              </div>
              <span className="hidden rounded-full bg-[#edf1ed] px-3 py-1.5 text-xs font-semibold text-[#476355] sm:block">
                4 subjects
              </span>
            </div>

            <div className="space-y-7">
              {subtests.map((subtest) => {
                const score =
                  assessment?.subtests[subtest.shortName as SubtestCode] ?? 0;

                return (
                  <div key={subtest.name}>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="grid size-10 shrink-0 place-items-center rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: subtest.color }}
                    >
                      {subtest.shortName}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="truncate text-sm font-semibold sm:text-base">
                          {subtest.name}
                        </h3>
                        <span className="text-sm font-bold" style={{ color: subtest.color }}>
                          {hasPriorScores ? `${score}%` : "N/A"}
                        </span>
                      </div>
                      <p className="mt-0.5 hidden text-xs text-[#818781] sm:block">
                        {subtest.description}
                      </p>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#eceae3]">
                    <div
                      className="h-full rounded-full transition-[width] duration-700"
                      style={{
                        width: `${score}%`,
                        backgroundColor: subtest.color,
                      }}
                    />
                  </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <section className="mt-6 flex flex-col items-start justify-between gap-6 rounded-[2rem] bg-[#183229] px-7 py-7 text-white sm:flex-row sm:items-center sm:px-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a9c3b7]">
              Today&apos;s focus
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              {hasPriorScores
                ? "Ready for a quick check-in?"
                : "Ready to find your starting point?"}
            </h2>
            <p className="mt-1 text-sm text-[#c6d3cd]">
              10 adaptive questions · About 12 minutes
            </p>
          </div>
          <Link
            href="/quiz"
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-[#e9b967] px-6 py-4 text-sm font-bold text-[#183229] shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-[#f2c77d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e9b967] sm:w-auto"
          >
            {hasPriorScores
              ? "Start Daily Assessment"
              : "Start Baseline Assessment"}
            <span
              aria-hidden="true"
              className="text-lg transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
