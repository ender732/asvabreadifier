import type {
  DrillQuestion,
  DrillSubject,
} from "@/lib/adaptiveDrill";

type RandomSource = () => number;

type VocabularyEntry = {
  word: string;
  definition: string;
  context: string;
  distractors: [string, string, string];
};

export const ASVAB_VOCABULARY: VocabularyEntry[] = [
  { word: "abate", definition: "become less intense", context: "The network traffic began to abate after the update.", distractors: ["increase suddenly", "remain constant", "become visible"] },
  { word: "amplify", definition: "increase in strength", context: "The antenna will amplify the weak signal.", distractors: ["measure precisely", "divide evenly", "conceal completely"] },
  { word: "ambiguous", definition: "open to more than one meaning", context: "The ambiguous command confused both operators.", distractors: ["highly accurate", "physically fragile", "strictly prohibited"] },
  { word: "anomalous", definition: "deviating from what is normal", context: "Analysts investigated the anomalous login pattern.", distractors: ["carefully planned", "widely accepted", "easily repeated"] },
  { word: "arduous", definition: "requiring great effort", context: "Restoring every damaged file was an arduous task.", distractors: ["brief and simple", "entirely optional", "poorly organized"] },
  { word: "austere", definition: "severely simple or strict", context: "The remote station had austere living conditions.", distractors: ["luxurious and ornate", "temporary and unsafe", "crowded and noisy"] },
  { word: "bolster", definition: "support or strengthen", context: "The new firewall will bolster network security.", distractors: ["inspect for damage", "reduce in size", "replace without testing"] },
  { word: "candid", definition: "honest and direct", context: "Her candid assessment identified every weakness.", distractors: ["secretive and vague", "angry and reckless", "formal and lengthy"] },
  { word: "coherent", definition: "logical and consistent", context: "The technician gave a coherent explanation of the failure.", distractors: ["brief but inaccurate", "complex and hidden", "repeated without reason"] },
  { word: "concise", definition: "brief but complete", context: "The incident report was concise yet informative.", distractors: ["uncertain in meaning", "excessively detailed", "unsupported by evidence"] },
  { word: "corroborate", definition: "confirm with supporting evidence", context: "A second log helped corroborate the initial finding.", distractors: ["reject without review", "summarize from memory", "change after approval"] },
  { word: "diligent", definition: "careful and persistent", context: "Diligent monitoring revealed the subtle intrusion.", distractors: ["naturally talented", "quick but careless", "quietly uncertain"] },
  { word: "discern", definition: "recognize or distinguish", context: "The sensor could discern a real signal from noise.", distractors: ["combine permanently", "transmit rapidly", "remove completely"] },
  { word: "emulate", definition: "imitate or reproduce", context: "The test system can emulate a hostile network.", distractors: ["disable remotely", "measure indirectly", "protect physically"] },
  { word: "feasible", definition: "possible and practical", context: "The team determined that the repair was feasible.", distractors: ["certain to fail", "legally required", "already completed"] },
  { word: "frugal", definition: "careful with resources", context: "The frugal design used little power or storage.", distractors: ["technically advanced", "wasteful and costly", "temporary by nature"] },
  { word: "impede", definition: "slow or obstruct", context: "Damaged cables could impede data transmission.", distractors: ["verify completely", "speed up gradually", "record automatically"] },
  { word: "implicit", definition: "suggested but not directly stated", context: "The warning carried an implicit request to disconnect.", distractors: ["written in detail", "proven to be false", "unrelated to the issue"] },
  { word: "mitigate", definition: "make less severe", context: "Backups mitigate the damage caused by data loss.", distractors: ["predict exactly", "make permanent", "expose publicly"] },
  { word: "novice", definition: "a person new to a field", context: "The interface was simple enough for a novice.", distractors: ["certified expert", "project supervisor", "outside observer"] },
  { word: "obsolete", definition: "no longer useful or current", context: "The obsolete protocol was removed from every device.", distractors: ["difficult to obtain", "newly developed", "temporarily unavailable"] },
  { word: "pragmatic", definition: "focused on practical results", context: "They chose a pragmatic solution that could deploy today.", distractors: ["based on theory alone", "needlessly complicated", "guided by emotion"] },
  { word: "prudent", definition: "showing careful judgment", context: "Creating a backup first was the prudent choice.", distractors: ["bold but unsafe", "required by custom", "simple to reverse"] },
  { word: "redundant", definition: "unnecessarily repeated", context: "The editor removed redundant lines from the report.", distractors: ["critical to success", "difficult to interpret", "arranged by priority"] },
  { word: "resilient", definition: "able to recover quickly", context: "A resilient network remained available after the failure.", distractors: ["easy to replace", "resistant to change", "limited in capacity"] },
  { word: "scrutinize", definition: "examine very closely", context: "Investigators scrutinize each access record.", distractors: ["delete immediately", "copy from memory", "approve automatically"] },
  { word: "sporadic", definition: "occurring at irregular intervals", context: "The sporadic outages were difficult to reproduce.", distractors: ["continuous and steady", "planned in advance", "limited to one device"] },
  { word: "stringent", definition: "strict and demanding", context: "The facility enforces stringent access controls.", distractors: ["flexible and informal", "old but reliable", "simple to understand"] },
  { word: "tenacious", definition: "persistent and determined", context: "The tenacious analyst continued until she found the flaw.", distractors: ["easily distracted", "naturally cautious", "quietly cooperative"] },
  { word: "ubiquitous", definition: "present almost everywhere", context: "Wireless devices are ubiquitous in modern offices.", distractors: ["rarely permitted", "difficult to detect", "identical in design"] },
  { word: "validate", definition: "confirm accuracy or legitimacy", context: "Always validate the checksum before installation.", distractors: ["estimate the cost", "hide the result", "reverse the process"] },
  { word: "volatile", definition: "likely to change suddenly", context: "Data in volatile memory disappears without power.", distractors: ["stable for years", "easy to compress", "safe to distribute"] },
];

export function generateAsvabQuestion(
  subject: DrillSubject,
  skillTag: string,
  random: RandomSource = Math.random,
): DrillQuestion {
  if (subject === "MK" && skillTag === "Algebra") {
    return generateAlgebraQuestion(random);
  }
  if (
    subject === "AR" &&
    (skillTag === "Percentages" || skillTag === "Word Problems")
  ) {
    return generatePercentageQuestion(skillTag, random);
  }
  if (
    subject === "WK" &&
    (skillTag === "Context Clues" || skillTag === "Synonyms")
  ) {
    return generateVocabularyQuestion(skillTag, random);
  }

  throw new Error(`Unsupported ASVAB question target: ${subject} - ${skillTag}`);
}

function generateAlgebraQuestion(random: RandomSource): DrillQuestion {
  const coefficient = randomInt(2, 9, random);
  const solution = randomInt(2, 15, random);
  const usesAddition = random() >= 0.5;
  const constant = usesAddition
    ? randomInt(2, 18, random)
    : randomInt(2, Math.min(18, coefficient * solution - 1), random);
  const result = usesAddition
    ? coefficient * solution + constant
    : coefficient * solution - constant;
  const operator = usesAddition ? "+" : "−";
  const inverse = usesAddition ? "subtract" : "add";
  const afterInverse = coefficient * solution;

  const choices = numericChoices(
    solution,
    [
      Math.abs(Math.round((result + (usesAddition ? constant : -constant)) / coefficient)),
      Math.abs(result - constant),
      Math.max(1, Math.round(result / coefficient)),
    ],
    random,
  );

  return makeQuestion({
    subject: "MK",
    tag: "Algebra",
    prompt: `Solve for x: ${coefficient}x ${operator} ${constant} = ${result}`,
    choices,
    correctValue: solution,
    random,
    explanation: {
      coreConcept:
        "Isolate x by reversing the operations applied to it while performing the same move on both sides.",
      steps: [
        {
          equation: `${coefficient}x ${operator} ${constant} = ${result}`,
          description: "Begin with the generated equation.",
        },
        {
          equation: `${coefficient}x = ${afterInverse}`,
          description: `${capitalize(inverse)} ${constant} on both sides to undo the constant term.`,
        },
        {
          equation: `x = ${afterInverse} ÷ ${coefficient} = ${solution}`,
          description: `Divide both sides by ${coefficient} to isolate x.`,
        },
      ],
      commonPitfall: `The distractors model common inverse-operation and skipped-division errors. ${capitalize(inverse)} ${constant} before dividing by ${coefficient}.`,
      masteryRule:
        "Undo addition or subtraction first; then undo multiplication or division.",
    },
  });
}

function generatePercentageQuestion(
  tag: string,
  random: RandomSource,
): DrillQuestion {
  const template = randomInt(0, 4, random);
  const percentages = [10, 20, 25, 40, 50, 60, 75, 80];
  const percent = pick(percentages, random);
  const base = pick([40, 60, 80, 100, 120, 160, 200], random);

  if (template === 0) {
    const blocked = (percent * base) / 100;
    return percentageAmountQuestion(
      tag,
      `A cyber team successfully blocks ${percent}% of ${base} network attacks. How many attacks did it block?`,
      percent,
      base,
      blocked,
      "attacks",
      random,
    );
  }

  if (template === 1) {
    const price = pick([40, 60, 80, 120, 160, 200], random);
    const discountPercent = pick([10, 20, 25, 50], random);
    const discount = (price * discountPercent) / 100;
    const salePrice = price - discount;
    return makeQuestion({
      subject: "AR",
      tag,
      prompt: `A replacement drive costs $${price} and is discounted ${discountPercent}%. What is the sale price?`,
      choices: numericChoices(
        salePrice,
        [discount, price + discount, price - discountPercent],
        random,
        "$",
      ),
      correctValue: salePrice,
      random,
      explanation: {
        coreConcept:
          "A discount is the portion removed from the original price, so find that portion and subtract it.",
        steps: [
          { equation: `${discountPercent}% = ${discountPercent / 100}`, description: "Convert the percent to a decimal." },
          { equation: `$${price} × ${discountPercent / 100} = $${discount}`, description: "Calculate the discount amount." },
          { equation: `$${price} − $${discount} = $${salePrice}`, description: "Subtract the discount from the original price." },
        ],
        commonPitfall:
          "One distractor is the discount alone. The question asks for the price remaining after the discount.",
        masteryRule: "Sale price = original price − discount amount.",
      },
    });
  }

  if (template === 2) {
    const total = pick([40, 50, 80, 100, 120, 200], random);
    const rate = pick([20, 25, 40, 50, 60, 75, 80], random);
    const passed = (total * rate) / 100;
    return makeQuestion({
      subject: "AR",
      tag,
      prompt: `A diagnostic checks ${total} devices and ${passed} pass. What percentage passed?`,
      choices: numericChoices(rate, [100 - rate, rate + 10, Math.max(5, rate - 10)], random, "", "%"),
      correctValue: rate,
      random,
      explanation: {
        coreConcept:
          "A percent compares the successful part with the total whole.",
        steps: [
          { equation: `${passed} ÷ ${total} = ${passed / total}`, description: "Divide the part by the whole." },
          { equation: `${passed / total} × 100 = ${rate}%`, description: "Convert the decimal to a percentage." },
        ],
        commonPitfall:
          "Reversing part and whole can produce a value above 100%. Put the number that passed over the total tested.",
        masteryRule: "Percent = part ÷ whole × 100.",
      },
    });
  }

  const increasePercent = pick([10, 20, 25, 50], random);
  const original = pick([40, 80, 100, 120, 200], random);
  const increase = (original * increasePercent) / 100;
  const newValue = original + increase;
  const noun = template === 3 ? "storage capacity" : "servers installed";
  const prompt =
    template === 3
      ? `A system's ${noun} increases from ${original} TB to ${newValue} TB. What is the percent increase?`
      : `A technician installs ${original} servers on Monday and ${newValue} on Tuesday. What percent more were installed Tuesday?`;

  return makeQuestion({
    subject: "AR",
    tag,
    prompt,
    choices: numericChoices(
      increasePercent,
      [increase, Math.round((increase / newValue) * 100), increasePercent + 10],
      random,
      "",
      "%",
    ),
    correctValue: increasePercent,
    random,
    explanation: {
      coreConcept:
        "Percent increase compares the amount of change with the original value.",
      steps: [
        { equation: `${newValue} − ${original} = ${increase}`, description: "Find the amount of increase." },
        { equation: `${increase} ÷ ${original} = ${increase / original}`, description: "Compare the change with the original value." },
        { equation: `${increase / original} × 100 = ${increasePercent}%`, description: "Convert to a percentage." },
      ],
      commonPitfall:
        "Dividing by the new value uses the wrong reference point. Percent change always uses the original value.",
      masteryRule: "Percent change = change ÷ original × 100.",
    },
  });
}

function percentageAmountQuestion(
  tag: string,
  prompt: string,
  percent: number,
  total: number,
  answer: number,
  unit: string,
  random: RandomSource,
): DrillQuestion {
  return makeQuestion({
    subject: "AR",
    tag,
    prompt,
    choices: numericChoices(
      answer,
      [total - answer, percent, answer + Math.max(2, total / 10)],
      random,
      "",
      ` ${unit}`,
    ),
    correctValue: answer,
    random,
    explanation: {
      coreConcept:
        "To find a percentage of a total, convert the percentage to a decimal and multiply by the whole.",
      steps: [
        { equation: `${percent}% = ${percent / 100}`, description: "Convert the percent to decimal form." },
        { equation: `${percent / 100} × ${total} = ${answer}`, description: "Multiply the rate by the total." },
      ],
      commonPitfall:
        "Subtracting from the total finds the unblocked remainder, not the requested blocked portion.",
      masteryRule: "The word “of” in a percent problem means multiply.",
    },
  });
}

function generateVocabularyQuestion(
  tag: string,
  random: RandomSource,
): DrillQuestion {
  const entry = pick(ASVAB_VOCABULARY, random);
  const choices = shuffle(
    [entry.definition, ...entry.distractors],
    random,
  );
  const prompt =
    tag === "Context Clues"
      ? `${entry.context} In this sentence, “${entry.word}” most nearly means:`
      : `“${entry.word}” most nearly means:`;

  return {
    id: uniqueId("WK", tag, random),
    subject: "WK",
    tag,
    prompt,
    options: choices,
    correctIndex: choices.indexOf(entry.definition),
    explanation: {
      coreConcept:
        tag === "Context Clues"
          ? "Use the sentence’s concrete clues to infer a meaning that makes the entire statement logical."
          : "Reduce the target word to its central meaning, then select the choice that preserves it.",
      steps: [
        {
          description:
            tag === "Context Clues"
              ? `Read the full context: ${entry.context}`
              : `Recall or infer the central meaning of “${entry.word}.”`,
        },
        {
          description: `The best definition is “${entry.definition}.”`,
        },
        {
          description:
            "Substitute that definition into the sentence and confirm that the meaning remains coherent.",
        },
      ],
      commonPitfall:
        "The distractors are plausible in a technical setting, but they do not preserve the word’s meaning in this context.",
      masteryRule:
        "Test each choice in the sentence; the correct meaning must fit every context clue.",
    },
  };
}

function makeQuestion({
  subject,
  tag,
  prompt,
  choices,
  correctValue,
  random,
  explanation,
}: {
  subject: DrillSubject;
  tag: string;
  prompt: string;
  choices: string[];
  correctValue: number;
  random: RandomSource;
  explanation: DrillQuestion["explanation"];
}): DrillQuestion {
  const correctIndex = choices.findIndex(
    (choice) => Number(choice.replace(/[^0-9.-]/g, "")) === correctValue,
  );
  return {
    id: uniqueId(subject, tag, random),
    subject,
    tag,
    prompt,
    options: choices,
    correctIndex,
    explanation,
  };
}

function numericChoices(
  correct: number,
  proposedDistractors: number[],
  random: RandomSource,
  prefix = "",
  suffix = "",
): string[] {
  const values = new Set<number>([cleanNumber(correct)]);
  for (const value of proposedDistractors) {
    if (Number.isFinite(value) && value >= 0) values.add(cleanNumber(value));
  }
  let offset = 1;
  while (values.size < 4) {
    values.add(cleanNumber(correct + offset));
    offset += 1;
  }
  return shuffle(
    [...values]
      .slice(0, 4)
      .map((value) => `${prefix}${value}${suffix}`),
    random,
  );
}

function cleanNumber(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomInt(min: number, max: number, random: RandomSource): number {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(items: readonly T[], random: RandomSource): T {
  return items[randomInt(0, items.length - 1, random)];
}

function shuffle<T>(items: T[], random: RandomSource): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapWith = randomInt(0, index, random);
    [result[index], result[swapWith]] = [result[swapWith], result[index]];
  }
  return result;
}

function uniqueId(
  subject: DrillSubject,
  tag: string,
  random: RandomSource,
): string {
  return `${subject}-${tag.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}-${randomInt(100000, 999999, random)}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

