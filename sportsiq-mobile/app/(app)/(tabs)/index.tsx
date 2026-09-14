import { PlayScreen } from "@/components/screens/PlayScreen";
import { LeaderboardScreen } from "@/components/screens/LeaderboardScreen";
import { Predictions } from "@/components/Predictions";
import { SettingsModal } from "@/components/SettingsModal";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useUserStore } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";

const BRAND = {
  bg: "#050912",
  card: "#0D1124",
  border: "rgba(255,255,255,0.08)",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  purpleFaint: "rgba(85,69,211,0.18)",
  purpleBorder: "rgba(85,69,211,0.45)",
  text: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#475569",
} as const;

const PAGE_LABELS = ["Play", "Predictions", "Leaderboard"] as const;

export default function MainScreen() {
  const { loading, user } = useAuthUser();
  const { setUser } = useUserStore();
  const pagerRef = useRef<PagerView>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [settingsVisible, setSettingsVisible] = useState(false);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setCurrentPage(e.nativeEvent.position);
    },
    []
  );

  const goToPage = useCallback((page: number) => {
    pagerRef.current?.setPage(page);
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.bg }} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={BRAND.purpleLight} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BRAND.bg }} edges={["top"]}>

      {/* ── Persistent Header ──────────────────────────────────── */}
      <View style={{
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        paddingHorizontal: 20, paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: BRAND.border,
        backgroundColor: BRAND.bg,
      }}>
        {/* SportsIQ logo */}
        <Text style={{ fontSize: 20, fontWeight: "900", color: BRAND.text, letterSpacing: -0.5 }}>
          Sports<Text style={{ color: BRAND.purpleLight }}>IQ</Text>
        </Text>

        {/* Join contest button */}
        <Pressable onPress={() => router.push("/(app)/scan")} hitSlop={10}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            paddingVertical: 6, paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor: BRAND.purple,
          }}>
            <Ionicons name="qr-code-outline" size={14} color={BRAND.text} />
            <Text style={{ fontSize: 13, fontWeight: "800", color: BRAND.text }}>
              Join contest
            </Text>
          </View>
        </Pressable>

        {/* IQ chip — tap to open Settings */}
        <Pressable onPress={() => setSettingsVisible(true)} hitSlop={10}>
          <View style={{
            flexDirection: "row", alignItems: "center", gap: 6,
            paddingVertical: 6, paddingHorizontal: 12,
            borderRadius: 20,
            backgroundColor: BRAND.purpleFaint,
            borderWidth: 1, borderColor: BRAND.purpleBorder,
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND.purpleLight }} />
            <Text style={{ fontSize: 13, fontWeight: "800", color: BRAND.purpleLight }}>
              {(user?.points ?? 0).toLocaleString()} IQ
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── Page Indicator Dots ────────────────────────────────── */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8 }}>
        {PAGE_LABELS.map((label, i) => (
          <Pressable key={label} onPress={() => goToPage(i)} hitSlop={8}>
            <View style={{
              width: i === currentPage ? 24 : 6,
              height: 4,
              borderRadius: 2,
              backgroundColor: i === currentPage ? BRAND.purpleLight : BRAND.faint,
            }} />
          </Pressable>
        ))}
      </View>

      {/* Swipe Pages */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={handlePageSelected}
      >
        <View key="play" style={{ flex: 1 }}>
          <PlayScreen user={user} setUser={setUser} />
        </View>
        <View key="predictions" style={{ flex: 1 }}>
          <Predictions points={user?.points ?? 0} userId={user?.id} />
        </View>
        <View key="leaderboard" style={{ flex: 1 }}>
          <LeaderboardScreen user={user} />
        </View>
      </PagerView>

      {/* Settings Modal */}
      <SettingsModal
        visible={settingsVisible}
        user={user}
        onClose={() => setSettingsVisible(false)}
      />
    </SafeAreaView>
  );
}
