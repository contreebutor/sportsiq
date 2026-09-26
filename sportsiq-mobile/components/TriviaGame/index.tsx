import { Colors } from "@/constants/colors";
import { type UserInfo } from "@/store/user";
import { useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { MIN_POINTS_TO_PLAY } from "./constants";
import { GameEndScreen } from "./GameEndScreen";
import { LobbyScreen } from "./LobbyScreen";
import { ObserverModal } from "./ObserverModal";
import { QuestionScreen } from "./QuestionScreen";
import { useTriviaSocket } from "./useTriviaSocket";

interface TriviaGameProps {
  user: UserInfo | null;
  setUser: (user: UserInfo | null) => void;
}

export function TriviaGame({ user, setUser }: TriviaGameProps) {
  const points = user?.points ?? 0;
  const disabled = points < MIN_POINTS_TO_PLAY;

  const [observerModalVisible, setObserverModalVisible] = useState(false);

  const state = useTriviaSocket({
    user,
    disabled,
    setUser,
    onObserverTap: () => setObserverModalVisible(true),
  });

  if (disabled) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-xl font-semibold text-slate-50 mb-2">
          Not enough points
        </Text>
        <Text className="text-[15px] text-slate-400 text-center">
          You need at least {MIN_POINTS_TO_PLAY} points to play trivia. You have{" "}
          {points} points.
        </Text>
      </View>
    );
  }

  if (state.phase === "connecting") {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text className="mt-3 text-[15px] text-slate-400">
          Connecting to live game...
        </Text>
      </View>
    );
  }

  if (state.phase === "lobby" && state.lobby) {
    return (
      <LobbyScreen
        lobby={state.lobby}
        lobbyCountdown={state.lobbyCountdown}
        joinedGame={state.joinedGame}
        user={user}
        onJoin={state.handleJoinGame}
      />
    );
  }

  if (state.phase === "game-end" && state.gameEnd) {
    return (
      <GameEndScreen
        gameEnd={state.gameEnd}
        user={user}
        nextGameCountdown={state.nextGameCountdown}
      />
    );
  }

  if (state.phase === "loading" || !state.question) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator size="large" color={Colors.blue} />
        <Text className="mt-3 text-[15px] text-slate-400">
          Loading next question...
        </Text>
      </View>
    );
  }

  return (
    <>
      <QuestionScreen
        phase={state.phase}
        question={state.question}
        result={state.result}
        selectedAnswer={state.selectedAnswer}
        selections={state.selections}
        joinedGame={state.joinedGame}
        playerCount={state.playerCount}
        lockedAtPoints={state.lockedAtPoints}
        displayedPoints={state.displayedPoints}
        multiplier={state.multiplier}
        multiplierChosen={state.multiplierChosen}
        comebackActive={state.comebackActive}
        user={user}
        onAnswer={state.handleAnswer}
        onMultiplier={state.handleMultiplier}
      />
      <ObserverModal
        visible={observerModalVisible}
        onClose={() => setObserverModalVisible(false)}
      />
    </>
  );
}
