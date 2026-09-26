import type { TriviaAnswerSelection } from "@/lib/triviaTypes";
import { useEffect, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import CustomImg from "../CustomImg";

interface AnimatedAnswerButtonProps {
  answer: string;
  isSelected: boolean;
  isCorrect: boolean;
  isWrong: boolean;
  hasResult: boolean;
  selectionData: TriviaAnswerSelection | undefined;
  lockedAtPoints: number | null;
  onPress: () => void;
  disabled: boolean;
  percentage?: number;
  showPercentage?: boolean;
}

export function AnimatedAnswerButton({
  answer,
  isSelected,
  isCorrect,
  isWrong,
  hasResult,
  selectionData,
  lockedAtPoints,
  onPress,
  disabled,
  percentage,
  showPercentage,
}: AnimatedAnswerButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasResult || hasAnimated.current) return;
    hasAnimated.current = true;

    if (isCorrect) {
      Animated.sequence([
        Animated.spring(bounceAnim, {
          toValue: 1.04,
          tension: 300,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          tension: 300,
          friction: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }

    if (isWrong) {
      Animated.sequence(
        [-8, 8, -6, 6, -4, 4, 0].map((toValue) =>
          Animated.timing(shakeAnim, {
            toValue,
            duration: 57,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [hasResult, isCorrect, isWrong, bounceAnim, shakeAnim]);

  useEffect(() => {
    if (!hasResult) {
      hasAnimated.current = false;
      shakeAnim.setValue(0);
      bounceAnim.setValue(1);
    }
  }, [hasResult, shakeAnim, bounceAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 300,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  // State flags used by several tailwind class toggles below.
  const isCorrectRevealed = isCorrect && hasResult;
  const isSelectedUnrevealed = isSelected && !hasResult;

  const containerClass = [
    "justify-center overflow-hidden rounded-xl px-4",
    hasResult ? "min-h-[52px] py-2.5" : "min-h-[72px] py-4",
    isCorrectRevealed && "border-2 border-green-500 bg-green-900",
    isWrong && "border-2 border-red-500 bg-red-900",
    isSelectedUnrevealed &&
      "border border-l-4 border-slate-800 border-l-blue-500 bg-blue-900/60",
    !isCorrectRevealed && !isWrong && !isSelectedUnrevealed &&
      "border border-slate-800 bg-slate-800",
  ]
    .filter(Boolean)
    .join(" ");

  const fillBarClass = isSelected
    ? "bg-brand-purple/35"
    : isCorrectRevealed
      ? "bg-green-500/20"
      : "bg-white/[0.06]";

  const labelClass = [
    "flex-1 text-[15px]",
    isSelected ? "font-extrabold" : "font-semibold",
    isCorrectRevealed
      ? "text-green-400"
      : isWrong
        ? "text-red-300"
        : "text-slate-50",
  ].join(" ");

  return (
    <Animated.View
      style={{
        transform: [
          { scale: Animated.multiply(scaleAnim, bounceAnim) },
          { translateX: shakeAnim },
        ],
      }}
    >
      <Pressable
        className={containerClass}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        {showPercentage && percentage != null && percentage > 0 && (
          <View
            className={`absolute left-0 top-0 bottom-0 rounded-xl ${fillBarClass}`}
            style={{ width: `${percentage}%` as any }}
          />
        )}

        <View className="flex-row items-center gap-2">
          {hasResult && (isCorrect || isWrong) && (
            <Text className="text-base">{isCorrect ? "✅" : "❌"}</Text>
          )}
          <Text className={labelClass}>{answer}</Text>
          {showPercentage && percentage != null && (
            <Text
              className={`min-w-[32px] text-right text-[11px] font-bold ${
                isSelected ? "text-[#A89DF8]" : "text-slate-600"
              }`}
            >
              {Math.round(percentage)}%
            </Text>
          )}
        </View>

        {isSelectedUnrevealed && lockedAtPoints != null && (
          <Text className="mt-1 text-[11px] font-bold text-amber-500">
            ⚡ {lockedAtPoints.toLocaleString()} pts if you keep this
          </Text>
        )}

        {selectionData && selectionData.count > 0 && (
          <View className="mt-2.5 flex-row items-center">
            {selectionData.users.slice(0, 5).map((u, i) => (
              <View
                key={u.userId}
                className="w-7 h-7 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-800 items-center justify-center"
                style={i > 0 ? { marginLeft: -8 } : undefined}
              >
                <CustomImg
                  uri={u.avatarUrl ?? undefined}
                  width={28}
                  height={28}
                />
              </View>
            ))}
            {selectionData.count > 5 && (
              <View
                className="w-7 h-7 rounded-full bg-slate-700 border-2 border-slate-800 items-center justify-center"
                style={{ marginLeft: -8 }}
              >
                <Text className="text-[10px] font-bold text-slate-400">
                  +{selectionData.count - 5}
                </Text>
              </View>
            )}
            <Text className="text-xs text-slate-500 ml-2">
              {selectionData.count}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
