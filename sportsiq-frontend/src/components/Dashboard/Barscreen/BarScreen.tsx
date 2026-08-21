import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useBarSockets } from "./hooks/useBarSockets";
import { InjectStyles } from "./ui/InjectStyles";
import { BarScreenLayout } from "./ui/BarScreenLayout";
import { IdleScreen } from "./screens/IdleScreen";
import { TriviaQuestionScreen } from "./screens/TriviaQuestionScreen";
import { TriviaRevealScreen } from "./screens/TriviaRevealScreen";
import { PredictionLeaderboardScreen } from "./screens/PredictionLeaderboardScreen";
import { IntermissionScreen } from "./screens/IntermissionScreen";

export function BarScreen() {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const state = useBarSockets();

  useEffect(() => {
    if (!state.qrCodeUrl) return;
    QRCode.toDataURL(state.qrCodeUrl, {
      width: 220,
      margin: 1,
      color: { dark: "#F8FAFC", light: "#0B2230" },
    })
      .then(setQrDataUrl)
      .catch(console.error);
  }, [state.qrCodeUrl]);

  // Pick the center content based on the current screen state.
  // Left and right columns are ALWAYS the same — only the center changes.
  let centerContent: React.ReactNode = null;

  if (state.screen === "trivia-q" && state.triviaQ) {
    centerContent = (
      <TriviaQuestionScreen
        triviaQ={state.triviaQ}
        answerCounts={state.answerCounts}
        totalAnswers={state.totalAnswers}
        countdown={state.countdown}
      />
    );
  } else if (state.screen === "trivia-rev" && state.triviaRev && state.triviaQ) {
    centerContent = (
      <TriviaRevealScreen
        triviaQ={state.triviaQ}
        triviaRev={state.triviaRev}
        leaderboard={state.liveGameLeaderboard}
      />
    );
  } else if (
    state.screen === "predictions" &&
    state.predictionGames.length > 0
  ) {
    centerContent = (
      <PredictionLeaderboardScreen
        games={state.predictionGames}
        qrDataUrl={qrDataUrl}
      />
    );
  } else if (state.screen === "intermission") {
    centerContent = (
      <IntermissionScreen
        nationalLeaderboard={state.nationalLeaderboard}
        barRank={state.barRank}
        countdown={state.intermissionCountdown}
        qrDataUrl={qrDataUrl}
      />
    );
  } else {
    // idle
    centerContent = (
      <IdleScreen
        leaderboard={state.nightlyLeaderboard}
        lobbyActive={state.lobbyActive}
        lobbyPlayers={state.lobbyPlayers}
        lobbyCountdown={state.lobbyCountdown}
        playerCount={state.playerCount}
      />
    );
  }

  return (
    <div className="w-full h-full bg-[#0B2230] font-['Lexend'] text-slate-50 overflow-hidden relative">
      <InjectStyles />
      <div className="absolute inset-0">
        <BarScreenLayout
          liveGameLeaderboard={state.liveGameLeaderboard}
          liveGameLeaderboardTitle={state.liveGameLeaderboardTitle}
          todayLeaderboard={state.todayLeaderboard}
          qrDataUrl={qrDataUrl}
        >
          {centerContent}
        </BarScreenLayout>
      </div>
    </div>
  );
}
