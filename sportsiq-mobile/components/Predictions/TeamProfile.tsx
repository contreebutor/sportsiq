import { Text, View } from "react-native";
import CustomImg from "../CustomImg";
import type { TeamStatic } from "./types";

export interface TeamProfileProps {
  team: TeamStatic;
  teamKey: string;
  position: "home" | "away";
}

export function TeamProfile({ team, teamKey, position }: TeamProfileProps) {
  const wl = `${team.wins}–${team.losses}`;
  return (
    <View
      className={`flex flex-row items-center gap-2 ${position === "away" ? "" : "flex-row-reverse"}`}
    >
      <CustomImg uri={team.logo_url ?? undefined} width={40} height={40} />
      <View
        className={`flex flex-col ${position === "away" ? "" : "items-end"}`}
      >
        <Text className="text-lg font-extrabold text-slate-50 tracking-wider">
          {teamKey}
        </Text>
        <Text className="text-base text-white font-semibold leading-tight">
          {wl}
        </Text>
      </View>
    </View>
  );
}
