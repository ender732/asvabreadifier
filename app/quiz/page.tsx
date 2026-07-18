"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CWT_LINE_SCORE_TARGET,
  DAILY_QUESTION_LIMIT,
  getBestCwt239LineScore,
  getTagAccuracy,
  projectScoresAfterAnswer,
  selectNextDrillTarget,
  type DrillQuestion,
  type TagPerformance,
} from "@/lib/adaptiveDrill";
import type { AsvabScores } from "@/lib/asvabScoring";
import { generateAsvabQuestion } from "@/lib/questionGenerator";

const INITIAL_SCORES: AsvabScores = {
  GS: 58,
  AR: 56,
  MK: 58,
  MC: 50,
  WK: 35,
  PC: 34,
  CT: 58,
};

const INITIAL_PERFORMANCE: TagPerformance[] = [
  { subject: "MK", tag: "Algebra", attempts: 4, correct: 1 },
  { subject: "AR", tag: "Percentages", attempts: 4, correct: 1 },
  { subject: "AR", tag: "Word Problems", attempts: 5, correct: 2 },
  { subject: "WK", tag: "Synonyms", attempts: 5, correct: 3 },
  { subject: "WK", tag: "Context Clues", attempts: 5, correct: 2 },
];

function generateFreshQuestion(
  subject: TagPerformance["subject"],
  tag: string,
  usedPrompts: Set<string>,
): DrillQuestion {
  let question = generateAsvabQuestion(subject, tag);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (!usedPrompts.has(question.prompt)) return question;
    question = generateAsvabQuestion(subject, tag);
  }
  return question;
}

export default function AdaptiveCwtDrill() {
  const [scores, setScores] = useState(INITIAL_SCORES);
  const [performance, setPerformance] = useState(INITIAL_PERFORMANCE);
  const [question, setQuestion] = useState<DrillQuestion | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [finished, setFinished] = useState(false);
  const [usedPrompts, setUsedPrompts] = useState<Set<string>>(new Set());

  const lineScore = getBestCwt239LineScore(scores);
  const answered = selectedIndex !== null;
  const isCorrect = question
    ? selectedIndex === question.correctIndex
    : false;
  const targetReached = lineScore.score >= CWT_LINE_SCORE_TARGET;
  const drillLimitReached = questionNumber >= DAILY_QUESTION_LIMIT;

  const failingTags = useMemo(
    () =>
      [...performance]
        .filter((item) => getTagAccuracy(item) < 0.7)
        .sort((a, b) => getTagAccuracy(a) - getTagAccuracy(b)),
    [performance],
  );

  function chooseAnswer(index: number) {
    if (!question || answered) return;

    const correct = index === question.correctIndex;
    setSelectedIndex(index);
    setResults((current) => [...current, correct]);
    setScores((current) =>
      projectScoresAfterAnswer(current, question.subject, correct),
    );
    setPerformance((current) =>
      current.map((item) =>
        item.tag === question.tag
          ? {
              ...item,
              attempts: item.attempts + 1,
              correct: item.correct + (correct ? 1 : 0),
            }
          : item,
      ),
    );
  }

  function continueDrill() {
    if (!question || !answered) return;
    if (targetReached || drillLimitReached) {
      setFinished(true);
      return;
    }

    const nextTarget = selectNextDrillTarget({
      performance,
      retryTag: isCorrect ? null : question.tag,
    });

    if (!nextTarget) {
      setFinished(true);
      return;
    }

    const nextQuestion = generateFreshQuestion(
      nextTarget.subject,
      nextTarget.tag,
      usedPrompts,
    );
    setQuestion(nextQuestion);
    setUsedPrompts((current) => new Set(current).add(nextQuestion.prompt));
    setQuestionNumber((current) => current + 1);
    setSelectedIndex(null);
  }

  function startDrill() {
    const target = selectNextDrillTarget({
      performance: INITIAL_PERFORMANCE,
      retryTag: null,
    });
    if (target) {
      const firstQuestion = generateFreshQuestion(
        target.subject,
        target.tag,
        new Set(),
      );
      setQuestion(firstQuestion);
      setUsedPrompts(new Set([firstQuestion.prompt]));
    }
  }

  function restartDrill() {
    setScores(INITIAL_SCORES);
    setPerformance(INITIAL_PERFORMANCE);
    setQuestionNumber(1);
    setSelectedIndex(null);
    setResults([]);
    setFinished(false);
    setUsedPrompts(new Set());
    const target = selectNextDrillTarget({
      performance: INITIAL_PERFORMANCE,
      retryTag: null,
    });
    const firstQuestion = target
      ? generateFreshQuestion(target.subject, target.tag, new Set())
      : null;
    setQuestion(firstQuestion);
    if (firstQuestion) setUsedPrompts(new Set([firstQuestion.prompt]));
  }

  if (!question) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f4f2eb] px-5 py-10 text-[#1f2924]">
        <section className="w-full max-w-xl rounded-[2rem] border border-[#dedbd1] bg-white p-8 text-center shadow-[0_18px_50px_rgba(49,62,54,0.08)] sm:p-12">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#edf1ed] text-xl font-bold text-[#315c4b]">
            10
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.16em] text-[#8b6b3d]">
            Adaptive CWT drill
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#183229]">
            Fresh questions, targeted to you.
          </h1>
          <p className="mt-3 leading-7 text-[#667069]">
            Every question is generated when you need it from your weakest
            skill tags. Miss one, and the next question will be a new
            variation of that same skill.
          </p>
          <button
            type="button"
            onClick={startDrill}
            className="mt-8 rounded-2xl bg-[#183229] px-7 py-4 text-sm font-bold text-white transition hover:bg-[#284a3e]"
          >
            Generate my first question →
          </button>
          <Link
            href="/"
            className="mt-5 block text-sm font-semibold text-[#657069] hover:text-[#183229]"
          >
            Return to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f2eb] px-5 py-7 text-[#1f2924] sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#526058] transition hover:text-[#183229]"
          >
            <span aria-hidden="true">←</span>
            Dashboard
          </Link>
          <span className="rounded-full border border-[#d8d5cc] bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#667069]">
            Adaptive CWT drill
          </span>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
          <aside className="space-y-5 lg:sticky lg:top-8">
            <section className="rounded-3xl bg-[#183229] p-6 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a9c3b7]">
                Projected line score
              </p>
              <div className="mt-3 flex items-end gap-2">
                <span className="text-5xl font-semibold tracking-[-0.06em]">
                  {lineScore.score}
                </span>
                <span className="pb-1.5 text-sm text-[#b8c9c1]">
                  / {CWT_LINE_SCORE_TARGET}
                </span>
              </div>
              <p className="mt-3 text-xs leading-5 text-[#b8c9c1]">
                {lineScore.formula}
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#e9b967] transition-[width] duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      (lineScore.score / CWT_LINE_SCORE_TARGET) * 100,
                    )}%`,
                  }}
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-[#a9bdb4]">
                Practice projection only. Official eligibility uses your
                verified ASVAB scores.
              </p>
            </section>

            <section className="rounded-3xl border border-[#dedbd1] bg-white p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-[#183229]">Weak skill tags</h2>
                <span className="text-xs text-[#777f79]">70% priority</span>
              </div>
              <div className="mt-4 space-y-3">
                {failingTags.length === 0 ? (
                  <p className="text-sm text-[#5f6a64]">No failing tags remain.</p>
                ) : (
                  failingTags.map((item) => {
                    const accuracy = Math.round(getTagAccuracy(item) * 100);
                    return (
                      <div key={item.tag}>
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="font-semibold">
                            {item.subject} · {item.tag}
                          </span>
                          <span className="text-[#8b5d52]">{accuracy}%</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-[#ece9e1]">
                          <div
                            className="h-full rounded-full bg-[#bd725f] transition-[width]"
                            style={{ width: `${accuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          </aside>

          <section>
            <div className="mb-5">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-[#315c4b]">
                  Question {Math.min(questionNumber, DAILY_QUESTION_LIMIT)} of{" "}
                  {DAILY_QUESTION_LIMIT}
                </span>
                <span className="text-[#737b75]">
                  {results.filter(Boolean).length} correct ·{" "}
                  {results.filter((result) => !result).length} incorrect
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#dedcd4]">
                <div
                  className="h-full rounded-full bg-[#315c4b] transition-[width] duration-500"
                  style={{
                    width: `${(questionNumber / DAILY_QUESTION_LIMIT) * 100}%`,
                  }}
                />
              </div>
            </div>

            {finished ? (
              <section className="rounded-[2rem] border border-[#dedbd1] bg-white p-8 text-center shadow-[0_18px_50px_rgba(49,62,54,0.08)] sm:p-12">
                <div className="mx-auto grid size-16 place-items-center rounded-full bg-[#edf6f1] text-3xl text-[#315c4b]">
                  {targetReached ? "✓" : "↻"}
                </div>
                <h1 className="mt-6 text-3xl font-semibold tracking-tight text-[#183229]">
                  {targetReached
                    ? "Projected target reached"
                    : "Daily drill complete"}
                </h1>
                <p className="mx-auto mt-3 max-w-lg leading-7 text-[#667069]">
                  {targetReached
                    ? `Your practice projection reached ${lineScore.score}. Keep reviewing weak tags before your verified ASVAB attempt.`
                    : `Your projection is ${lineScore.score}. The next drill will continue prioritizing your lowest-accuracy tags.`}
                </p>
                <button
                  type="button"
                  onClick={restartDrill}
                  className="mt-8 rounded-2xl bg-[#183229] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#284a3e]"
                >
                  Start another drill
                </button>
              </section>
            ) : (
              <section className="rounded-[2rem] border border-[#dedbd1] bg-white p-6 shadow-[0_18px_50px_rgba(49,62,54,0.08)] sm:p-10">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#edf1ed] px-3 py-1 text-xs font-bold text-[#315c4b]">
                    {question.subject}
                  </span>
                  <span className="rounded-full bg-[#f8eee0] px-3 py-1 text-xs font-bold text-[#8b6130]">
                    {question.tag}
                  </span>
                  {answered && !isCorrect && (
                    <span className="rounded-full bg-[#fff0ed] px-3 py-1 text-xs font-bold text-[#a25143]">
                      Repeating this tag next
                    </span>
                  )}
                </div>

                <h1 className="mt-5 text-2xl font-semibold leading-snug tracking-[-0.025em] text-[#183229] sm:text-3xl">
                  {question.prompt}
                </h1>

                <div
                  className="mt-8 grid gap-3"
                  role="radiogroup"
                  aria-label="Answer choices"
                >
                  {question.options.map((option, index) => {
                    const selected = selectedIndex === index;
                    const correctOption = index === question.correctIndex;
                    const showCorrect = answered && correctOption;
                    const showWrong = answered && selected && !correctOption;

                    return (
                      <button
                        key={option}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={answered}
                        onClick={() => chooseAnswer(index)}
                        className={`flex min-h-16 items-center gap-4 rounded-2xl border px-4 py-3 text-left transition sm:px-5 ${
                          showCorrect
                            ? "border-[#4b816a] bg-[#edf6f1] text-[#234c3c]"
                            : showWrong
                              ? "border-[#b65f51] bg-[#fff1ee] text-[#783a31]"
                              : "border-[#ddd9cf] bg-[#fcfbf8] hover:border-[#879a90] hover:bg-white"
                        }`}
                      >
                        <span
                          className={`grid size-9 shrink-0 place-items-center rounded-full border text-sm font-bold ${
                            showCorrect
                              ? "border-[#4b816a] bg-[#4b816a] text-white"
                              : showWrong
                                ? "border-[#b65f51] bg-[#b65f51] text-white"
                                : "border-[#cbc8be] bg-white text-[#59625d]"
                          }`}
                        >
                          {showCorrect
                            ? "✓"
                            : showWrong
                              ? "×"
                              : String.fromCharCode(65 + index)}
                        </span>
                        <span className="font-medium">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {answered && isCorrect && (
                  <div
                    className="mt-7 rounded-2xl border border-[#c5ded2] bg-[#f0f7f3] p-5"
                    aria-live="polite"
                  >
                    <h2 className="font-semibold text-[#183229]">
                      Correct — your projection increased.
                    </h2>
                  </div>
                )}

                {answered && !isCorrect && (
                  <article
                    className="mt-7 overflow-hidden rounded-3xl border border-[#dfc6bf] bg-[#fffdfb]"
                    aria-live="polite"
                  >
                    <header className="border-b border-[#ead8d3] bg-[#fff3ef] px-5 py-5 sm:px-7">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a25143]">
                        Guided correction
                      </p>
                      <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#183229]">
                        Let’s rebuild this one together.
                      </h2>
                      <p className="mt-2 text-sm text-[#776963]">
                        Correct answer:{" "}
                        <strong>{question.options[question.correctIndex]}</strong>
                      </p>
                    </header>

                    <div className="divide-y divide-[#ebe5df] px-5 sm:px-7">
                      <section className="py-6">
                        <div className="flex items-start gap-4">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8eee9] text-sm font-bold text-[#315c4b]">
                            1
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68736d]">
                              The Core Concept · The Why
                            </p>
                            <p className="mt-2 leading-7 text-[#3f4944]">
                              {question.explanation.coreConcept}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="py-6">
                        <div className="flex items-start gap-4">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#e8eee9] text-sm font-bold text-[#315c4b]">
                            2
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#68736d]">
                              Step-by-Step Breakdown
                            </p>
                            <ol className="mt-4 space-y-4">
                              {question.explanation.steps.map((step, index) => (
                                <li
                                  key={`${step.equation ?? step.description}-${index}`}
                                  className="grid gap-2 sm:grid-cols-[2rem_1fr]"
                                >
                                  <span className="grid size-7 place-items-center rounded-full border border-[#d8d5cc] bg-white text-xs font-bold text-[#657069]">
                                    {index + 1}
                                  </span>
                                  <div>
                                    {step.equation && (
                                      <div className="mb-2 overflow-x-auto rounded-xl border border-[#e3e0d8] bg-[#f8f7f3] px-4 py-3">
                                        <code className="whitespace-nowrap font-mono text-base font-semibold text-[#183229]">
                                          {step.equation}
                                        </code>
                                      </div>
                                    )}
                                    <p className="text-sm leading-6 text-[#59625d]">
                                      {step.description}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          </div>
                        </div>
                      </section>

                      <section className="py-6">
                        <div className="flex items-start gap-4">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#f7e7e2] text-sm font-bold text-[#a25143]">
                            3
                          </span>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9b5145]">
                              The Common Pitfall · Catching the Error
                            </p>
                            <p className="mt-2 text-sm font-semibold text-[#684c45]">
                              You chose{" "}
                              “{question.options[selectedIndex ?? 0]}.”
                            </p>
                            <p className="mt-2 leading-7 text-[#5d5652]">
                              {question.explanation.commonPitfall}
                            </p>
                          </div>
                        </div>
                      </section>

                      <section className="py-6">
                        <div className="flex items-start gap-4">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[#fff0cb] text-sm font-bold text-[#8b641f]">
                            4
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7d672f]">
                              Mastery Rule · The Takeaway
                            </p>
                            <div className="mt-3 rounded-2xl border border-[#ead69b] bg-[#fff7dd] px-4 py-4 font-semibold leading-7 text-[#5c4a20]">
                              💡 {question.explanation.masteryRule}
                            </div>
                          </div>
                        </div>
                      </section>
                    </div>
                  </article>
                )}

                {answered && (
                  <div className="mt-7 flex justify-end">
                    <button
                      type="button"
                      onClick={continueDrill}
                      className="rounded-2xl bg-[#183229] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#284a3e]"
                    >
                      {targetReached || drillLimitReached
                        ? "View drill results"
                        : isCorrect
                          ? "Next priority question →"
                          : `Try another ${question.tag} variation →`}
                    </button>
                  </div>
                )}
              </section>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

