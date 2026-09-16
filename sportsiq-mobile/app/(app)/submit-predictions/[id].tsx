import DualRadial from "@/components/DualRadial";
import PreGameHeader from "@/components/PreGameHeader";
import {
  createContestUserByPredictorID,
  fetchBarPoints,
  fetchPredictorInfoByID,
  fetchSportsIQPoints,
  type FetchPredictorInfoResponse,
  registerPredictions,
  retrievePredictions,
} from "@/lib/contestApi";
import {
  getStoredContestUserID,
  storeContestUserID,
} from "@/lib/contestStorage";
import { useUserStore } from "@/store/user";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PagerView from "react-native-pager-view";

// ── Constants ────────────────────────────────────────────

const BRAND = {
  bg: "#110E2A",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  text: "#F8FAFC",
  muted: "#94A3B8",
  categoryBg: "#1D1A35",
} as const;

type PredictionSelection = {
  [categoryId: number]: "under" | "exact" | "over";
};

// ── Main Screen ──────────────────────────────────────────

export default function ContestPredictorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { phone, user } = useUserStore();

  const [predictorInfo, setPredictorInfo] =
    useState<FetchPredictorInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [predictions, setPredictions] = useState<PredictionSelection[]>([]);
  const [contestUserID, setContestUserID] = useState<string | null>(null);
  const [sportsIQPoints, setSportsIQPoints] = useState(0);
  const [barPoints, setBarPoints] = useState(0);

  const pagerRef = useRef<PagerView>(null);

  const getUniqueQuarters = useCallback(
    (settings: FetchPredictorInfoResponse["settings"]) => {
      const quarters = new Set(settings.map((s) => String(s.quarter)));
      return Array.from(quarters).sort();
    },
    []
  );

  // ── Bootstrap: fetch info, auto-register, load existing predictions ──

  useEffect(() => {
    if (!id || !phone || !user) return;

    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);

      const info = await fetchPredictorInfoByID(id);
      if (cancelled || !info) {
        if (!cancelled) setLoading(false);
        return;
      }
      setPredictorInfo(info);

      const quarters = Array.from(
        new Set(info.settings.map((s) => String(s.quarter)))
      ).sort();
      const initialPredictions: PredictionSelection[] = quarters.map(() => ({}));
      setPredictions(initialPredictions);

      let userID = await getStoredContestUserID(id);
      if (!userID) {
        userID = await createContestUserByPredictorID(id, phone, user.name);
        if (userID) await storeContestUserID(id, userID);
      }

      if (cancelled) return;

      if (!userID) {
        Alert.alert("Error", "Failed to register for this contest.");
        setLoading(false);
        return;
      }

      setContestUserID(userID);

      const existing = await retrievePredictions(id, userID);
      if (!cancelled && existing && existing.length > 0) {
        const updated: PredictionSelection[] = quarters.map((quarter) => {
          const qData = existing.find((p) => p.quarter === quarter);
          if (!qData) return {};
          const parsed: PredictionSelection = {};
          qData.predictions.forEach((pred) => {
            const [catId, option] = pred.split(":");
            parsed[Number(catId)] = option as "under" | "exact" | "over";
          });
          return parsed;
        });
        setPredictions(updated);
      }

      setLoading(false);
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [id, phone, user]);

  // ── Points polling ──

  useEffect(() => {
    if (!contestUserID || !id) return;

    const poll = async () => {
      const [siq, bar] = await Promise.all([
        fetchSportsIQPoints(contestUserID),
        fetchBarPoints(contestUserID, id, "predictor"),
      ]);
      setSportsIQPoints(siq);
      setBarPoints(bar);
    };

    poll();
    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  }, [contestUserID, id]);

  // ── Handlers ──

  const handleSelection = (
    quarterIndex: number,
    categoryId: number,
    option: "under" | "exact" | "over"
  ) => {
    setPredictions((prev) => {
      const next = [...prev];
      next[quarterIndex] = { ...next[quarterIndex], [categoryId]: option };
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!contestUserID || !predictorInfo || !id) return;

    setSubmitting(true);

    const quarters = getUniqueQuarters(predictorInfo.settings);
    const data = quarters.map((quarter, qi) => ({
      quarter,
      predictions: Object.entries(predictions[qi] || {}).map(
        ([catId, opt]) => `${catId}:${opt}`
      ),
    }));

    const success = await registerPredictions(id, contestUserID, data);
    setSubmitting(false);

    if (success) {
      setShowSuccess(true);
      setTimeout(() => {
        if (router.canGoBack()) router.back();
      }, 5000);
    } else {
      Alert.alert("Error", "Failed to submit predictions. Please try again.");
    }
  };

  // ── Loading ──

  if (loading || !predictorInfo) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: BRAND.bg }}
        edges={["bottom"]}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={BRAND.purpleLight} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Success Overlay ──

  if (showSuccess) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: BRAND.bg }}
        edges={["bottom"]}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 32,
          }}
        >
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              borderWidth: 4,
              borderColor: BRAND.purple,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="checkmark" size={56} color={BRAND.purple} />
          </View>
          <Text
            style={{
              color: BRAND.text,
              fontSize: 26,
              fontWeight: "800",
              marginTop: 8,
            }}
          >
            YOU'RE IN!
          </Text>
          <View style={{ height: 8 }} />
          <Text
            style={{
              color: BRAND.text,
              fontSize: 17,
              fontWeight: "500",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Your predictions have been locked in.
          </Text>
          <View style={{ height: 8 }} />
          <Text
            style={{
              color: BRAND.text,
              fontSize: 17,
              fontWeight: "500",
              textAlign: "center",
              lineHeight: 24,
            }}
          >
            Good luck! Watch the live leaderboard on screen to see if you win!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Content ──

  const awayTeam = predictorInfo.game.away_team;
  const homeTeam = predictorInfo.game.home_team;
  const quarters = getUniqueQuarters(predictorInfo.settings);

  const groupedSettings: {
    [q: string]: FetchPredictorInfoResponse["settings"];
  } = {};
  predictorInfo.settings.forEach((s) => {
    const q = String(s.quarter);
    if (!groupedSettings[q]) groupedSettings[q] = [];
    groupedSettings[q].push(s);
  });

  const allSelected = quarters.every((quarter, qi) => {
    const qSettings = groupedSettings[quarter] || [];
    const qPreds = predictions[qi] || {};
    return qSettings.length > 0 && qSettings.every((s) => qPreds[s.id]);
  });

  const timeString = new Date(predictorInfo.game.date_time).toLocaleTimeString(
    [],
    { hour: "numeric", minute: "2-digit" }
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: BRAND.bg }}
      edges={["bottom"]}
    >
      {/* ── "PREDICTOR" Logo ─── */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
        }}
      >
        <Text
          style={{
            color: BRAND.text,
            fontSize: 22,
            fontWeight: "800",
            letterSpacing: 3,
          }}
        >
          PREDICTOR
        </Text>
      </View>

      {/* ── Points Banner (if user registered) ─── */}
      {contestUserID && (
        <View style={{ paddingHorizontal: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(99, 102, 241, 0.5)",
              paddingVertical: 8,
              borderTopLeftRadius: 6,
              borderTopRightRadius: 6,
              gap: 14,
            }}
          >
            <Text
              style={{ color: BRAND.text, fontSize: 14, fontWeight: "500" }}
            >
              Points
            </Text>
            <Text style={{ color: BRAND.text }}>-</Text>
            <Text style={{ color: BRAND.text, fontSize: 14 }}>
              SIQ {sportsIQPoints}
            </Text>
            <Text style={{ color: BRAND.text }}>|</Text>
            <Text style={{ color: BRAND.text, fontSize: 14 }}>
              Bar {barPoints}
            </Text>
          </View>
        </View>
      )}

      {/* ── Dual Gradient Body ─── */}
      <DualRadial
        leftColor={awayTeam.primary_color}
        rightColor={homeTeam.primary_color}
        style={{ flex: 1 }}
      >
        {/* Team matchup header */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <PreGameHeader
            title={timeString}
            awayTeamKey={awayTeam.key}
            awayTeamLogoUrl={awayTeam.logo_url}
            awayTeamWins={awayTeam.wins}
            awayTeamLosses={awayTeam.losses}
            homeTeamKey={homeTeam.key}
            homeTeamLogoUrl={homeTeam.logo_url}
            homeTeamWins={homeTeam.wins}
            homeTeamLosses={homeTeam.losses}
          />
        </View>

        {/* Quarter Pager */}
        <PagerView
          ref={pagerRef}
          style={{ flex: 1, marginTop: 12 }}
          initialPage={0}
          onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
        >
          {quarters.map((quarter, qi) => {
            const qSettings = groupedSettings[quarter] || [];
            const qPreds = predictions[qi] || {};
            const title = predictorInfo.titles[quarter];

            return (
              <ScrollView
                key={quarter}
                contentContainerStyle={{
                  paddingHorizontal: 8,
                  paddingBottom: 16,
                }}
              >
                {/* Purple prize header */}
                <View
                  style={{
                    backgroundColor: BRAND.purple,
                    borderTopLeftRadius: 8,
                    borderTopRightRadius: 8,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.8)",
                      fontSize: 14,
                      fontWeight: "600",
                    }}
                  >
                    {title?.quarter}
                  </Text>
                  <Text
                    style={{
                      color: BRAND.text,
                      fontSize: 20,
                      fontWeight: "800",
                    }}
                  >
                    {title?.prize}
                  </Text>
                </View>

                {/* White content area */}
                <View
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: 12,
                    gap: 12,
                  }}
                >
                  {/* "PREDICT N OUTCOMES" */}
                  <View style={{ alignItems: "center", gap: 4, paddingTop: 4 }}>
                    <Text
                      style={{
                        fontSize: 26,
                        fontWeight: "900",
                        color: "#000",
                        lineHeight: 28,
                      }}
                    >
                      PREDICT
                    </Text>
                    <Text
                      style={{
                        fontSize: 26,
                        fontWeight: "900",
                        color: BRAND.purple,
                        lineHeight: 28,
                      }}
                    >
                      {qSettings.length} OUTCOMES
                    </Text>
                    <Text
                      style={{
                        color: "#6B7280",
                        fontSize: 14,
                        textAlign: "center",
                        lineHeight: 18,
                        marginTop: 4,
                      }}
                    >
                      The more outcomes you get right,{"\n"}the more IQ Points
                      you earn.
                    </Text>
                  </View>

                  {/* Category cards */}
                  <View style={{ gap: 4 }}>
                    {qSettings.map((setting) => (
                      <CategoryCard
                        key={setting.id}
                        setting={setting}
                        selected={qPreds[setting.id]}
                        onSelect={(opt) =>
                          handleSelection(qi, setting.id, opt)
                        }
                      />
                    ))}
                  </View>
                </View>
              </ScrollView>
            );
          })}
        </PagerView>

        {/* Submit button */}
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <Pressable
            onPress={handleSubmit}
            disabled={!allSelected || submitting}
            style={{
              backgroundColor: allSelected
                ? BRAND.purple
                : "rgba(85,69,211,0.4)",
              paddingVertical: 14,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={BRAND.text} />
            ) : (
              <Text
                style={{
                  color: BRAND.text,
                  fontSize: 17,
                  fontWeight: "600",
                }}
              >
                Submit
              </Text>
            )}
          </Pressable>
        </View>

        {/* Page dots */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            paddingBottom: 16,
          }}
        >
          {quarters.map((_, i) => (
            <View
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: i === currentPage ? "#14B8A6" : BRAND.purple,
              }}
            />
          ))}
        </View>
      </DualRadial>
    </SafeAreaView>
  );
}

// ── Category Card ────────────────────────────────────────

function CategoryCard({
  setting,
  selected,
  onSelect,
}: {
  setting: FetchPredictorInfoResponse["settings"][0];
  selected?: "under" | "exact" | "over";
  onSelect: (option: "under" | "exact" | "over") => void;
}) {
  const teamKey = setting.team_key === "TOTAL" ? "COMBINED" : setting.team_key;

  return (
    <View
      style={{
        backgroundColor: BRAND.categoryBg,
        borderRadius: 4,
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 22,
        gap: 8,
      }}
    >
      <Text
        style={{
          color: BRAND.text,
          fontSize: 16,
          fontWeight: "500",
          textAlign: "center",
        }}
      >
        {teamKey} {setting.category.label}
      </Text>

      <View style={{ flexDirection: "row", gap: 8 }}>
        <PredictionButton
          label="Under"
          value={setting.value}
          points={setting.points.under}
          isSelected={selected === "under"}
          isExact={false}
          onPress={() => onSelect("under")}
        />
        <PredictionButton
          label="Exactly"
          value={setting.value}
          points={setting.points.exact}
          isSelected={selected === "exact"}
          isExact={true}
          onPress={() => onSelect("exact")}
        />
        <PredictionButton
          label="Over"
          value={setting.value}
          points={setting.points.over}
          isSelected={selected === "over"}
          isExact={false}
          onPress={() => onSelect("over")}
        />
      </View>
    </View>
  );
}

// ── Prediction Button ────────────────────────────────────

function PredictionButton({
  label,
  value,
  points,
  isSelected,
  isExact,
  onPress,
}: {
  label: string;
  value: number;
  points: number;
  isSelected: boolean;
  isExact: boolean;
  onPress: () => void;
}) {
  const selectedColor = isExact ? "#FBBF24" : "#4ADE80";
  const selectedBg = isExact
    ? "rgba(234,179,8,0.18)"
    : "rgba(34,197,94,0.18)";
  const badgeBg = isSelected
    ? isExact
      ? "#775929"
      : "#1F5F47"
    : "#423F55";

  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        borderRadius: 6,
        paddingTop: 12,
        paddingBottom: 16,
        paddingHorizontal: 4,
        backgroundColor: isSelected ? selectedBg : "rgba(255,255,255,0.08)",
        borderWidth: 2,
        borderColor: isSelected ? `${selectedColor}80` : "transparent",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        minHeight: 60,
      }}
    >
      <Text
        style={{
          color: isSelected ? selectedColor : "rgba(255,255,255,0.6)",
          fontSize: 13,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: isSelected ? selectedColor : "rgba(255,255,255,0.6)",
          fontSize: 16,
          fontWeight: "600",
        }}
      >
        {value}
      </Text>

      {/* Points badge */}
      <View
        style={{
          position: "absolute",
          bottom: -14,
          alignSelf: "center",
          backgroundColor: badgeBg,
          paddingHorizontal: 10,
          paddingVertical: 3,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: BRAND.categoryBg,
        }}
      >
        <Text
          style={{
            color: BRAND.text,
            fontSize: 12,
            fontWeight: "500",
          }}
        >
          +{points.toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}
