import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import type { FeaturedPickItem } from "./types";

const LOCK_AMBER = "#F59E0B";

export interface PickRowProps {
  pick: FeaturedPickItem;
  onChoose: (choice: "yes" | "no") => void;
}

const BRAND = {
  card: "#0D1124",
  cardBorder: "rgba(255,255,255,0.08)",
  cardInner: "rgba(255,255,255,0.04)",
  green: "#22C55E",
  greenBorder: "rgba(34,197,94,0.45)",
  greenSelected: "rgba(34,197,94,0.22)",
  red: "#EF4444",
  redBorder: "rgba(239,68,68,0.45)",
  redSelected: "rgba(239,68,68,0.22)",
  text: "#F8FAFC",
  muted: "#94A3B8",
} as const;

export function PickRow({ pick, onChoose }: PickRowProps) {
  const resolved = pick.status === "resolved";
  const live = pick.status === "live";
  const locked = resolved || live;
  const userChoice = pick.user_pick;
  const correct = pick.correct_answer;

  const yesStyle = buttonStyle({
    choice: "yes",
    userChoice,
    correct,
    resolved,
  });
  const noStyle = buttonStyle({
    choice: "no",
    userChoice,
    correct,
    resolved,
  });

  return (
    <View
      style={{
        backgroundColor: BRAND.card,
        borderWidth: 1,
        borderColor: BRAND.cardBorder,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <Text
          style={{
            flex: 1,
            fontSize: 16,
            fontWeight: "800",
            color: BRAND.text,
            lineHeight: 22,
          }}
        >
          {pick.pick_question}
        </Text>
        {live && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: "rgba(245,158,11,0.15)",
              borderWidth: 1,
              borderColor: "rgba(245,158,11,0.45)",
            }}
          >
            <Ionicons name="lock-closed" size={10} color={LOCK_AMBER} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: "800",
                color: LOCK_AMBER,
                letterSpacing: 0.5,
              }}
            >
              LOCKED
            </Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => !locked && onChoose("yes")}
          disabled={locked}
          style={{ flex: 1 }}
        >
          <View style={yesStyle.container}>
            <Text style={yesStyle.label}>Yes</Text>
            {resolved && correct === "yes" && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={BRAND.green}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
        </Pressable>
        <Pressable
          onPress={() => !locked && onChoose("no")}
          disabled={locked}
          style={{ flex: 1 }}
        >
          <View style={noStyle.container}>
            <Text style={noStyle.label}>No</Text>
            {resolved && correct === "no" && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={BRAND.green}
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
        </Pressable>
      </View>

      {resolved && userChoice && (
        <Text
          style={{
            fontSize: 12,
            fontWeight: "700",
            color: userChoice === correct ? BRAND.green : BRAND.red,
            marginTop: 10,
            textAlign: "center",
          }}
        >
          {userChoice === correct ? "You won this pick" : "You lost this pick"}
        </Text>
      )}
    </View>
  );
}

function buttonStyle({
  choice,
  userChoice,
  correct,
  resolved,
}: {
  choice: "yes" | "no";
  userChoice: "yes" | "no" | null;
  correct: "yes" | "no" | null;
  resolved: boolean;
}) {
  const isYes = choice === "yes";
  const selected = userChoice === choice;
  const base = isYes ? BRAND.green : BRAND.red;
  const selectedBg = isYes ? BRAND.greenSelected : BRAND.redSelected;
  const selectedBorder = isYes ? BRAND.greenBorder : BRAND.redBorder;

  let backgroundColor: string = BRAND.cardInner;
  let borderColor: string = BRAND.cardBorder;
  let borderWidth = 1;
  let labelColor: string = BRAND.muted;

  if (selected) {
    backgroundColor = selectedBg;
    borderColor = selectedBorder;
    borderWidth = 2;
    labelColor = base;
  }
  if (resolved && correct === choice) {
    borderColor = BRAND.greenBorder;
    borderWidth = 2;
  }

  return {
    container: {
      flexDirection: "row" as const,
      backgroundColor,
      borderWidth,
      borderColor,
      borderRadius: 12,
      paddingVertical: 14,
      justifyContent: "center" as const,
      alignItems: "center" as const,
      opacity: resolved && !selected && correct !== choice ? 0.5 : 1,
    },
    label: {
      fontSize: 16,
      fontWeight: "800" as const,
      color: labelColor,
    },
  };
}
