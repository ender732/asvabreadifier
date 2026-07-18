import type { AsvabScores } from "@/lib/asvabScoring";

export type DrillSubject = "AR" | "MK" | "WK";

export type DrillQuestion = {
  id: string;
  subject: DrillSubject;
  tag: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: {
    coreConcept: string;
    steps: Array<{
      equation?: string;
      description: string;
    }>;
    commonPitfall: string;
    masteryRule: string;
  };
};

export type TagPerformance = {
  subject: DrillSubject;
  tag: string;
  attempts: number;
  correct: number;
};

export const DAILY_QUESTION_LIMIT = 10;
export const CWT_LINE_SCORE_TARGET = 239;

/**
 * Returns the stronger of the two CWT pathways that use the 239 target.
 * VE follows this app's WK + PC model.
 */
export function getBestCwt239LineScore(scores: AsvabScores): {
  score: number;
  formula: "GS + AR + 2MK" | "AR + MK + MC + VE";
} {
  const first = scores.GS + scores.AR + 2 * scores.MK;
  const second =
    scores.AR + scores.MK + scores.MC + scores.WK + scores.PC;

  return first >= second
    ? { score: first, formula: "GS + AR + 2MK" }
    : { score: second, formula: "AR + MK + MC + VE" };
}

export function getTagAccuracy(performance: TagPerformance): number {
  return performance.attempts === 0
    ? 0
    : performance.correct / performance.attempts;
}

/**
 * Picks the next skill target. A missed tag is forced first; otherwise,
 * 70% of the ranking comes from tag weakness and 30% from CWT formula impact.
 * The question generator uses this target to create a new variation.
 */
export function selectNextDrillTarget({
  performance,
  retryTag,
}: {
  performance: TagPerformance[];
  retryTag: string | null;
}): Pick<TagPerformance, "subject" | "tag"> | null {
  if (retryTag) {
    const repeatedTarget = performance.find((item) => item.tag === retryTag);
    if (repeatedTarget) {
      return { subject: repeatedTarget.subject, tag: repeatedTarget.tag };
    }
  }

  const nextTarget = [...performance].sort((a, b) => {
    const weaknessA = 1 - getTagAccuracy(a);
    const weaknessB = 1 - getTagAccuracy(b);

    // MK has double impact in GS + AR + 2MK; AR and WK each affect a
    // qualifying pathway. This is deliberately only 30% of the ranking.
    const impact = (subject: DrillSubject) =>
      subject === "MK" ? 1 : subject === "AR" ? 0.75 : 0.6;
    const priorityA = 0.7 * weaknessA + 0.3 * impact(a.subject);
    const priorityB = 0.7 * weaknessB + 0.3 * impact(b.subject);

    return priorityB - priorityA;
  })[0];

  return nextTarget
    ? { subject: nextTarget.subject, tag: nextTarget.tag }
    : null;
}

/**
 * Practice-only projection: each correct response adds one point to the
 * related subtest. It does not replace an official ASVAB score report.
 */
export function projectScoresAfterAnswer(
  scores: AsvabScores,
  subject: DrillSubject,
  correct: boolean,
): AsvabScores {
  if (!correct) return scores;
  return { ...scores, [subject]: Math.min(99, scores[subject] + 1) };
}

