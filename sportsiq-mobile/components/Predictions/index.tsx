import { fetchFeaturedPredictions, submitPick } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  Text,
  View,
} from "react-native";
import { GameStripItem } from "./GameStripItem";
import { PickRow } from "./PickRow";
import { TeamProfile } from "./TeamProfile";
import type { FeaturedGameItem } from "./types";

const POLL_MS = 15_000;
const CARD_PADDING = 12;

export interface PredictionsProps {
  points?: number;
  userId: string | undefined;
}

export function Predictions({ points = 0, userId }: PredictionsProps) {
  const [games, setGames] = useState<FeaturedGameItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameUuid, setSelectedGameUuid] = useState<string | null>(null);

  const livePulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 0.4,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [livePulse]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const data = await fetchFeaturedPredictions(userId);
      if (!active) return;
      setGames(data);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [userId]);

  const handleChoose = useCallback(
    async (featuredGameId: string, choice: "yes" | "no") => {
      if (!userId) return;

      setGames((prev) =>
        prev.map((g) => ({
          ...g,
          picks: g.picks.map((p) =>
            p.id === featuredGameId ? { ...p, user_pick: choice } : p
          ),
        }))
      );

      await submitPick(userId, featuredGameId, choice, 1);
    },
    [userId]
  );

  const headerEl = (
    <View className="flex-row items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-900">
      <Text className="text-xl font-bold text-slate-50">Predictions</Text>
      <View className="flex-row items-center gap-1 py-1 px-2 rounded-xl bg-slate-800">
        <Ionicons name="star" size={14} color="#eab308" />
        <Text className="text-sm font-semibold text-white">{points}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <>
        {headerEl}
        <View className="flex-1 p-6 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </>
    );
  }

  if (games.length === 0) {
    return (
      <>
        {headerEl}
        <View className="flex-1 p-6 items-center justify-center">
          <Ionicons name="trophy-outline" size={48} color="#64748b" />
          <Text className="text-[22px] font-bold text-slate-50 mt-4">
            No predictions available
          </Text>
          <Text className="text-base text-slate-400 mt-2 text-center">
            Check back later for the next prediction.
          </Text>
        </View>
      </>
    );
  }

  const effectiveSelectedId =
    selectedGameUuid && games.some((g) => g.game_uuid === selectedGameUuid)
      ? selectedGameUuid
      : (games[0]?.game_uuid ?? null);
  const selectedGame =
    games.find((g) => g.game_uuid === effectiveSelectedId) ?? null;

  return (
    <>
      {headerEl}
      <View className="flex-1">
        <View className="h-fit relative">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: CARD_PADDING,
              paddingTop: 16,
              paddingBottom: 12,
            }}
            className="border-b border-slate-800 bg-slate-900/50"
          >
            {games.map((item) => (
              <GameStripItem
                key={item.game_uuid}
                item={item}
                selected={item.game_uuid === effectiveSelectedId}
                onSelect={() => setSelectedGameUuid(item.game_uuid)}
              />
            ))}
          </ScrollView>
        </View>
        {selectedGame && (
          <View className="flex-1 relative">
            <LinearGradient
              colors={[
                selectedGame.sports_game.teams.away.primary_color ?? "#334155",
                "transparent",
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0.75, y: 0.4 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            <LinearGradient
              colors={[
                selectedGame.sports_game.teams.home.primary_color ?? "#334155",
                "transparent",
              ]}
              start={{ x: 1, y: 0 }}
              end={{ x: 0.25, y: 0.4 }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {(() => {
              const status = selectedGame.sports_game.status;
              let timeLabel = "";
              if (status === "Scheduled") {
                const d = new Date(selectedGame.sports_game.date_time);
                timeLabel = d.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                });
              } else if (status === "InProgress") {
                timeLabel = "LIVE";
              } else if (status === "Final" || status === "F/OT") {
                timeLabel = "FINAL";
              }

              return (
                <View className="flex-row justify-between items-center px-4 pt-4 pb-2">
                  <TeamProfile
                    team={selectedGame.sports_game.teams.away}
                    teamKey={selectedGame.sports_game.teams.away.key}
                    position="away"
                  />
                  <View className="items-center justify-center">
                    {timeLabel === "LIVE" ? (
                      <Animated.View
                        style={{
                          opacity: livePulse,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#ef4444",
                          }}
                        />
                        <Text
                          style={{
                            color: "#ef4444",
                            fontWeight: "bold",
                            fontSize: 18,
                          }}
                        >
                          LIVE
                        </Text>
                      </Animated.View>
                    ) : (
                      <Text className="text-lg font-bold text-white">
                        {timeLabel}
                      </Text>
                    )}
                  </View>
                  <TeamProfile
                    team={selectedGame.sports_game.teams.home}
                    teamKey={selectedGame.sports_game.teams.home.key}
                    position="home"
                  />
                </View>
              );
            })()}
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingTop: 12,
                paddingBottom: 16,
              }}
            >
              {selectedGame.picks.map((pick) => (
                <PickRow
                  key={pick.id}
                  pick={pick}
                  onChoose={(choice) => handleChoose(pick.id, choice)}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    </>
  );
}
