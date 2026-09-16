import CustomImg from "@/components/CustomImg";
import DualRadial from "@/components/DualRadial";
import PreGameHeader from "@/components/PreGameHeader";
import {
  createContestUserByBingoID,
  fetchBarPoints,
  fetchSportsIQPoints,
  getAnotherBingoCard,
  getContestBingoCards,
  getGameInfoByContestBingoID,
  type BingoCardSquareProps,
  type GameType,
  type GetContestBingoCardsResponse,
  type GetGameInfoByContestBingoIDResponse,
} from "@/lib/contestApi";
import {
  getStoredContestUserID,
  storeContestUserID,
} from "@/lib/contestStorage";
import { useUserStore } from "@/store/user";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
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
  bg: "#0a0718",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  text: "#F8FAFC",
  muted: "#94A3B8",
  green: "rgba(34,197,94,0.75)",
  indigo: "rgba(99,102,241,0.75)",
} as const;

// ── Main Screen ──────────────────────────────────────────

export default function ContestBingoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { phone, user } = useUserStore();

  const [gameInfo, setGameInfo] =
    useState<GetGameInfoByContestBingoIDResponse | null>(null);
  const [bingoCards, setBingoCards] = useState<
    GetContestBingoCardsResponse[] | null
  >(null);
  const [contestUserID, setContestUserID] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [sportsIQPoints, setSportsIQPoints] = useState(0);
  const [barPoints, setBarPoints] = useState(0);

  const pagerRef = useRef<PagerView>(null);

  // Team logos lookup
  const teamLogos: Record<string, { logo_url: string; type: "home" | "away" }> =
    gameInfo
      ? {
          [gameInfo.home_team_key]: {
            logo_url: gameInfo.home_team_logo_url,
            type: "home",
          },
          [gameInfo.away_team_key]: {
            logo_url: gameInfo.away_team_logo_url,
            type: "away",
          },
        }
      : {};

  // ── Bootstrap ──

  useEffect(() => {
    if (!id || !phone || !user) return;
    let cancelled = false;

    const bootstrap = async () => {
      setLoading(true);

      const info = await getGameInfoByContestBingoID(id);
      if (cancelled || !info) {
        if (!cancelled) setLoading(false);
        return;
      }
      setGameInfo(info);

      let userID = await getStoredContestUserID(id);
      if (!userID) {
        userID = await createContestUserByBingoID(id, phone, user.name);
        if (userID) await storeContestUserID(id, userID);
      }

      if (cancelled) return;

      if (!userID) {
        Alert.alert("Error", "Failed to register for this contest.");
        setLoading(false);
        return;
      }

      setContestUserID(userID);

      const cards = await getContestBingoCards(id, userID);
      if (!cancelled) {
        setBingoCards(cards);
        setLoading(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [id, phone, user]);

  // ── Poll bingo cards when InProgress ──

  useEffect(() => {
    if (!contestUserID || !id || !gameInfo) return;
    if (gameInfo.status !== "InProgress") return;

    const poll = async () => {
      const cards = await getContestBingoCards(id, contestUserID);
      if (cards) setBingoCards(cards);
    };

    const interval = setInterval(poll, 5_000);
    return () => clearInterval(interval);
  }, [contestUserID, id, gameInfo?.status]);

  // ── Poll game info ──

  useEffect(() => {
    if (!id || !gameInfo) return;

    const intervalMs =
      gameInfo.status === "InProgress"
        ? 5_000
        : gameInfo.status === "Scheduled"
          ? 60_000
          : null;
    if (!intervalMs) return;

    const poll = async () => {
      const info = await getGameInfoByContestBingoID(id);
      if (info) setGameInfo(info);
    };

    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [id, gameInfo?.status]);

  // ── Poll points ──

  useEffect(() => {
    if (!contestUserID || !id) return;

    const poll = async () => {
      const [siq, bar] = await Promise.all([
        fetchSportsIQPoints(contestUserID),
        fetchBarPoints(contestUserID, id, "bingo"),
      ]);
      setSportsIQPoints(siq);
      setBarPoints(bar);
    };

    poll();
    const interval = setInterval(poll, 60_000);
    return () => clearInterval(interval);
  }, [contestUserID, id]);

  // ── Get Another Card ──

  const handleGetAnotherCard = async (bingoCardID: string) => {
    const newCard = await getAnotherBingoCard(bingoCardID);
    if (newCard) {
      setBingoCards(
        (prev) =>
          prev?.map((c) => (c.id === bingoCardID ? newCard : c)) ?? null
      );
      Alert.alert("Success", "New card has been received.");
    } else {
      Alert.alert("Error", "Failed to receive new card. Please try again.");
    }
  };

  // ── Loading ──

  if (loading || !gameInfo) {
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

  if (!bingoCards || bingoCards.length === 0) {
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
            paddingHorizontal: 32,
          }}
        >
          <Text
            style={{
              color: BRAND.muted,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            No bingo cards available for this contest.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main Content ──

  const headerTitle =
    gameInfo.status === "InProgress" &&
    gameInfo.time_remaining_minutes !== null
      ? `${gameInfo.time_remaining_minutes}:${String(
          gameInfo.time_remaining_seconds ?? 0
        ).padStart(2, "0")}`
      : new Date(gameInfo.date_time).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: BRAND.bg }}
      edges={["bottom"]}
    >
      {/* ── "BINGO" Logo ─── */}
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 12,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 36,
            gap: 2,
          }}
        >
          {["B", "I", "N", "G", "O"].map((letter, i) => (
            <Text
              key={i}
              style={{
                color: BRAND.text,
                fontSize: 28,
                fontWeight: "800",
                alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
              }}
            >
              {letter}
            </Text>
          ))}
        </View>
      </View>

      {/* ── Points Banner ─── */}
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

      {/* ── Bingo Cards Pager ─── */}
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {bingoCards.map((card) => (
          <ScrollView
            key={card.id}
            contentContainerStyle={{
              paddingHorizontal: 12,
              paddingTop: 8,
              paddingBottom: 16,
            }}
          >
            <DualRadial
              leftColor={gameInfo.away_team_primary_color}
              rightColor={gameInfo.home_team_primary_color}
              style={{
                borderRadius: 8,
                padding: 12,
                gap: 12,
              }}
            >
              {/* Team matchup header */}
              <PreGameHeader
                title={headerTitle}
                awayTeamKey={gameInfo.away_team_key}
                awayTeamLogoUrl={gameInfo.away_team_logo_url}
                awayTeamWins={gameInfo.away_team_wins}
                awayTeamLosses={gameInfo.away_team_losses}
                homeTeamKey={gameInfo.home_team_key}
                homeTeamLogoUrl={gameInfo.home_team_logo_url}
                homeTeamWins={gameInfo.home_team_wins}
                homeTeamLosses={gameInfo.home_team_losses}
              />

              {/* Quarter Title */}
              <Text
                style={{
                  color: BRAND.text,
                  fontSize: 22,
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                {getQuarterText(card.quarter, gameInfo.game_type)}
              </Text>

              {/* 3x3 Bingo Grid */}
              <View style={{ gap: 6 }}>
                {[0, 1, 2].map((row) => (
                  <View key={row} style={{ flexDirection: "row", gap: 6 }}>
                    {[1, 2, 3].map((col) => {
                      const idx = (row * 3 + col) as
                        | 1
                        | 2
                        | 3
                        | 4
                        | 5
                        | 6
                        | 7
                        | 8
                        | 9;
                      const square = card.squares[idx];
                      return (
                        <BingoSquare
                          key={idx}
                          square={square}
                          teamLogos={teamLogos}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </DualRadial>

            {/* Get Another Card */}
            {card.retryable && (
              <Pressable
                onPress={() => handleGetAnotherCard(card.id)}
                style={{
                  backgroundColor: BRAND.purple,
                  paddingVertical: 14,
                  borderRadius: 10,
                  alignItems: "center",
                  marginTop: 12,
                }}
              >
                <Text
                  style={{
                    color: BRAND.text,
                    fontSize: 16,
                    fontWeight: "600",
                  }}
                >
                  Get another card
                </Text>
              </Pressable>
            )}
          </ScrollView>
        ))}
      </PagerView>

      {/* ── Page dots ─── */}
      {bingoCards.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 8,
            paddingVertical: 12,
          }}
        >
          {bingoCards.map((_, i) => (
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
      )}
    </SafeAreaView>
  );
}

// ── Bingo Square ─────────────────────────────────────────

function BingoSquare({
  square,
  teamLogos,
}: {
  square: BingoCardSquareProps;
  teamLogos: Record<string, { logo_url: string; type: "home" | "away" }>;
}) {
  const progressPct =
    !square.completed && square.done > 0 && square.total > 0
      ? (square.done / square.total) * 100
      : 0;

  const teamLogo = teamLogos[square.team_key];
  const isTotalTeam = square.team_key === "TOTAL";
  const homeLogoUrl = Object.values(teamLogos).find(
    (t) => t.type === "home"
  )?.logo_url;
  const awayLogoUrl = Object.values(teamLogos).find(
    (t) => t.type === "away"
  )?.logo_url;

  // Determine logo side based on team type (web places home team logo right, away left)
  const isHomeTeam = teamLogo?.type === "home";

  return (
    <View
      style={{
        flex: 1,
        aspectRatio: 1,
        borderRadius: 6,
        backgroundColor: square.completed
          ? BRAND.green
          : "rgba(255,255,255,0.1)",
        overflow: "hidden",
        position: "relative",
        padding: 6,
      }}
    >
      {/* Progress fill (bottom-up) */}
      {progressPct > 0 && (
        <View
          style={{
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: `${progressPct}%`,
            backgroundColor: BRAND.indigo,
          }}
        />
      )}

      {/* Top row: logo(s) + done/total */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 1,
        }}
      >
        {isTotalTeam ? (
          <>
            {awayLogoUrl ? (
              <CustomImg uri={awayLogoUrl} size={20} />
            ) : (
              <View style={{ width: 20 }} />
            )}
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {square.done}/{square.total}
            </Text>
            {homeLogoUrl ? (
              <CustomImg uri={homeLogoUrl} size={20} />
            ) : (
              <View style={{ width: 20 }} />
            )}
          </>
        ) : (
          <>
            {!isHomeTeam && teamLogo ? (
              <CustomImg uri={teamLogo.logo_url} size={20} />
            ) : (
              <View style={{ width: 20 }} />
            )}
            <Text
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {square.done}/{square.total}
            </Text>
            {isHomeTeam && teamLogo ? (
              <CustomImg uri={teamLogo.logo_url} size={20} />
            ) : (
              <View style={{ width: 20 }} />
            )}
          </>
        )}
      </View>

      {/* Center: team key + description */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
          marginTop: 2,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 12,
            fontWeight: "700",
          }}
        >
          {square.team_key}
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 11,
            textAlign: "center",
            lineHeight: 13,
          }}
          numberOfLines={3}
        >
          {square.description}
        </Text>
      </View>

      {/* Bottom: points badge */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: [{ translateX: -20 }],
          zIndex: 2,
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.1)",
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            paddingHorizontal: 12,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 11,
              fontWeight: "600",
            }}
          >
            +{square.points}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────

function getQuarterText(quarter: string, gameType: GameType): string {
  if (gameType === "cbb") {
    if (quarter === "1") return "1ST HALF";
    if (quarter === "2") return "2ND HALF";
  } else if (gameType === "nhl") {
    const n = parseInt(quarter);
    if (!isNaN(n)) {
      const suffix = n === 1 ? "ST" : n === 2 ? "ND" : "RD";
      return `${n}${suffix} PERIOD`;
    }
  } else if (gameType === "mlb") {
    const n = parseInt(quarter);
    if (!isNaN(n)) {
      const suffix =
        n === 1 ? "ST" : n === 2 ? "ND" : n === 3 ? "RD" : "TH";
      return `${n}${suffix} INNING`;
    }
  } else {
    if (quarter === "1") return "1ST QUARTER";
    if (quarter === "2") return "2ND QUARTER";
    if (quarter === "3") return "3RD QUARTER";
    if (quarter === "4") return "4TH QUARTER";
  }
  return "FULL GAME";
}
