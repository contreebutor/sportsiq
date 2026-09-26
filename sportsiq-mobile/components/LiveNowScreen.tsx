/**
 * LiveNowScreen — visual polish pass (mark/claude-ui)
 * Logic: unchanged from Isaac's original
 * Changes: SportsIQ brand colors, countdown circle, avatar dots, styled buttons
 */
import { fetchGameStatus, type GameStatusResponse } from "@/lib/api";
import { type UserInfo } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, Text, View } from "react-native";

const POLL_INTERVAL_MS = 5_000;

const BRAND = {
  bg: "#050912",
  card: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  purpleFaint: "rgba(85,69,211,0.18)",
  purpleBorder: "rgba(85,69,211,0.45)",
  green: "#22C55E",
  greenFaint: "rgba(34,197,94,0.14)",
  greenBorder: "rgba(34,197,94,0.35)",
  red: "#EF4444",
  redFaint: "rgba(239,68,68,0.14)",
  text: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#475569",
} as const;

// Mock avatar colors for player count display
const AVATAR_COLORS = ["#5545D3", "#228C88", "#F97316", "#7C3AED", "#0EA5E9"];

interface LiveNowScreenProps {
  user: UserInfo | null;
  onJoinTrivia: () => void;
  onPlayWithFriends: () => void;
}

export function LiveNowScreen({
  user,
  onJoinTrivia,
  onPlayWithFriends,
}: LiveNowScreenProps) {
  const [status, setStatus] = useState<GameStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // ── All logic below is Isaac's original — do not modify ──────────────

  const fetchStatus = useCallback(async () => {
    const data = await fetchGameStatus();
    setStatus(data);
    setLoading(false);
    if (data) {
      if (data.phase === "lobby") {
        setCountdown(data.lobbyCountdown);
      } else if (data.nextGameIn > 0) {
        setCountdown(data.nextGameIn);
      }
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [fetchStatus]);

  useEffect(() => {
    if (countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchStatus();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [countdown > 0, fetchStatus]);

  useEffect(() => {
    if (!status || status.phase !== "lobby") return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status?.phase === "lobby", pulseAnim]);

  // ── Loading ───────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BRAND.bg }}>
        <ActivityIndicator size="large" color={BRAND.purpleLight} />
      </View>
    );
  }

  const isLive = status?.phase === "question" || status?.phase === "result";
  const isLobby = status?.phase === "lobby";
  const isStartingSoon = isLobby && countdown <= 30;
  const isComingUp = !isLive && !isStartingSoon && countdown > 0;
  const playerCount = status?.playerCount ?? 0;

  // ── STATE: Game LIVE or starting in < 30s ────────────────────────────

  if (isLive || isStartingSoon) {
    const countdownLabel = isLive
      ? `Q${status!.questionIndex}/${status!.totalQuestions}`
      : formatTime(countdown);
    const subLabel = isLive ? "Trivia game in progress" : `Starting in ${countdown}s`;

    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, backgroundColor: BRAND.bg }}>

        {/* LIVE badge */}
        {isLive && (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 7,
            backgroundColor: BRAND.redFaint,
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
            marginBottom: 28,
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: BRAND.red }} />
            <Text style={{ color: BRAND.red, fontWeight: "800", fontSize: 13, letterSpacing: 1 }}>LIVE NOW</Text>
          </View>
        )}

        {/* Countdown circle */}
        <View style={{
          width: 100, height: 100, borderRadius: 50,
          borderWidth: 3, borderColor: BRAND.purpleLight,
          backgroundColor: BRAND.purpleFaint,
          justifyContent: "center", alignItems: "center",
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: countdownLabel.length > 4 ? 18 : 32, fontWeight: "900", color: BRAND.purpleLight, fontVariant: ["tabular-nums"] }}>
            {countdownLabel}
          </Text>
        </View>

        <Text style={{ fontSize: 16, fontWeight: "700", color: BRAND.text, marginBottom: 4, textAlign: "center" }}>
          Sports Trivia
        </Text>

        <Text style={{ fontSize: 13, color: BRAND.muted, marginBottom: 20, textAlign: "center" }}>
          {subLabel}
        </Text>

        {/* Player count with avatar dots */}
        {playerCount > 0 && (
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 10,
            backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.cardBorder,
            borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
            marginBottom: 28,
          }}>
            <View style={{ flexDirection: "row" }}>
              {AVATAR_COLORS.slice(0, Math.min(playerCount, 4)).map((color, idx) => (
                <View key={idx} style={{
                  width: 22, height: 22, borderRadius: 11,
                  backgroundColor: color,
                  borderWidth: 1.5, borderColor: BRAND.bg,
                  marginLeft: idx === 0 ? 0 : -5,
                }} />
              ))}
            </View>
            <Text style={{ fontSize: 12, color: BRAND.muted, fontWeight: "600" }}>
              {playerCount} {playerCount === 1 ? "player" : "players"} waiting
            </Text>
          </View>
        )}

        {/* JOIN button */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }], width: "100%" }}>
          <Pressable
            onPress={onJoinTrivia}
            style={{
              borderRadius: 16, paddingVertical: 18, alignItems: "center",
              backgroundColor: BRAND.purple,
              shadowColor: BRAND.purple, shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4, shadowRadius: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", letterSpacing: 0.5 }}>
              {isLive ? "Join Now" : "Ready — Join"}
            </Text>
          </Pressable>
        </Animated.View>

        {/* Play with Friends link */}
        <Pressable onPress={onPlayWithFriends} style={{ marginTop: 18, paddingVertical: 10 }}>
          <Text style={{ color: BRAND.purpleLight, fontSize: 14, fontWeight: "600" }}>
            Play with Friends
          </Text>
        </Pressable>

      </View>
    );
  }

  // ── STATE: Coming up (1–15 min) ───────────────────────────────────────

  if (isComingUp) {
    const minutes = Math.ceil(countdown / 60);
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, backgroundColor: BRAND.bg }}>

        {/* Clock icon in purple circle */}
        <View style={{
          width: 72, height: 72, borderRadius: 36,
          backgroundColor: BRAND.purpleFaint, borderWidth: 1, borderColor: BRAND.purpleBorder,
          justifyContent: "center", alignItems: "center", marginBottom: 20,
        }}>
          <Ionicons name="time-outline" size={32} color={BRAND.purpleLight} />
        </View>

        <Text style={{ fontSize: 26, fontWeight: "900", color: BRAND.text, textAlign: "center", marginBottom: 6 }}>
          Trivia in {minutes} min
        </Text>

        <Text style={{ fontSize: 14, color: BRAND.muted, textAlign: "center", marginBottom: 28, lineHeight: 21 }}>
          Get ready — the next game is coming up soon.
        </Text>

        {/* IQ balance card */}
        {user && (
          <View style={{
            backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.cardBorder,
            borderRadius: 12, paddingHorizontal: 18, paddingVertical: 12,
            flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 28,
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND.purpleLight }} />
            <Text style={{ color: BRAND.text, fontWeight: "700", fontSize: 14 }}>
              {(user.points ?? 0).toLocaleString()} IQ
            </Text>
          </View>
        )}

        {/* Play with Friends */}
        <Pressable
          onPress={onPlayWithFriends}
          style={{
            backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.cardBorder,
            borderRadius: 14, paddingVertical: 15, paddingHorizontal: 28,
            flexDirection: "row", alignItems: "center", gap: 8,
          }}
        >
          <Ionicons name="people-outline" size={18} color={BRAND.purpleLight} />
          <Text style={{ color: BRAND.purpleLight, fontSize: 15, fontWeight: "700" }}>
            Play with Friends
          </Text>
        </Pressable>

      </View>
    );
  }

  // ── STATE: Idle (no game scheduled) ─────────────────────────────────

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28, backgroundColor: BRAND.bg }}>

      {/* Brain icon in faint circle */}
      <View style={{
        width: 72, height: 72, borderRadius: 36,
        backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.cardBorder,
        justifyContent: "center", alignItems: "center", marginBottom: 20,
      }}>
        <Ionicons name="game-controller-outline" size={32} color={BRAND.faint} />
      </View>

      <Text style={{ fontSize: 22, fontWeight: "800", color: BRAND.text, textAlign: "center", marginBottom: 8 }}>
        No game right now
      </Text>

      <Text style={{ fontSize: 14, color: BRAND.muted, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
        Check back soon for the next trivia game, or start a private game with friends.
      </Text>

      <Pressable
        onPress={onPlayWithFriends}
        style={{
          backgroundColor: BRAND.purple,
          borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32,
          flexDirection: "row", alignItems: "center", gap: 8,
        }}
      >
        <Ionicons name="people-outline" size={18} color="#fff" />
        <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
          Play with Friends
        </Text>
      </Pressable>

    </View>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, "0")}`;
  return String(s);
}
