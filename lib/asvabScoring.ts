/**
 * Navy Cyber Warfare Technician (CWT) eligibility evaluation.
 *
 * Official qualification pathways (MyNavyHR, new accessions):
 *   1. GS + AR + 2(MK)      >= 239
 *   2. AR + MK + MC + VE    >= 239
 *   3. MK + CT + VE         >= 176, and CT >= 60
 *
 * VE (Verbal Expression) is derived from WK + PC. Note: on an official
 * ASVAB score report VE is a scaled composite rather than a raw sum, but
 * per this app's model we compute VE = WK + PC.
 */

export type AsvabScores = {
  /** General Science */
  GS: number;
  /** Arithmetic Reasoning */
  AR: number;
  /** Mathematics Knowledge */
  MK: number;
  /** Mechanical Comprehension */
  MC: number;
  /** Word Knowledge */
  WK: number;
  /** Paragraph Comprehension */
  PC: number;
  /** Cyber Test */
  CT: number;
};

export type PathwayResult = {
  /** Human-readable name, e.g. "GS + AR + 2MK" */
  name: string;
  /** The user's computed line score for this pathway */
  achieved: number;
  /** The minimum qualifying score */
  target: number;
  /** Points remaining to qualify (0 when met) */
  pointsAway: number;
  /** Whether this pathway's line score requirement is met */
  meetsLineScore: boolean;
  /** Whether every requirement of this pathway is met (incl. CT minimum) */
  qualified: boolean;
  /** Extra requirements beyond the line score, if any */
  notes?: string;
};

export type CyberEligibilityResult = {
  /** True if at least one pathway is fully satisfied */
  eligible: boolean;
  /** Computed Verbal Expression score (WK + PC) */
  VE: number;
  /** Breakdown of all three pathways, closest to qualifying first */
  pathways: PathwayResult[];
};

const CT_MINIMUM = 60;

export function evaluateNavyCyberEligibility(
  scores: AsvabScores,
): CyberEligibilityResult {
  const { GS, AR, MK, MC, WK, PC, CT } = scores;
  const VE = WK + PC;

  const pathway1 = buildPathway("GS + AR + 2MK", GS + AR + 2 * MK, 239);

  const pathway2 = buildPathway("AR + MK + MC + VE", AR + MK + MC + VE, 239);

  const pathway3Line = buildPathway("MK + CT + VE", MK + CT + VE, 176);
  const ctMet = CT >= CT_MINIMUM;
  const pathway3: PathwayResult = {
    ...pathway3Line,
    qualified: pathway3Line.meetsLineScore && ctMet,
    notes: ctMet
      ? `CT minimum of ${CT_MINIMUM} met (scored ${CT}).`
      : `Also requires CT >= ${CT_MINIMUM}; currently ${CT} (${CT_MINIMUM - CT} points short).`,
  };

  const pathways = [pathway1, pathway2, pathway3].sort(
    (a, b) => a.pointsAway - b.pointsAway,
  );

  return {
    eligible: pathways.some((p) => p.qualified),
    VE,
    pathways,
  };
}

function buildPathway(
  name: string,
  achieved: number,
  target: number,
): PathwayResult {
  const meetsLineScore = achieved >= target;
  return {
    name,
    achieved,
    target,
    pointsAway: Math.max(0, target - achieved),
    meetsLineScore,
    qualified: meetsLineScore,
  };
}

/**
 * Formats an eligibility result as user-facing summary lines, e.g. for
 * display in the dashboard or CLI output.
 */
export function describeEligibility(result: CyberEligibilityResult): string[] {
  const lines = [
    result.eligible
      ? "You currently qualify for the Navy CWT rating."
      : "You do not yet qualify for the Navy CWT rating.",
    `Verbal Expression (VE = WK + PC): ${result.VE}`,
  ];

  for (const pathway of result.pathways) {
    const status = pathway.qualified
      ? "QUALIFIED"
      : pathway.meetsLineScore
        ? "line score met, but not all requirements satisfied"
        : `${pathway.pointsAway} point${pathway.pointsAway === 1 ? "" : "s"} away`;
    let line = `${pathway.name}: ${pathway.achieved} / ${pathway.target} — ${status}`;
    if (pathway.notes) {
      line += ` (${pathway.notes})`;
    }
    lines.push(line);
  }

  return lines;
}
