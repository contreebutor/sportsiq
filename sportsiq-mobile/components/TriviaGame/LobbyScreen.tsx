import type { TriviaLobbyPayload } from "@/lib/triviaTypes";
import { type UserInfo } from "@/store/user";
import { Pressable, Text, View } from "react-native";
import CustomImg from "../CustomImg";

interface LobbyScreenProps {
  lobby: TriviaLobbyPayload;
  lobbyCountdown: number;
  joinedGame: boolean;
  user: UserInfo | null;
  onJoin: () => void;
}

export function LobbyScreen({
  lobby,
  lobbyCountdown,
  joinedGame,
  user,
  onJoin,
}: LobbyScreenProps) {
  return (
    <View className="flex-1 py-3">
      <View className="items-center mb-6">
        <Text className="text-sm text-slate-500 uppercase tracking-wider mb-1">
          Next Game
        </Text>
        <Text className="text-3xl font-bold text-slate-50">
          #{lobby.gameId}
        </Text>
      </View>

      <View className="items-center mb-8">
        <Text className="text-6xl font-bold text-blue-400">
          {lobbyCountdown}
        </Text>
        <Text className="text-sm text-slate-400 mt-1">
          seconds until start
        </Text>
      </View>

      <View className="items-center mb-8">
        {joinedGame ? (
          <View className="bg-green-900/40 border-2 border-green-500 rounded-xl px-8 py-4">
            <Text className="text-green-400 font-semibold text-base text-center">
              You're in! Waiting for game to start...
            </Text>
          </View>
        ) : (
          <Pressable
            className="bg-blue-600 rounded-xl px-12 py-4 active:bg-blue-700"
            onPress={onJoin}
          >
            <Text className="text-white font-bold text-lg text-center">
              Join Game
            </Text>
          </Pressable>
        )}
      </View>

      <View className="border-t border-slate-800 pt-4">
        <Text className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          Players ({lobby.playerCount})
        </Text>
        {lobby.players.length === 0 ? (
          <Text className="text-sm text-slate-600 text-center py-4">
            No players yet — be the first to join!
          </Text>
        ) : (
          <View className="gap-2">
            {lobby.players.map((p) => (
              <View
                key={p.userId}
                className="flex-row items-center gap-3 py-2 px-3 bg-slate-800/50 rounded-lg"
              >
                <View className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 items-center justify-center">
                  <CustomImg
                    uri={p.avatarUrl ?? undefined}
                    width={32}
                    height={32}
                  />
                </View>
                <Text className="text-sm text-slate-200 font-medium">
                  {p.name}
                </Text>
                {p.userId === user?.id && (
                  <Text className="text-xs text-blue-400">(you)</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
