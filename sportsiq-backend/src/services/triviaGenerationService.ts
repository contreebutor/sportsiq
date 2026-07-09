import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config";
import { supabase } from "../utils/supabase";
import { wait } from "./generalService";

const anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });

const DAILY_GENERATION_COUNT = 50;
const MAX_QUESTIONS = 750;

// A question needs this many plays before its accuracy is trusted.
const MIN_SAMPLES_FOR_CALIBRATION = 20;
// Target difficulty band — questions outside this are candidates for rotation.
const SWEET_SPOT_LOW = 0.65;
const SWEET_SPOT_HIGH = 0.75;

// Difficulty tiers allowed in the prompt (never below 2 — no gimmes).
const TIER_MIN = 2;
const TIER_MAX = 4;
const TIER_DEFAULT = 3;

// Weighted category mix; also defines the allowed `category` values.
const CATEGORY_WEIGHTS: Array<{ name: string; percent: number }> = [
  { name: "Sports", percent: 40 },
  { name: "TV & Movies", percent: 30 },
  { name: "Music", percent: 10 },
  { name: "Pop Culture / Celebrities", percent: 10 },
  { name: "Food, Drinks & Brands", percent: 5 },
  { name: "Random Fun Facts", percent: 5 },
];

interface GeneratedQuestion {
  question: string;
  answers: string[];
  correct_answer: string;
  category: string;
  fun_fact: string;
}

interface CalibratedQuestion {
  question: string;
  category: string;
  accuracy: number;
}

/**
 * Worker loop: once per day, generate 50 fresh trivia questions via Claude
 * and rotate out the oldest 50.
 */
export const startTriviaGenerationWorker = async () => {
  while (true) {
    try {
      console.log("Trivia generation: checking schedule...");

      const shouldGenerate = await isDailyGenerationNeeded();
      if (shouldGenerate) {
        console.log(
          `Trivia generation: generating ${DAILY_GENERATION_COUNT} new questions...`
        );
        const questions = await generateQuestionsWithClaude();
        if (questions.length > 0) {
          await rotateQuestions(questions);
          console.log(
            `Trivia generation: rotated ${questions.length} questions successfully.`
          );
        }
      } else {
        console.log("Trivia generation: already generated today. Sleeping.");
      }
    } catch (error) {
      console.error("Error in trivia generation worker:", error);
    } finally {
      // Check once per hour; the guard prevents duplicate generation
      await wait(3600);
    }
  }
};

/**
 * Check if we already generated questions today by looking at the newest
 * question's created_at timestamp.
 */
const isDailyGenerationNeeded = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from("trivia_questions")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return true;
    }

    const lastCreated = new Date(data[0].created_at);
    const now = new Date();
    // If the last question was created today, skip
    return lastCreated.toDateString() !== now.toDateString();
  } catch {
    return true;
  }
};

/**
 * Average accuracy of the most-recently-generated batch, using only
 * questions that have enough plays to trust. Returns null if not enough
 * signal is available yet.
 */
const fetchLastBatchAccuracy = async (): Promise<number | null> => {
  const { data, error } = await supabase
    .from("trivia_questions")
    .select("accuracy, times_answered")
    .order("created_at", { ascending: false })
    .limit(DAILY_GENERATION_COUNT);

  if (error || !data) return null;

  const calibrated = data.filter(
    (q) =>
      (q.times_answered ?? 0) >= MIN_SAMPLES_FOR_CALIBRATION &&
      q.accuracy != null
  );

  if (calibrated.length < 10) return null;

  const sum = calibrated.reduce((acc, q) => acc + Number(q.accuracy), 0);
  return sum / calibrated.length;
};

/**
 * Map last-batch accuracy to a difficulty tier.
 *  > 75% correct → too easy, nudge harder (TIER_MAX)
 *  < 65% correct → too hard, nudge easier (TIER_MIN)
 *  otherwise → stay at the default tier
 */
const pickDifficultyTier = (batchAccuracy: number | null): number => {
  if (batchAccuracy === null) return TIER_DEFAULT;
  if (batchAccuracy > SWEET_SPOT_HIGH) return TIER_MAX;
  if (batchAccuracy < SWEET_SPOT_LOW) return TIER_MIN;
  return TIER_DEFAULT;
};

/**
 * Pull sample questions from three accuracy buckets so Claude can calibrate
 * against real play data: mimic sweet-spot questions, avoid too-easy/too-hard ones.
 */
const fetchCalibrationExemplars = async (): Promise<{
  sweetSpot: CalibratedQuestion[];
  tooEasy: CalibratedQuestion[];
  tooHard: CalibratedQuestion[];
}> => {
  const mapRow = (row: {
    question: string;
    category: string;
    accuracy: number | string;
  }): CalibratedQuestion => ({
    question: row.question,
    category: row.category,
    accuracy: Number(row.accuracy),
  });

  const [sweet, easy, hard] = await Promise.all([
    supabase
      .from("trivia_questions")
      .select("question, category, accuracy")
      .gte("times_answered", MIN_SAMPLES_FOR_CALIBRATION)
      .gte("accuracy", SWEET_SPOT_LOW)
      .lte("accuracy", SWEET_SPOT_HIGH)
      .limit(5),
    supabase
      .from("trivia_questions")
      .select("question, category, accuracy")
      .gte("times_answered", MIN_SAMPLES_FOR_CALIBRATION)
      .gt("accuracy", 0.9)
      .limit(3),
    supabase
      .from("trivia_questions")
      .select("question, category, accuracy")
      .gte("times_answered", MIN_SAMPLES_FOR_CALIBRATION)
      .lt("accuracy", 0.3)
      .limit(3),
  ]);

  return {
    sweetSpot: (sweet.data ?? []).map(mapRow),
    tooEasy: (easy.data ?? []).map(mapRow),
    tooHard: (hard.data ?? []).map(mapRow),
  };
};

const formatExemplars = (qs: CalibratedQuestion[]): string =>
  qs
    .map(
      (q) =>
        `  - [${q.category}, ${Math.round(q.accuracy * 100)}% correct] ${q.question}`
    )
    .join("\n");

/**
 * Call Claude to generate fresh trivia questions.
 */
const generateQuestionsWithClaude = async (): Promise<GeneratedQuestion[]> => {
  const [batchAccuracy, exemplars] = await Promise.all([
    fetchLastBatchAccuracy(),
    fetchCalibrationExemplars(),
  ]);
  const { sweetSpot, tooEasy, tooHard } = exemplars;
  const tier = pickDifficultyTier(batchAccuracy);

  const categoryBreakdown = CATEGORY_WEIGHTS.map(
    (c) =>
      `- ${c.name} — ${c.percent}% (~${Math.round(
        (c.percent / 100) * DAILY_GENERATION_COUNT
      )} questions)`
  ).join("\n");
  const categoryNames = CATEGORY_WEIGHTS.map((c) => c.name).join(", ");

  const tierExplanation =
    batchAccuracy === null
      ? `Not enough play data yet — target tier ${tier}/10.`
      : `Last batch averaged ${Math.round(
          batchAccuracy * 100
        )}% correct, so target tier ${tier}/10 (${
          tier > TIER_DEFAULT
            ? "batch was too easy — go harder"
            : tier < TIER_DEFAULT
            ? "batch was too hard — go easier"
            : "batch was well-calibrated — hold steady"
        }).`;

  const calibrationSection =
    sweetSpot.length + tooEasy.length + tooHard.length > 0
      ? `

Calibration exemplars from past play data:
${
  sweetSpot.length > 0
    ? `\nMIMIC the style and difficulty of these well-calibrated questions:\n${formatExemplars(
        sweetSpot
      )}\n`
    : ""
}${
          tooEasy.length > 0
            ? `\nAVOID questions this easy (too many players got them right):\n${formatExemplars(
                tooEasy
              )}\n`
            : ""
        }${
          tooHard.length > 0
            ? `\nAVOID questions this hard (too few players got them right):\n${formatExemplars(
                tooHard
              )}\n`
            : ""
        }`
      : "";

  const prompt = `Generate exactly ${DAILY_GENERATION_COUNT} trivia questions as a JSON array.

AUDIENCE
Bar-screen trivia played in public venues. Skew the vibe toward women 21–50 and guys who aren't sports experts — fun for everyone, not just hardcore sports fans.

SCHEMA (per question)
- "question": the trivia question text
- "answers": an array of exactly 4 answer choices (strings)
- "correct_answer": the correct answer (must exactly match one of the answers)
- "category": one of these exact strings: ${categoryNames}
- "fun_fact": a brief fun fact related to the answer

CATEGORY MIX (target distribution across the ${DAILY_GENERATION_COUNT} questions)
${categoryBreakdown}

DIFFICULTY
Target tier ${tier} on a 1–10 scale (where 1 = gimme, 10 = expert). Stay within tiers ${TIER_MIN}–${TIER_MAX}; never produce tier 1 (no gimmes). Aim so roughly ${Math.round(
    SWEET_SPOT_LOW * 100
  )}–${Math.round(SWEET_SPOT_HIGH * 100)}% of the target audience would answer correctly.
${tierExplanation}

QUALITY RULES
- Prefer surprising answers and specific details over generic facts
- Wrong answers must be plausible — not joke answers or obviously wrong
- Favor recent and iconic material people will actually recognize
- Avoid obscure dates, deep jargon, and insider stats
- Avoid gimmes (anything most people would get without thinking)

OUTPUT
Return ONLY the JSON array, no markdown fences or other text.${calibrationSection}`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON array from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error("Trivia generation: could not parse JSON from response");
      return [];
    }

    const parsed: GeneratedQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate structure
    return parsed.filter(
      (q) =>
        q.question &&
        Array.isArray(q.answers) &&
        q.answers.length === 4 &&
        q.correct_answer &&
        q.answers.includes(q.correct_answer) &&
        q.category &&
        q.fun_fact
    );
  } catch (error) {
    console.error("Trivia generation: Claude API error:", error);
    return [];
  }
};

/**
 * Pick which questions to retire. Prefers questions that are miscalibrated
 * (accuracy far outside the sweet-spot band, with enough samples to trust).
 * Falls back to oldest questions if fewer than `count` miscalibrated ones exist.
 */
const selectQuestionsToRetire = async (
  count: number
): Promise<Array<{ id: number; no: number }>> => {
  const { data: calibrated, error: calibratedError } = await supabase
    .from("trivia_questions")
    .select("id, no, accuracy")
    .gte("times_answered", MIN_SAMPLES_FOR_CALIBRATION);

  if (calibratedError) {
    console.error(
      "Trivia generation: could not fetch calibrated questions:",
      calibratedError.message
    );
  }

  const miscalibrated = (calibrated ?? [])
    .map((q) => {
      const accuracy = Number(q.accuracy);
      const distance = Math.max(
        0,
        SWEET_SPOT_LOW - accuracy,
        accuracy - SWEET_SPOT_HIGH
      );
      return { id: q.id as number, no: q.no as number, distance };
    })
    .filter((q) => q.distance > 0)
    .sort((a, b) => b.distance - a.distance)
    .slice(0, count);

  const selected: Array<{ id: number; no: number }> = miscalibrated.map(
    ({ id, no }) => ({ id, no })
  );

  if (selected.length >= count) return selected;

  const selectedIds = new Set(selected.map((q) => q.id));
  const { data: oldest, error: oldestError } = await supabase
    .from("trivia_questions")
    .select("id, no")
    .order("created_at", { ascending: true })
    .limit(count + selected.length);

  if (oldestError) {
    console.error(
      "Trivia generation: could not fetch oldest questions:",
      oldestError.message
    );
    return selected;
  }

  for (const q of oldest ?? []) {
    if (selected.length >= count) break;
    if (selectedIds.has(q.id as number)) continue;
    selected.push({ id: q.id as number, no: q.no as number });
  }

  return selected;
};

/**
 * Retire the worst-calibrated N questions, then insert new ones with the
 * freed `no` values.
 */
const rotateQuestions = async (
  newQuestions: GeneratedQuestion[]
): Promise<void> => {
  const count = newQuestions.length;

  const toRetire = await selectQuestionsToRetire(count);

  if (toRetire.length === 0) {
    console.error("Trivia generation: could not select questions to retire");
    return;
  }

  const freedNos = toRetire.map((q) => q.no);
  const oldestIDs = toRetire.map((q) => q.id);

  const { error: deleteError } = await supabase
    .from("trivia_questions")
    .delete()
    .in("id", oldestIDs);

  if (deleteError) {
    console.error("Trivia generation: delete error:", deleteError.message);
    return;
  }

  // If we don't have enough freed nos (e.g. table has fewer than count rows),
  // generate new ones up to MAX_QUESTIONS
  while (freedNos.length < count) {
    const { count: totalCount } = await supabase
      .from("trivia_questions")
      .select("id", { count: "exact", head: true });
    freedNos.push((totalCount ?? 0) + freedNos.length + 1);
  }

  // Insert new questions with the freed `no` values
  const rows = newQuestions.map((q, i) => ({
    no: freedNos[i],
    question: q.question,
    answers: q.answers,
    correct_answer: q.correct_answer,
    category: q.category,
    fun_fact: q.fun_fact,
    profile_tags: [],
  }));

  const { error: insertError } = await supabase
    .from("trivia_questions")
    .insert(rows);

  if (insertError) {
    console.error("Trivia generation: insert error:", insertError.message);
  }
};
