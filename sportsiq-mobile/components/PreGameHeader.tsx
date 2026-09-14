import { Text, View } from "react-native";
import CustomImg from "./CustomImg";

interface Props {
  title: string;
  awayTeamKey: string;
  awayTeamLogoUrl: string;
  awayTeamWins: number;
  awayTeamLosses: number;
  homeTeamKey: string;
  homeTeamLogoUrl: string;
  homeTeamWins: number;
  homeTeamLosses: number;
}

export default function PreGameHeader({
  title,
  awayTeamKey,
  awayTeamLogoUrl,
  awayTeamWins,
  awayTeamLosses,
  homeTeamKey,
  homeTeamLogoUrl,
  homeTeamWins,
  homeTeamLosses,
}: Props) {
  return (
    <View
      style={{
        width: "100%",
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Away team (left) */}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CustomImg uri={awayTeamLogoUrl} size={48} />
        </View>
        <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
          <Text
            style={{
              fontSize: 18,
              color: "#FFFFFF",
              fontWeight: "600",
              marginBottom: -2,
            }}
          >
            {awayTeamKey}
          </Text>
          <Text style={{ fontSize: 16, color: "#FFFFFF", fontWeight: "300" }}>
            {awayTeamWins ?? 0}-{awayTeamLosses ?? 0}
          </Text>
        </View>
      </View>

      {/* Center: time/title */}
      <Text
        style={{
          fontSize: 15,
          color: "#FFFFFF",
          fontWeight: "600",
          textAlign: "center",
        }}
      >
        {title}
      </Text>

      {/* Home team (right) */}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4,
        }}
      >
        <View style={{ flexDirection: "column", alignItems: "flex-end" }}>
          <Text
            style={{
              fontSize: 18,
              color: "#FFFFFF",
              fontWeight: "600",
              marginBottom: -2,
            }}
          >
            {homeTeamKey}
          </Text>
          <Text style={{ fontSize: 16, color: "#FFFFFF", fontWeight: "300" }}>
            {homeTeamWins ?? 0}-{homeTeamLosses ?? 0}
          </Text>
        </View>
        <View
          style={{
            width: 52,
            height: 52,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CustomImg uri={homeTeamLogoUrl} size={48} />
        </View>
      </View>
    </View>
  );
}
