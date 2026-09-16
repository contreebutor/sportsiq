import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, View } from "react-native";
import CustomImg from "../CustomImg";
import type { FeaturedGameItem, TeamStatic } from "./types";

export interface GameStripItemProps {
  item: FeaturedGameItem;
  selected: boolean;
  onSelect: () => void;
}

interface TeamPillProps {
  team: TeamStatic;
  selected: boolean;
  position: "away" | "home";
}

function TeamPill({ team, selected, position }: TeamPillProps) {
  return (
    <View
      className={`flex-row items-center gap-1.5 ${position === "away" ? "" : "flex-row-reverse"}`}
    >
      <CustomImg uri={team.logo_url ?? undefined} width={30} height={30} />
      <Text
        className={`text-base font-bold ${selected ? "text-slate-100" : "text-slate-400"}`}
        numberOfLines={1}
      >
        {team.key}
      </Text>
    </View>
  );
}

export function GameStripItem({
  item,
  selected,
  onSelect,
}: GameStripItemProps) {
  const { home, away } = item.sports_game.teams;
  const awayColor = away.primary_color || "#334155";
  const homeColor = home.primary_color || "#334155";

  return (
    <Pressable
      onPress={onSelect}
      className={`mr-4 rounded-xl border-2 min-w-[140] overflow-hidden ${
        selected ? "border-slate-400" : "border-slate-700"
      }`}
    >
      <View className="relative">
        <LinearGradient
          colors={[awayColor, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <LinearGradient
          colors={[homeColor, "transparent"]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="p-3 flex-row items-center justify-center gap-2">
          <TeamPill team={away} selected={selected} position="away" />
          <Text
            className={`text-sm font-semibold ${selected ? "text-slate-400" : "text-slate-500"}`}
          >
            VS
          </Text>
          <TeamPill team={home} selected={selected} position="home" />
        </View>
      </View>
    </Pressable>
  );
}
