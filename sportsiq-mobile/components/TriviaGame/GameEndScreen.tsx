import { Colors } from "@/constants/colors";
import type { TriviaGameEndPayload } from "@/lib/triviaTypes";
import { type UserInfo } from "@/store/user";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import CustomImg from "../CustomImg";

interface GameEndScreenProps {
  gameEnd: TriviaGameEndPayload;
  user: UserInfo | null;
  nextGameCountdown: number;
}

const PODIUM_HEIGHTS = [100, 130, 80];
const PODIUM_COLORS = ["#94a3b8", "#eab308", "#b45309"];
const PODIUM_MEDALS = ["🥈", "🥇", "🥉"];

function shareResult(rank: number, score: number) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
  Share.share({
    message: `${medal} I finished #${rank} in SportsIQ Trivia with ${score.toLocaleString()} pts! Think you can beat me?`,
  });
}

// Win-receipt colors per rank — used as dynamic border/bg values the JIT
// can't statically extract from classes.
const RANK_COLORS = ["#eab308", "#94a3b8", "#b45309"] as const;

export function GameEndScreen({
  gameEnd,
  user,
  nextGameCountdown,
}: GameEndScreenProps) {
  const myRank = gameEnd.leaderboard.findIndex((e) => e.userId === user?.id);
  const isTopThree = myRank >= 0 && myRank <= 2;
  const podiumOrder = [
    gameEnd.leaderboard[1],
    gameEnd.leaderboard[0],
    gameEnd.leaderboard[2],
  ];

  return (
    <ScrollView
      className="flex-1 py-3"
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
    >
      <View className="items-center mb-4">
        <Text className="text-sm text-slate-500 uppercase tracking-wider mb-1">
          Game Over
        </Text>
        <Text className="text-2xl font-bold text-slate-50">
          #{gameEnd.gameId}
        </Text>
      </View>

      {isTopThree && (
        <View
          className="items-center rounded-2xl bg-slate-800 p-4 mb-5 border-2"
          style={{ borderColor: RANK_COLORS[myRank] }}
        >
          <Text className="mb-1 text-4xl">
            {myRank === 0 ? "🥇" : myRank === 1 ? "🥈" : "🥉"}
          </Text>
          <Text className="mb-0.5 text-xl font-extrabold text-slate-100">
            {myRank === 0
              ? "1st Place"
              : myRank === 1
                ? "2nd Place"
                : "3rd Place"}
          </Text>
          <Text className="mb-3 text-base font-bold text-green-500">
            +{gameEnd.leaderboard[myRank].score.toLocaleString()} pts
          </Text>
          <Pressable
            onPress={() =>
              shareResult(myRank + 1, gameEnd.leaderboard[myRank].score)
            }
            className="flex-row items-center gap-2 rounded-xl bg-blue-500 px-6 py-2.5"
          >
            <Text className="text-[15px] font-bold text-white">
              Share Result
            </Text>
          </Pressable>
        </View>
      )}

      {gameEnd.leaderboard.length > 0 && (
        <View className="mb-5 flex-row items-end justify-center gap-2">
          {podiumOrder.map((entry, i) => {
            if (!entry) return <View key={i} className="w-[90px]" />;
            const isMe = entry.userId === user?.id;
            return (
              <View key={entry.userId} className="w-[100px] items-center">
                <Text className="mb-0.5 text-xl">{PODIUM_MEDALS[i]}</Text>
                <View className="w-11 h-11 rounded-full overflow-hidden bg-slate-700 mb-1">
                  <CustomImg
                    uri={entry.avatarUrl ?? undefined}
                    width={44}
                    height={44}
                  />
                </View>
                <Text
                  numberOfLines={1}
                  className={`mb-1 text-[11px] font-semibold text-center ${
                    isMe ? "text-blue-300" : "text-slate-300"
                  }`}
                >
                  {entry.name}
                  {isMe ? "\n(you)" : ""}
                </Text>
                <View
                  className="w-[90px] items-center justify-center rounded-t-md border-t-[3px]"
                  style={{
                    height: PODIUM_HEIGHTS[i],
                    backgroundColor: PODIUM_COLORS[i] + "33",
                    borderTopColor: PODIUM_COLORS[i],
                  }}
                >
                  <Text
                    className="text-[13px] font-extrabold"
                    style={{ color: PODIUM_COLORS[i] }}
                  >
                    +{entry.score.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {gameEnd.leaderboard.length > 3 && (
        <View className="mb-4 gap-2">
          <Text className="text-xs text-slate-500 uppercase tracking-wider mb-1">
            Others
          </Text>
          {gameEnd.leaderboard.slice(3).map((entry, i) => {
            const isMe = entry.userId === user?.id;
            return (
              <View
                key={entry.userId}
                className="flex-row items-center gap-3 rounded-[10px] bg-slate-800 px-3.5 py-2.5"
              >
                <Text className="w-6 text-center font-bold text-slate-500">
                  {i + 4}
                </Text>
                <View className="w-8 h-8 rounded-full overflow-hidden bg-slate-700">
                  <CustomImg
                    uri={entry.avatarUrl ?? undefined}
                    width={32}
                    height={32}
                  />
                </View>
                <Text
                  className={`flex-1 text-[13px] ${
                    isMe ? "text-blue-300" : "text-slate-300"
                  }`}
                >
                  {entry.name}
                  {isMe ? " (you)" : ""}
                </Text>
                <Text className="text-[13px] font-bold text-green-400">
                  +{entry.score.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      <View className="items-center py-4">
        <ActivityIndicator size="small" color={Colors.blue} />
        <Text className="mt-2 text-sm text-slate-500">
          {gameEnd.nextGameStartTime && nextGameCountdown > 0
            ? `Next game in ${nextGameCountdown}s`
            : "Next game starting soon..."}
        </Text>
      </View>
    </ScrollView>
  );
}
