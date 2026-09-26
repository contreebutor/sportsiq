import type {
  TriviaAnswerSelection,
  TriviaQuestionPayload,
  TriviaResultPayload,
} from "@/lib/triviaTypes";
import { type UserInfo } from "@/store/user";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { AnimatedAnswerButton } from "./AnimatedAnswerButton";
import { MAX_POINTS, type GamePhase } from "./constants";

interface QuestionScreenProps {
  phase: GamePhase;
  question: TriviaQuestionPayload;
  result: TriviaResultPayload | null;
  selectedAnswer: string | null;
  selections: TriviaAnswerSelection[];
  joinedGame: boolean;
  playerCount: number;
  lockedAtPoints: number | null;
  displayedPoints: number;
  multiplier: number;
  multiplierChosen: boolean;
  comebackActive: boolean;
  user: UserInfo | null;
  onAnswer: (answer: string) => void;
  onMultiplier: (m: number) => void;
}

const POINTS_PULSE_THRESHOLDS = [120, 90, 60, 40, 20, 10] as const;

export function QuestionScreen({
  phase,
  question,
  result,
  selectedAnswer,
  selections,
  joinedGame,
  playerCount,
  lockedAtPoints,
  displayedPoints,
  multiplier,
  multiplierChosen,
  comebackActive,
  user,
  onAnswer,
  onMultiplier,
}: QuestionScreenProps) {
  // Animations local to this phase:
  //  - pointsPulse: brief scale-up when the points countdown crosses a threshold
  //  - questionSlide/Opacity: slide-in on new question
  //  - streakOpacity: fades the "🔥 N in a row" pill
  //  - godModePulse: pulsing gold border at streak >= 3
  //  - pointsFloat: "+N IQ" number floating up on result
  const pointsPulse = useRef(new Animated.Value(1)).current;
  const lastThreshold = useRef(MAX_POINTS);

  const questionSlideX = useRef(new Animated.Value(0)).current;
  const questionOpacity = useRef(new Animated.Value(1)).current;

  const streakOpacity = useRef(new Animated.Value(0)).current;
  const godModePulse = useRef(new Animated.Value(0)).current;

  const pointsFloatY = useRef(new Animated.Value(0)).current;
  const pointsFloatOpacity = useRef(new Animated.Value(0)).current;
  const [floatPoints, setFloatPoints] = useState<{
    value: number;
    correct: boolean;
  } | null>(null);

  const [streak, setStreak] = useState(0);

  useEffect(() => {
    for (const t of POINTS_PULSE_THRESHOLDS) {
      if (lastThreshold.current > t && displayedPoints <= t) {
        lastThreshold.current = t;
        Animated.sequence([
          Animated.timing(pointsPulse, {
            toValue: 1.15,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(pointsPulse, {
            toValue: 1.0,
            duration: 80,
            useNativeDriver: true,
          }),
        ]).start();
        break;
      }
    }
  }, [displayedPoints, pointsPulse]);

  useEffect(() => {
    lastThreshold.current = MAX_POINTS;
  }, [question.questionNumber]);

  useEffect(() => {
    questionSlideX.setValue(40);
    questionOpacity.setValue(0.6);
    Animated.parallel([
      Animated.spring(questionSlideX, {
        toValue: 0,
        tension: 200,
        friction: 20,
        useNativeDriver: true,
      }),
      Animated.timing(questionOpacity, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [question.questionNumber, questionSlideX, questionOpacity]);

  useEffect(() => {
    if (!result || !user) return;
    const myRes = result.userResults.find((r) => r.userId === user.id);
    if (!myRes) return;

    if (myRes.correct) {
      setStreak((prev) => {
        const next = prev + 1;
        if (next >= 2) {
          Animated.timing(streakOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }
        return next;
      });
    } else {
      setStreak(0);
      Animated.timing(streakOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }

    // Multiplier M: bet = base × M. correct = base + bet, wrong = -bet.
    const base = lockedAtPoints ?? displayedPoints;
    const hasMulti = multiplierChosen && multiplier > 1;
    const bet = hasMulti ? base * multiplier : 0;
    const earnedValue = myRes.correct ? base + bet : hasMulti ? -bet : 0;

    setFloatPoints({
      value: earnedValue,
      correct: myRes.correct && earnedValue >= 0,
    });
    pointsFloatY.setValue(0);
    pointsFloatOpacity.setValue(1);
    Animated.parallel([
      Animated.timing(pointsFloatY, {
        toValue: -80,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.timing(pointsFloatOpacity, {
        toValue: 0,
        duration: 1200,
        useNativeDriver: true,
      }),
    ]).start(() => setFloatPoints(null));
  }, [result, user?.id]);

  useEffect(() => {
    if (phase === "question" && streak < 2) {
      streakOpacity.setValue(0);
    }
  }, [phase, streak, streakOpacity]);

  const godMode = streak >= 3;

  useEffect(() => {
    if (!godMode) {
      godModePulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(godModePulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(godModePulse, {
          toValue: 0.25,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [godMode, godModePulse]);

  const myResult =
    result && user
      ? result.userResults.find((r) => r.userId === user.id)
      : null;

  const timerFraction = displayedPoints / MAX_POINTS;
  const secsLeft = Math.ceil(displayedPoints / 10);
  // Driven by the value directly so we can pick a className token.
  const timerColorClass =
    timerFraction > 0.6
      ? "text-brand-purple-light"
      : timerFraction > 0.3
        ? "text-amber-500"
        : "text-red-500";
  const timerBarClass =
    timerFraction > 0.6
      ? "bg-brand-purple-light"
      : timerFraction > 0.3
        ? "bg-amber-500"
        : "bg-red-500";

  const totalSelections = selections.reduce((sum, s) => sum + s.count, 0);
  const showPercentage = selectedAnswer !== null || phase === "result";
  const showMultiplierPanel = selectedAnswer !== null && phase === "question";

  return (
    <View className="flex-1 bg-brand-bg">
      {godMode && (
        <Animated.View
          pointerEvents="none"
          className="absolute left-0 top-0 right-0 bottom-0 rounded-xl border-[3px] border-yellow-500 z-10"
          style={{ opacity: godModePulse }}
        />
      )}

      <View className="flex-1 px-3.5 pt-2.5 pb-3.5">
        {/* Question progress dots */}
        <View className="mb-1.5 flex-row gap-[3px]">
          {Array.from({ length: question.totalQuestions }).map((_, i) => {
            const idx = question.questionIndex - 1;
            const dotClass =
              i < idx
                ? "bg-green-500"
                : i === idx
                  ? "bg-brand-purple-light"
                  : "bg-white/10";
            return (
              <View
                key={i}
                className={`flex-1 h-[3px] rounded-[2px] ${dotClass}`}
              />
            );
          })}
        </View>

        {/* Timer row */}
        <View className="mb-1 flex-row items-center justify-between">
          <Text className="text-[11px] text-slate-400">
            Q{question.questionIndex} of {question.totalQuestions}
            {playerCount > 0 ? `  ·  ${playerCount}p` : ""}
          </Text>
          {phase !== "result" && (
            <Text className={`text-[11px] font-black ${timerColorClass}`}>
              {secsLeft}s left
            </Text>
          )}
        </View>

        {phase !== "result" && (
          <View className="mb-2 h-[3px] rounded-[2px] bg-white/[0.08]">
            <View
              className={`h-[3px] rounded-[2px] ${timerBarClass}`}
              style={{ width: `${(1 - timerFraction) * 100}%` as any }}
            />
          </View>
        )}

        {/* ⚡ IQ chip — replaced with an observer badge when the user didn't
            join this game (they're watching but can't earn IQ). */}
        {!joinedGame ? (
          <View className="mb-2 items-center">
            <View className="flex-row items-center gap-1.5 rounded-full border border-slate-400/35 bg-slate-400/10 px-3.5 py-1">
              <Text className="text-xs">👁</Text>
              <Text className="text-[11px] font-black tracking-widest text-slate-400">
                OBSERVING
              </Text>
              <Text className="text-[10px] text-slate-600">
                · join next game to play
              </Text>
            </View>
          </View>
        ) : (
          phase !== "result" && (
            <View className="mb-2 items-center">
              <Animated.View
                className={`flex-row items-center gap-1.5 rounded-full border bg-amber-500/10 px-3.5 py-1 ${
                  selectedAnswer ? "border-amber-500/60" : "border-amber-500/35"
                }`}
                style={{
                  transform: [{ scale: selectedAnswer ? 1 : pointsPulse }],
                }}
              >
                <Text className="text-xs">{selectedAnswer ? "🔒" : "⚡"}</Text>
                <Text className="text-base font-black text-amber-500">
                  {displayedPoints.toLocaleString()}
                </Text>
                <Text className="text-[10px] font-bold text-amber-500/80">
                  IQ
                </Text>
                <Text className="text-[10px] text-slate-600">↓</Text>
              </Animated.View>
            </View>
          )
        )}

        {streak >= 2 && (
          <Animated.View
            className="mb-1 self-center rounded-2xl bg-[#422006] px-3 py-[3px]"
            style={{ opacity: streakOpacity }}
          >
            <Text className="text-xs font-bold text-orange-400">
              🔥 {streak} in a row
            </Text>
          </Animated.View>
        )}

        {comebackActive && (
          <View className="mb-1 self-center rounded-2xl bg-[#7c2d12] px-3 py-[3px]">
            <Text className="text-xs font-bold text-orange-400">
              🔥 Comeback Mode · 1.5x
            </Text>
          </View>
        )}

        <Animated.View
          style={{
            transform: [{ translateX: questionSlideX }],
            opacity: questionOpacity,
          }}
        >
          <Text
            className={`mb-2.5 font-extrabold text-slate-50 ${
              phase === "result"
                ? "text-[15px] leading-[22px]"
                : "text-lg leading-[26px]"
            }`}
          >
            {question.question}
          </Text>
        </Animated.View>

        <View className="flex-1 gap-2">
          {question.answers.map((answer) => {
            const selectionData = selections.find((s) => s.answer === answer);
            const isSelected = selectedAnswer === answer;
            const isCorrect = result ? answer === result.correctAnswer : false;
            const isWrong = result ? isSelected && !isCorrect : false;
            const pct =
              totalSelections > 0 && selectionData
                ? (selectionData.count / totalSelections) * 100
                : 0;

            return (
              <AnimatedAnswerButton
                key={answer}
                answer={answer}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isWrong={isWrong}
                hasResult={!!result}
                selectionData={selectionData}
                lockedAtPoints={isSelected ? lockedAtPoints : null}
                onPress={() => onAnswer(answer)}
                disabled={phase !== "question"}
                percentage={pct}
                showPercentage={showPercentage}
              />
            );
          })}
        </View>

        {showMultiplierPanel && lockedAtPoints != null && (
          <View className="mt-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
            <Text className="mb-2.5 text-center text-[10px] font-extrabold uppercase tracking-[1.5px] text-amber-500">
              Risk multiplier?
            </Text>
            <View className="flex-row gap-2">
              {([1.5, 2, 3] as const).map((m) => {
                const isChosen = multiplierChosen && multiplier === m;
                const isDimmed = multiplierChosen && multiplier !== m;
                const stake = Math.round(lockedAtPoints * m);

                const tint =
                  m === 1.5
                    ? "green"
                    : m === 2
                      ? "amber"
                      : "red";

                const baseBg = isDimmed
                  ? "bg-white/[0.03]"
                  : tint === "green"
                    ? "bg-green-500/10"
                    : tint === "amber"
                      ? "bg-amber-500/15"
                      : "bg-red-500/10";

                const borderColor = isDimmed
                  ? "border-white/10"
                  : tint === "green"
                    ? "border-green-500/40"
                    : tint === "amber"
                      ? "border-amber-500"
                      : "border-red-500/40";

                const borderWidth =
                  isChosen || m === 2 ? "border-2" : "border";

                const labelColor = isDimmed
                  ? "text-slate-400"
                  : tint === "green"
                    ? "text-green-400"
                    : tint === "amber"
                      ? "text-amber-500"
                      : "text-red-300";

                const stakeColor = isDimmed
                  ? "text-slate-600"
                  : labelColor;

                return (
                  <Pressable
                    key={m}
                    onPress={() => !multiplierChosen && onMultiplier(m)}
                    className={`flex-1 items-center rounded-[10px] py-2.5 ${baseBg} ${borderWidth} ${borderColor} ${
                      isDimmed ? "opacity-40" : "opacity-100"
                    }`}
                  >
                    <Text
                      className={`text-xl font-black leading-[22px] ${labelColor}`}
                    >
                      {m}×{isChosen ? " ✓" : ""}
                    </Text>
                    <Text
                      className={`mt-[3px] text-[9px] font-bold opacity-85 ${stakeColor}`}
                    >
                      {stake.toLocaleString()} IQ
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {myResult &&
          (() => {
            const hasMultiplier = multiplierChosen && multiplier > 1;
            const baseEarned = lockedAtPoints ?? 0;
            const bet = hasMultiplier ? baseEarned * multiplier : 0;

            const baseDisplay = myResult.correct ? baseEarned : 0;
            const betDisplay = myResult.correct ? bet : -bet;
            const total = baseDisplay + betDisplay;
            const won = total > 0;
            const lost = total < 0;

            const totalColorClass = lost
              ? "text-red-500"
              : won
                ? "text-green-500"
                : "text-slate-400";

            const wrapperClass = lost
              ? "bg-red-500/[0.08] border-red-500/25"
              : won
                ? "bg-green-500/[0.08] border-green-500/25"
                : "bg-white/[0.04] border-white/[0.08]";

            const sign = (n: number) =>
              n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString();

            return (
              <View
                className={`mt-2.5 rounded-xl border p-3 ${wrapperClass}`}
              >
                <View
                  className={`flex-row items-center justify-between ${
                    hasMultiplier ? "mb-1.5" : ""
                  }`}
                >
                  <Text className="text-[13px] font-semibold text-slate-400">
                    {myResult.correct ? "✅ Base points" : "❌ Wrong answer"}
                  </Text>
                  <Text
                    className={`text-[13px] font-extrabold ${
                      myResult.correct ? "text-green-500" : "text-slate-400"
                    }`}
                  >
                    {myResult.correct
                      ? `+${baseEarned.toLocaleString()}`
                      : "0"}{" "}
                    IQ
                  </Text>
                </View>

                {hasMultiplier && (
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-[13px] font-semibold text-slate-400">
                      {multiplier}× bet
                    </Text>
                    <Text
                      className={`text-[13px] font-extrabold ${
                        betDisplay >= 0 ? "text-green-500" : "text-red-500"
                      }`}
                    >
                      {sign(betDisplay)} IQ
                    </Text>
                  </View>
                )}

                {hasMultiplier && (
                  <>
                    <View
                      className={`mb-2 h-px ${
                        lost ? "bg-red-500/20" : "bg-green-500/20"
                      }`}
                    />
                    <View className="flex-row items-center justify-between">
                      <Text className="text-[15px] font-black text-slate-50">
                        Total
                      </Text>
                      <Text
                        className={`text-lg font-black ${totalColorClass}`}
                      >
                        {sign(total)} IQ
                      </Text>
                    </View>
                  </>
                )}

                {!hasMultiplier && (
                  <View className="mt-1 items-center">
                    <Text
                      className={`text-[26px] font-black ${totalColorClass}`}
                    >
                      {myResult.correct
                        ? `+${baseEarned.toLocaleString()}`
                        : "0"}{" "}
                      IQ
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

        {phase === "result" && result?.funFact && (
          <View className="mt-2.5 rounded-[10px] border-l-[3px] border-brand-purple-light bg-white/[0.04] p-3">
            <Text className="mb-[3px] text-[10px] font-semibold uppercase tracking-[0.8px] text-slate-600">
              Did you know?
            </Text>
            <Text className="text-[13px] leading-[19px] text-slate-400">
              {result.funFact}
            </Text>
          </View>
        )}
      </View>

      {floatPoints && (
        <Animated.View
          pointerEvents="none"
          className="absolute left-0 right-0 top-[45%] items-center"
          style={{
            transform: [{ translateY: pointsFloatY }],
            opacity: pointsFloatOpacity,
          }}
        >
          <Text
            className={`text-4xl font-black ${
              floatPoints.correct ? "text-green-500" : "text-red-500"
            }`}
          >
            {floatPoints.value > 0
              ? `+${floatPoints.value.toLocaleString()}`
              : floatPoints.value === 0
                ? "0"
                : floatPoints.value.toLocaleString()}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
