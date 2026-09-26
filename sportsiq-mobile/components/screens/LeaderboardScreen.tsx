import CustomImg from "@/components/CustomImg";
import {
  type LeaderboardEntry,
  type LeaderboardResponse,
  fetchGlobalLeaderboard,
  fetchBarLeaderboard,
} from "@/lib/api";
import { type UserInfo } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";

const BRAND = {
  bg: "#050912",
  card: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  purpleFaint: "rgba(85,69,211,0.18)",
  purpleBorder: "rgba(85,69,211,0.45)",
  gold: "#F59E0B",
  goldFaint: "rgba(245,158,11,0.12)",
  meBg: "rgba(85,69,211,0.07)",
  text: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#64748B",
  rowDivider: "rgba(255,255,255,0.04)",
} as const;

type Tab = "friends" | "bar" | "global";

interface LeaderboardScreenProps {
  user: UserInfo | null;
}

const AVATAR_COLORS = ["#5545D3", "#228C88", "#F97316", "#7C3AED", "#0EA5E9"];

const MOCK_FRIENDS: (LeaderboardEntry & { record?: string })[] = [
  { rank: 1, userId: "mock-me", name: "You", avatarUrl: null, points: 2450, record: "Chiefs WIN · 2× · just now" },
  { rank: 2, userId: "mock-1", name: "Jake M.", avatarUrl: null, points: 2380, record: "Chiefs WIN · 1× · 2m ago" },
  { rank: 3, userId: "mock-2", name: "Sarah K.", avatarUrl: null, points: 2210, record: "Raiders WIN · 1× · 5m ago" },
  { rank: 4, userId: "mock-3", name: "Ryan T.", avatarUrl: null, points: 1950, record: "Playing trivia · 4m ago" },
];

export function LeaderboardScreen({ user }: LeaderboardScreenProps) {
  const [tab, setTab] = useState<Tab>("friends");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    let result: LeaderboardResponse | null = null;

    if (tab === "global") {
      result = await fetchGlobalLeaderboard(user?.id);
    } else if (tab === "bar") {
      result = await fetchBarLeaderboard(undefined, user?.id);
    } else {
      // Friends tab — mock data for Phase 4
      const friends = MOCK_FRIENDS.map((f) =>
        f.userId === "mock-me" && user
          ? { ...f, name: "You 🔥8", points: user.points ?? 2450 }
          : f
      );
      result = { leaderboard: friends, userRank: null };
    }

    setData(result);
    setLoading(false);
  }, [tab, user?.id, user?.points]);

  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);

  const renderRow = useCallback(
    ({ item }: { item: LeaderboardEntry & { record?: string } }) => {
      const isMe = item.userId === user?.id || item.userId === "mock-me";
      const colorIdx = Math.abs(item.userId.charCodeAt(item.userId.length - 1)) % AVATAR_COLORS.length;

      return (
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 10,
          paddingHorizontal: 16, paddingVertical: 10,
          backgroundColor: isMe ? BRAND.meBg : "transparent",
          borderBottomWidth: 1, borderBottomColor: BRAND.rowDivider,
        }}>
          {/* Rank */}
          <Text style={{ width: 22, fontSize: 11, fontWeight: "800", color: BRAND.faint, textAlign: "center" }}>
            {item.rank}
          </Text>

          {/* Avatar */}
          <View style={{
            width: 32, height: 32, borderRadius: 16, overflow: "hidden",
            backgroundColor: AVATAR_COLORS[colorIdx],
            alignItems: "center", justifyContent: "center",
          }}>
            {item.avatarUrl ? (
              <CustomImg uri={item.avatarUrl} width={32} height={32} />
            ) : (
              <Text style={{ fontSize: 11, fontWeight: "800", color: "white" }}>
                {isMe ? "Me" : item.name.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: "700", color: BRAND.text }}>{item.name}</Text>
            {(item as any).record && (
              <Text style={{ fontSize: 10, color: BRAND.faint }}>{(item as any).record}</Text>
            )}
          </View>

          {/* IQ */}
          <Text style={{ fontSize: 13, fontWeight: "900", color: BRAND.purpleLight }}>
            {item.points.toLocaleString()}
          </Text>
        </View>
      );
    },
    [user?.id]
  );

  // Podium component for Global tab
  const renderPodium = (entries: LeaderboardEntry[]) => {
    if (entries.length < 3) return null;
    const [first, second, third] = entries;

    const PodiumItem = ({
      entry, size, medal, place,
    }: {
      entry: LeaderboardEntry; size: number; medal: string; place: string;
    }) => {
      const colorIdx = Math.abs(entry.userId.charCodeAt(entry.userId.length - 1)) % AVATAR_COLORS.length;
      return (
        <View style={{ alignItems: "center", gap: 4 }}>
          <View style={{
            width: size, height: size, borderRadius: size / 2, overflow: "hidden",
            backgroundColor: AVATAR_COLORS[colorIdx],
            alignItems: "center", justifyContent: "center",
          }}>
            {entry.avatarUrl ? (
              <CustomImg uri={entry.avatarUrl} width={size} height={size} />
            ) : (
              <Text style={{ fontSize: size * 0.3, fontWeight: "800", color: "white" }}>
                {entry.name.slice(0, 2).toUpperCase()}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 9, fontWeight: "800", color: BRAND.faint }}>{medal} {place}</Text>
          <Text style={{ fontSize: 10, fontWeight: "700", color: BRAND.text }} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={{ fontSize: 11, fontWeight: "900", color: BRAND.purpleLight }}>
            {entry.points.toLocaleString()}
          </Text>
        </View>
      );
    };

    return (
      <View style={{
        flexDirection: "row", justifyContent: "center", alignItems: "flex-end",
        gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
      }}>
        {/* 3rd */}
        <PodiumItem entry={third} size={40} medal="🥉" place="3rd" />
        {/* 1st (tallest) */}
        <PodiumItem entry={first} size={52} medal="🥇" place="1st" />
        {/* 2nd */}
        <PodiumItem entry={second} size={44} medal="🥈" place="2nd" />
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      {/* Tab pills */}
      <View style={{
        flexDirection: "row", paddingHorizontal: 16, paddingBottom: 1,
        borderBottomWidth: 1, borderBottomColor: BRAND.cardBorder,
      }}>
        {(["friends", "bar", "global"] as Tab[]).map((t) => {
          const active = tab === t;
          const label = t === "friends" ? "👥 Friends" : t === "bar" ? "🍺 My Bar" : "🌎 Global";
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={{ flex: 1 }}>
              <View style={{
                paddingVertical: 10, alignItems: "center",
                borderBottomWidth: 2,
                borderBottomColor: active ? BRAND.purpleLight : "transparent",
              }}>
                <Text style={{
                  fontSize: 11, fontWeight: "700",
                  color: active ? BRAND.text : BRAND.faint,
                }}>
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={BRAND.purpleLight} />
        </View>
      ) : !data || data.leaderboard.length === 0 ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 28 }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: BRAND.purpleFaint, borderWidth: 1, borderColor: BRAND.purpleBorder,
            justifyContent: "center", alignItems: "center", marginBottom: 16,
          }}>
            <Ionicons name="trophy-outline" size={32} color={BRAND.purpleLight} />
          </View>
          <Text style={{ fontSize: 15, color: BRAND.muted, textAlign: "center", lineHeight: 22 }}>
            {tab === "friends"
              ? "Friends leaderboard coming soon!"
              : "No rankings yet. Play to get on the board!"}
          </Text>
        </View>
      ) : (
        <>
          {/* Podium for Global tab */}
          {tab === "global" && data.leaderboard.length >= 3 && renderPodium(data.leaderboard)}

          {/* User's own rank row for Global (if outside the list) */}
          {tab === "global" && data.userRank && !data.leaderboard.find((e) => e.userId === user?.id) && (
            <View style={{
              borderTopWidth: 1, borderTopColor: BRAND.cardBorder,
              backgroundColor: BRAND.meBg,
            }}>
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 10,
                paddingHorizontal: 16, paddingVertical: 10,
              }}>
                <Text style={{ width: 22, fontSize: 11, fontWeight: "800", color: BRAND.purpleLight, textAlign: "center" }}>
                  #{data.userRank.rank}
                </Text>
                <View style={{
                  width: 32, height: 32, borderRadius: 16, overflow: "hidden",
                  backgroundColor: BRAND.purple,
                  alignItems: "center", justifyContent: "center",
                }}>
                  {data.userRank.avatarUrl ? (
                    <CustomImg uri={data.userRank.avatarUrl} width={32} height={32} />
                  ) : (
                    <Text style={{ fontSize: 11, fontWeight: "800", color: "white" }}>You</Text>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: BRAND.text }}>You</Text>
                  <Text style={{ fontSize: 10, color: BRAND.faint }}>Top 8% this week</Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: "900", color: BRAND.purpleLight }}>
                  {data.userRank.points.toLocaleString()}
                </Text>
              </View>
            </View>
          )}

          {/* Leaderboard list (skip top 3 for global since they're in podium) */}
          <FlatList
            data={tab === "global" && data.leaderboard.length >= 3
              ? data.leaderboard.slice(3)
              : data.leaderboard}
            keyExtractor={(item) => item.userId}
            renderItem={renderRow}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        </>
      )}
    </View>
  );
}
