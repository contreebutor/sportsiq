import CustomImg from "@/components/CustomImg";
import { fetchUserStats, type UserStatsResponse } from "@/lib/api";
import { type UserInfo, useUserStore } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Modal, Pressable, ScrollView, Switch, Text, View } from "react-native";

const BRAND = {
  bg: "#0D1124",
  card: "rgba(255,255,255,0.05)",
  cardBorder: "rgba(255,255,255,0.09)",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  purpleFaint: "rgba(85,69,211,0.15)",
  purpleBorder: "rgba(85,69,211,0.3)",
  text: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#64748B",
  red: "#FCA5A5",
  rowBorder: "rgba(255,255,255,0.04)",
} as const;

interface SettingsModalProps {
  visible: boolean;
  user: UserInfo | null;
  onClose: () => void;
}

export function SettingsModal({ visible, user, onClose }: SettingsModalProps) {
  const { setPhone, setUser } = useUserStore();
  const [stats, setStats] = useState<UserStatsResponse | null>(null);
  const [gameDayAlerts, setGameDayAlerts] = useState(true);
  const [socialAlerts, setSocialAlerts] = useState(true);
  const [streakReminder, setStreakReminder] = useState(false);

  useEffect(() => {
    if (!visible || !user?.id) return;
    fetchUserStats(user.id).then(setStats);
  }, [visible, user?.id]);

  const handleLogout = useCallback(() => {
    setPhone(null);
    setUser(null);
    onClose();
    router.replace("/enter-phone");
  }, [setPhone, setUser, onClose]);

  const handleDeleteAccount = useCallback(() => {
    Alert.alert(
      "Delete Account",
      "Are you sure? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user?.id) return;
            try {
              const { deleteAccount } = await import("@/lib/api");
              await deleteAccount(user.id);
              setPhone(null);
              setUser(null);
              onClose();
              router.replace("/enter-phone");
            } catch {
              Alert.alert("Error", "Failed to delete account.");
            }
          },
        },
      ]
    );
  }, [user?.id, setPhone, setUser, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable onPress={() => {}} style={{
          backgroundColor: BRAND.bg,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          paddingBottom: 40, maxHeight: "80%",
        }}>
          {/* Handle */}
          <View style={{ alignItems: "center", paddingTop: 8, paddingBottom: 16 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)" }} />
          </View>

          <ScrollView bounces={false}>
            {/* Your Stats */}
            <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
              <Text style={{
                fontSize: 9, fontWeight: "800", color: BRAND.faint,
                letterSpacing: 2, textTransform: "uppercase", marginBottom: 8,
              }}>
                Your Stats
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <StatBox
                  value={stats?.record ?? "0-0"}
                  label="Record"
                />
                <StatBox
                  value={stats?.winRate ? `${stats.winRate}%` : "—"}
                  label="Win Rate"
                />
                <StatBox
                  value={stats?.streak ? `🔥${stats.streak}` : "—"}
                  label="Streak"
                />
                <StatBox
                  value={stats?.rank ? `#${stats.rank}` : "—"}
                  label="Rank"
                />
              </View>
            </View>

            {/* Notifications */}
            <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
              <Text style={{
                fontSize: 9, fontWeight: "800", color: BRAND.faint,
                letterSpacing: 2, textTransform: "uppercase", marginBottom: 8,
              }}>
                Notifications
              </Text>
              <ToggleRow label="Game Day alerts" value={gameDayAlerts} onToggle={setGameDayAlerts} />
              <ToggleRow label="Social (friends' picks)" value={socialAlerts} onToggle={setSocialAlerts} />
              <ToggleRow label="Streak reminder (6pm)" value={streakReminder} onToggle={setStreakReminder} />
            </View>

            {/* Account actions */}
            <View style={{ paddingHorizontal: 16 }}>
              <Pressable onPress={() => { onClose(); router.push("/(app)/edit-profile"); }}>
                <View style={{
                  flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                  paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BRAND.rowBorder,
                }}>
                  <Text style={{ fontSize: 12, color: BRAND.muted }}>Account & Privacy</Text>
                  <Ionicons name="chevron-forward" size={14} color={BRAND.faint} />
                </View>
              </Pressable>

              <Pressable onPress={handleLogout}>
                <View style={{
                  paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: BRAND.rowBorder,
                }}>
                  <Text style={{ fontSize: 12, color: BRAND.red }}>Sign out</Text>
                </View>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: BRAND.card, borderWidth: 1, borderColor: BRAND.cardBorder,
      borderRadius: 8, padding: 8, alignItems: "center",
    }}>
      <Text style={{ fontSize: 14, fontWeight: "900", color: BRAND.text }}>{value}</Text>
      <Text style={{ fontSize: 9, color: BRAND.faint }}>{label}</Text>
    </View>
  );
}

function ToggleRow({
  label, value, onToggle,
}: {
  label: string; value: boolean; onToggle: (v: boolean) => void;
}) {
  return (
    <View style={{
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
    }}>
      <Text style={{ fontSize: 12, color: BRAND.muted }}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: "rgba(255,255,255,0.15)", true: "#7C6EF5" }}
        thumbColor="white"
        style={{ transform: [{ scaleX: 0.7 }, { scaleY: 0.7 }] }}
      />
    </View>
  );
}
