import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AnswerButton from "./AnswerButton";
import {
  BRAND,
  MAX_POINTS,
  MIN_POINTS_TO_PLAY,
  TOTAL_TIME_S,
} from "./constants";
import { disconnectWebTriviaSocket, getWebTriviaSocket } from "./socket";
import { useWebPlayUser } from "./store";
import type {
  GamePhase,
  TriviaAnswerSelection,
  TriviaGameEndPayload,
  TriviaLobbyPayload,
  TriviaQuestionPayload,
  TriviaResultPayload,
} from "./types";
import "./animations.css";

function Avatar({
  url,
  size = 32,
}: {
  url: string | null | undefined;
  size?: number;
}) {
  if (!url) {
    return (
      <div
        className="rounded-full bg-slate-700 flex items-center justify-center text-slate-400"
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        ?
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="rounded-full bg-slate-700 object-cover"
      style={{ width: size, height: size }}
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).style.visibility = "hidden";
      }}
    />
  );
}

function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="wp-spin rounded-full"
      style={{
        width: size,
        height: size,
        border: "3px solid rgba(124, 110, 245, 0.2)",
        borderTopColor: BRAND.purpleLight,
      }}
    />
  );
}

export default function TriviaPage() {
  const navigate = useNavigate();
  const { user, setUser } = useWebPlayUser();

  const [phase, setPhase] = useState<GamePhase>("connecting");
  const [question, setQuestion] = useState<TriviaQuestionPayload | null>(null);
  const [selections, setSelections] = useState<TriviaAnswerSelection[]>([]);
  const [result, setResult] = useState<TriviaResultPayload | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [playerCount, setPlayerCount] = useState(0);

  const [lobby, setLobby] = useState<TriviaLobbyPayload | null>(null);
  const [lobbyCountdown, setLobbyCountdown] = useState(30);
  const [joinedGame, setJoinedGame] = useState(false);

  const [gameEnd, setGameEnd] = useState<TriviaGameEndPayload | null>(null);
  const [nextGameCountdown, setNextGameCountdown] = useState(0);

  const [streak, setStreak] = useState(0);
  const [streakVisible, setStreakVisible] = useState(false);
  const [comebackActive, setComebackActive] = useState(false);

  const [displayedPoints, setDisplayedPoints] = useState(MAX_POINTS);
  const [pulsing, setPulsing] = useState(false);
  const lastThreshold = useRef(MAX_POINTS);
  const pointsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );

  const [lockedAtPoints, setLockedAtPoints] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState<number>(1);
  const [multiplierChosen, setMultiplierChosen] = useState(false);

  const [questionKey, setQuestionKey] = useState<number>(0);
  const [floatPoints, setFloatPoints] = useState<{
    value: number;
    correct: boolean;
    id: number;
  } | null>(null);

  const userRef = useRef(user);
  userRef.current = user;

  const points = user?.points ?? 0;
  const disabled = points < MIN_POINTS_TO_PLAY;

  // Redirect if no user or no phone
  useEffect(() => {
    if (!user) {
      navigate("/play/signin", { replace: true });
    }
  }, [user, navigate]);

  // Threshold pulse on displayedPoints
  useEffect(() => {
    const thresholds = [120, 90, 60, 40, 20, 10];
    for (const t of thresholds) {
      if (lastThreshold.current > t && displayedPoints <= t) {
        lastThreshold.current = t;
        setPulsing(true);
        window.setTimeout(() => setPulsing(false), 160);
        break;
      }
    }
  }, [displayedPoints]);

  // Socket lifecycle
  useEffect(() => {
    if (!user || disabled) return;

    const socket = getWebTriviaSocket();

    const onConnect = () => {
      socket.emit("trivia:join", {
        userId: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatar_url ?? null,
      });
    };

    const onDisconnect = () => {
      setPhase("connecting");
      setJoinedGame(false);
    };

    const onLobby = (data: TriviaLobbyPayload) => {
      setPhase("lobby");
      setLobby(data);
      setLobbyCountdown(data.countdown);
      setGameEnd(null);
      setQuestion(null);
      setResult(null);
      setSelectedAnswer(null);
      const alreadyJoined = data.players.some((p) => p.userId === user.id);
      if (alreadyJoined) setJoinedGame(true);
    };

    const onQuestion = (data: TriviaQuestionPayload) => {
      setPhase("question");
      setQuestion(data);
      setSelections([]);
      setResult(null);
      setSelectedAnswer(null);
      setQuestionKey((k) => k + 1);
    };

    const onSelections = (data: TriviaAnswerSelection[]) => {
      setSelections(data);
    };

    const onResult = (data: TriviaResultPayload) => {
      setPhase("result");
      setResult(data);
      const currentUser = userRef.current;
      if (currentUser) {
        const myResult = data.userResults.find(
          (r) => r.userId === currentUser.id
        );
        if (myResult) {
          setUser({ ...currentUser, points: myResult.newPoints });
        }
      }
    };

    const onPlayerCount = (data: { count: number }) => {
      setPlayerCount(data.count);
    };

    const onLoading = () => setPhase("loading");

    const onComeback = (data: { active: boolean }) => {
      setComebackActive(data.active);
    };

    const onGameEnd = (data: TriviaGameEndPayload) => {
      setPhase("game-end");
      setGameEnd(data);
      setJoinedGame(false);
      setComebackActive(false);
    };

    const onGameStatus = () => setPhase("waiting");

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("trivia:lobby", onLobby);
    socket.on("trivia:question", onQuestion);
    socket.on("trivia:selections", onSelections);
    socket.on("trivia:result", onResult);
    socket.on("trivia:playerCount", onPlayerCount);
    socket.on("trivia:loading", onLoading);
    socket.on("trivia:comeback", onComeback);
    socket.on("trivia:game-end", onGameEnd);
    socket.on("trivia:game-status", onGameStatus);

    socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("trivia:lobby", onLobby);
      socket.off("trivia:question", onQuestion);
      socket.off("trivia:selections", onSelections);
      socket.off("trivia:result", onResult);
      socket.off("trivia:playerCount", onPlayerCount);
      socket.off("trivia:loading", onLoading);
      socket.off("trivia:comeback", onComeback);
      socket.off("trivia:game-end", onGameEnd);
      socket.off("trivia:game-status", onGameStatus);
      disconnectWebTriviaSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, disabled]);

  // Lobby countdown — derive from server's authoritative startTime (epoch ms)
  // so every client stays in sync. Falls back to a local offset for older
  // servers that only emit `countdown`.
  useEffect(() => {
    if (phase !== "lobby" || !lobby) return;
    const endMs =
      lobby.startTime ?? Date.now() + (lobby.countdown ?? 0) * 1000;
    const compute = () =>
      Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
    setLobbyCountdown(compute());
    const id = setInterval(() => {
      const remaining = compute();
      setLobbyCountdown(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [phase, lobby?.gameId, lobby?.startTime, lobby?.countdown]);

  // Next-game countdown on post-game leaderboard — mirrors bar screen's
  // intermission countdown via server's `nextGameStartTime`.
  useEffect(() => {
    if (phase !== "game-end" || !gameEnd?.nextGameStartTime) {
      setNextGameCountdown(0);
      return;
    }
    const endMs = gameEnd.nextGameStartTime;
    const compute = () =>
      Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
    setNextGameCountdown(compute());
    const id = setInterval(() => {
      const remaining = compute();
      setNextGameCountdown(remaining);
      if (remaining <= 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [phase, gameEnd?.nextGameStartTime]);

  // Question points countdown
  useEffect(() => {
    if (phase !== "question" || !question) return;

    const serverRemaining = question.timeRemaining ?? TOTAL_TIME_S;
    const startPoints = Math.round(serverRemaining) * 10;

    setLockedAtPoints(null);
    setMultiplierChosen(false);
    setMultiplier(1);
    lastThreshold.current = startPoints;
    setDisplayedPoints(startPoints);

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const secondsLeft = Math.max(0, serverRemaining - elapsed / 1000);
      const pts = Math.round(secondsLeft) * 10;
      setDisplayedPoints(pts);
      if (pts <= 0) clearInterval(interval);
    }, 100);

    pointsIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [phase, question?.questionNumber]);

  // Stop points countdown when result comes
  useEffect(() => {
    if (phase === "result" && pointsIntervalRef.current) {
      clearInterval(pointsIntervalRef.current);
      pointsIntervalRef.current = null;
    }
  }, [phase]);

  // Streak + float on result
  useEffect(() => {
    if (!result || !user) return;
    const myRes = result.userResults.find((r) => r.userId === user.id);
    if (!myRes) return;

    if (myRes.correct) {
      setStreak((prev) => {
        const next = prev + 1;
        if (next >= 2) setStreakVisible(true);
        return next;
      });
    } else {
      setStreak(0);
      setStreakVisible(false);
    }

    const base = lockedAtPoints ?? displayedPoints;
    const hasMulti = multiplierChosen && multiplier > 1;
    const bet = hasMulti ? base * multiplier : 0;
    const earnedValue = myRes.correct
      ? base + bet
      : hasMulti
        ? -bet
        : 0;
    const correct = myRes.correct && earnedValue >= 0;
    setFloatPoints({ value: earnedValue, correct, id: Date.now() });
    const timer = window.setTimeout(() => setFloatPoints(null), 1200);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, user?.id]);

  useEffect(() => {
    if (phase === "question" && streak < 2) setStreakVisible(false);
  }, [phase, streak]);

  const handleJoinGame = useCallback(() => {
    const socket = getWebTriviaSocket();
    socket.emit("trivia:join-game");
    setJoinedGame(true);
  }, []);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "question") return;
      setSelectedAnswer(answer);
      setLockedAtPoints(displayedPoints);
      const socket = getWebTriviaSocket();
      socket.emit("trivia:answer", { answer });
    },
    [phase, displayedPoints]
  );

  const handleMultiplier = useCallback((m: number) => {
    setMultiplier(m);
    setMultiplierChosen(true);
    const socket = getWebTriviaSocket();
    socket.emit("trivia:multiplier", { multiplier: m });
  }, []);

  const handleShare = useCallback(
    async (rank: number, score: number) => {
      const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : "🥉";
      const message = `${medal} I finished #${rank} in SportsIQ Trivia with ${score.toLocaleString()} pts! Think you can beat me?`;
      if (
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function"
      ) {
        try {
          await navigator.share({ text: message });
          return;
        } catch {
          /* user cancelled */
        }
      }
      try {
        await navigator.clipboard?.writeText(message);
      } catch {
        /* ignore */
      }
    },
    []
  );

  if (!user) return null;

  // --- disabled ---
  if (disabled) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: BRAND.text }}
          >
            Not enough points
          </h2>
          <p className="text-[15px]" style={{ color: BRAND.muted }}>
            You need at least {MIN_POINTS_TO_PLAY} points to play trivia. You
            have {points} points.
          </p>
        </div>
      </Shell>
    );
  }

  // --- connecting ---
  if (phase === "connecting") {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Spinner size={36} />
          <p
            className="mt-3 text-[15px]"
            style={{ color: BRAND.muted }}
          >
            Connecting to live game...
          </p>
        </div>
      </Shell>
    );
  }

  // --- lobby ---
  if (phase === "lobby" && lobby) {
    return (
      <Shell>
        <div className="flex-1 py-3 px-4">
          <div className="flex flex-col items-center mb-6">
            <span
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "#64748b" }}
            >
              Next Game
            </span>
            <span
              className="text-3xl font-bold"
              style={{ color: BRAND.text }}
            >
              #{lobby.gameId}
            </span>
          </div>

          <div className="flex flex-col items-center mb-8">
            <span
              className="text-6xl font-bold"
              style={{ color: "#60a5fa" }}
            >
              {lobbyCountdown}
            </span>
            <span className="text-sm mt-1" style={{ color: BRAND.muted }}>
              seconds until start
            </span>
          </div>

          <div className="flex justify-center mb-8">
            {joinedGame ? (
              <div
                className="rounded-xl px-8 py-4 text-center"
                style={{
                  backgroundColor: "rgba(20, 83, 45, 0.4)",
                  border: "2px solid #22c55e",
                }}
              >
                <span className="text-base font-semibold text-green-400">
                  You're in! Waiting for game to start...
                </span>
              </div>
            ) : (
              <button
                onClick={handleJoinGame}
                className="rounded-xl px-12 py-4 font-bold text-lg wp-press-scale"
                style={{ backgroundColor: "#2563eb", color: "#fff" }}
              >
                Join Game
              </button>
            )}
          </div>

          <div
            className="pt-4"
            style={{ borderTop: "1px solid #1e293b" }}
          >
            <div
              className="text-xs uppercase tracking-wider mb-3"
              style={{ color: "#64748b" }}
            >
              Players ({lobby.playerCount})
            </div>
            {lobby.players.length === 0 ? (
              <div
                className="text-sm text-center py-4"
                style={{ color: "#475569" }}
              >
                No players yet — be the first to join!
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {lobby.players.map((p) => (
                  <div
                    key={p.userId}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg"
                    style={{ backgroundColor: "rgba(30, 41, 59, 0.5)" }}
                  >
                    <Avatar url={p.avatarUrl} size={32} />
                    <span
                      className="text-sm font-medium flex-1"
                      style={{ color: "#e2e8f0" }}
                    >
                      {p.name}
                    </span>
                    {p.userId === user?.id && (
                      <span
                        className="text-xs"
                        style={{ color: "#60a5fa" }}
                      >
                        (you)
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Shell>
    );
  }

  // --- waiting ---
  if (phase === "waiting") {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: BRAND.text }}
          >
            Game in Progress
          </h2>
          <p className="text-[15px] mb-4" style={{ color: BRAND.muted }}>
            A game is currently underway. You'll be able to join the next one
            when it ends.
          </p>
          <Spinner size={24} />
        </div>
      </Shell>
    );
  }

  // --- game-end ---
  if (phase === "game-end" && gameEnd) {
    const myRank = gameEnd.leaderboard.findIndex(
      (e) => e.userId === user?.id
    );
    const isTopThree = myRank >= 0 && myRank <= 2;
    const podiumOrder = [
      gameEnd.leaderboard[1],
      gameEnd.leaderboard[0],
      gameEnd.leaderboard[2],
    ];
    const podiumHeights = [100, 130, 80];
    const podiumColors = ["#94a3b8", "#eab308", "#b45309"];
    const podiumMedals = ["🥈", "🥇", "🥉"];

    return (
      <Shell>
        <div className="flex-1 overflow-y-auto py-3 px-4 pb-10">
          <div className="flex flex-col items-center mb-4">
            <span
              className="text-xs uppercase tracking-wider mb-1"
              style={{ color: "#64748b" }}
            >
              Game Over
            </span>
            <span
              className="text-2xl font-bold"
              style={{ color: BRAND.text }}
            >
              #{gameEnd.gameId}
            </span>
          </div>

          {isTopThree && (
            <div
              className="rounded-2xl p-4 mb-5 flex flex-col items-center"
              style={{
                backgroundColor: "#1e293b",
                border: `2px solid ${myRank === 0 ? "#eab308" : myRank === 1 ? "#94a3b8" : "#b45309"}`,
              }}
            >
              <div className="text-4xl mb-1">
                {myRank === 0 ? "🥇" : myRank === 1 ? "🥈" : "🥉"}
              </div>
              <div
                className="text-xl font-extrabold mb-0.5"
                style={{ color: "#f1f5f9" }}
              >
                {myRank === 0
                  ? "1st Place"
                  : myRank === 1
                    ? "2nd Place"
                    : "3rd Place"}
              </div>
              <div
                className="text-base font-bold mb-3"
                style={{ color: "#22c55e" }}
              >
                +{gameEnd.leaderboard[myRank].score.toLocaleString()} pts
              </div>
              <button
                onClick={() =>
                  handleShare(
                    myRank + 1,
                    gameEnd.leaderboard[myRank].score
                  )
                }
                className="rounded-xl px-6 py-2.5 font-bold text-[15px] wp-press-scale"
                style={{ backgroundColor: "#3b82f6", color: "#fff" }}
              >
                Share Result
              </button>
            </div>
          )}

          {gameEnd.leaderboard.length > 0 && (
            <div className="flex items-end justify-center gap-2 mb-5">
              {podiumOrder.map((entry, i) => {
                if (!entry)
                  return <div key={i} style={{ width: 90 }} />;
                const isMe = entry.userId === user?.id;
                return (
                  <div
                    key={entry.userId}
                    className="flex flex-col items-center"
                    style={{ width: 100 }}
                  >
                    <div className="text-xl mb-0.5">{podiumMedals[i]}</div>
                    <div className="mb-1">
                      <Avatar url={entry.avatarUrl} size={44} />
                    </div>
                    <div
                      className="text-[11px] font-semibold text-center mb-1 truncate max-w-full"
                      style={{ color: isMe ? "#93c5fd" : "#cbd5e1" }}
                    >
                      {entry.name}
                      {isMe ? " (you)" : ""}
                    </div>
                    <div
                      className="flex items-center justify-center rounded-t-md"
                      style={{
                        width: 90,
                        height: podiumHeights[i],
                        backgroundColor: podiumColors[i] + "33",
                        borderTop: `3px solid ${podiumColors[i]}`,
                      }}
                    >
                      <span
                        className="font-extrabold text-[13px]"
                        style={{ color: podiumColors[i] }}
                      >
                        +{entry.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {gameEnd.leaderboard.length > 3 && (
            <div className="flex flex-col gap-2 mb-4">
              <div
                className="text-xs uppercase tracking-wider mb-1"
                style={{ color: "#64748b" }}
              >
                Others
              </div>
              {gameEnd.leaderboard.slice(3).map((entry, i) => {
                const isMe = entry.userId === user?.id;
                return (
                  <div
                    key={entry.userId}
                    className="flex items-center gap-3 py-2.5 px-3.5 rounded-lg"
                    style={{ backgroundColor: "#1e293b" }}
                  >
                    <span
                      className="font-bold text-center w-6"
                      style={{ color: "#64748b" }}
                    >
                      {i + 4}
                    </span>
                    <Avatar url={entry.avatarUrl} size={32} />
                    <span
                      className="flex-1 text-sm"
                      style={{ color: isMe ? "#93c5fd" : "#cbd5e1" }}
                    >
                      {entry.name}
                      {isMe ? " (you)" : ""}
                    </span>
                    <span
                      className="font-bold text-sm"
                      style={{ color: "#4ade80" }}
                    >
                      +{entry.score.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex flex-col items-center py-4">
            <Spinner size={20} />
            <span className="text-sm mt-2" style={{ color: "#64748b" }}>
              {gameEnd.nextGameStartTime && nextGameCountdown > 0
                ? `Next game in ${nextGameCountdown}s`
                : "Next game starting soon..."}
            </span>
          </div>
        </div>
      </Shell>
    );
  }

  // --- loading ---
  if (phase === "loading" || !question) {
    return (
      <Shell>
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <Spinner size={36} />
          <p className="mt-3 text-[15px]" style={{ color: BRAND.muted }}>
            Loading next question...
          </p>
        </div>
      </Shell>
    );
  }

  // --- question / result ---
  const myResult =
    result && user
      ? result.userResults.find((r) => r.userId === user.id)
      : null;

  const timerFraction = displayedPoints / MAX_POINTS;
  const godMode = streak >= 3;
  const secsLeft = Math.ceil(displayedPoints / 10);
  const timerColor =
    timerFraction > 0.6
      ? BRAND.purpleLight
      : timerFraction > 0.3
        ? BRAND.gold
        : BRAND.red;

  const totalSelections = selections.reduce((sum, s) => sum + s.count, 0);
  const showPercentage = selectedAnswer !== null || phase === "result";
  const showMultiplierPanel =
    selectedAnswer !== null && phase === "question";

  return (
    <Shell>
      <div
        className="relative flex-1 flex flex-col"
        style={{ padding: "10px 14px 14px" }}
      >
        {godMode && (
          <div
            className="wp-god-mode pointer-events-none absolute inset-0"
            style={{
              border: "3px solid #eab308",
              borderRadius: 12,
              zIndex: 10,
            }}
          />
        )}

        {/* Progress dots */}
        <div className="flex gap-[3px] mb-1.5">
          {Array.from({ length: question.totalQuestions }).map((_, i) => {
            const idx = question.questionIndex - 1;
            const bg =
              i < idx
                ? BRAND.green
                : i === idx
                  ? BRAND.purpleLight
                  : "rgba(255,255,255,0.1)";
            return (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: 3, backgroundColor: bg }}
              />
            );
          })}
        </div>

        {/* Timer row */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-[11px]" style={{ color: BRAND.muted }}>
            Q{question.questionIndex} of {question.totalQuestions}
            {playerCount > 0 ? `  ·  ${playerCount}p` : ""}
          </span>
          {phase !== "result" && (
            <span
              className="text-[11px] font-black"
              style={{ color: timerColor }}
            >
              {secsLeft}s left
            </span>
          )}
        </div>

        {/* Timer bar */}
        {phase !== "result" && (
          <div
            className="rounded-sm mb-2"
            style={{
              height: 3,
              backgroundColor: "rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="rounded-sm"
              style={{
                height: 3,
                width: `${(1 - timerFraction) * 100}%`,
                backgroundColor: timerColor,
                transition: "width 160ms linear, background-color 200ms",
              }}
            />
          </div>
        )}

        {/* IQ chip */}
        {phase !== "result" && (
          <div className="flex justify-center mb-2">
            <div
              className={`${pulsing && !selectedAnswer ? "wp-pulse" : ""} flex items-center gap-1.5 rounded-full`}
              style={{
                backgroundColor: BRAND.goldFaint,
                border: `1px solid ${selectedAnswer ? "rgba(245,158,11,0.6)" : "rgba(245,158,11,0.35)"}`,
                padding: "4px 14px",
              }}
            >
              <span className="text-xs">{selectedAnswer ? "🔒" : "⚡"}</span>
              <span
                className="text-base font-black"
                style={{ color: BRAND.gold }}
              >
                {displayedPoints.toLocaleString()}
              </span>
              <span
                className="text-[10px] font-bold"
                style={{ color: BRAND.gold, opacity: 0.8 }}
              >
                IQ
              </span>
              <span className="text-[10px]" style={{ color: BRAND.faint }}>
                ↓
              </span>
            </div>
          </div>
        )}

        {/* Streak pill */}
        {streak >= 2 && (
          <div
            className="self-center rounded-2xl mb-1"
            style={{
              backgroundColor: "#422006",
              padding: "3px 12px",
              opacity: streakVisible ? 1 : 0,
              transition: "opacity 250ms ease-out",
            }}
          >
            <span
              className="font-bold text-xs"
              style={{ color: "#fb923c" }}
            >
              🔥 {streak} in a row
            </span>
          </div>
        )}

        {comebackActive && (
          <div
            className="self-center rounded-2xl mb-1"
            style={{
              backgroundColor: "#7c2d12",
              padding: "3px 12px",
            }}
          >
            <span
              className="font-bold text-xs"
              style={{ color: "#fb923c" }}
            >
              🔥 Comeback Mode · 1.5x
            </span>
          </div>
        )}

        {/* Question text */}
        <div key={questionKey} className="wp-slide-in">
          <p
            className="font-extrabold mb-2.5"
            style={{
              fontSize: phase === "result" ? 15 : 18,
              lineHeight: phase === "result" ? "22px" : "26px",
              color: BRAND.text,
            }}
          >
            {question.question}
          </p>
        </div>

        {/* Answer buttons */}
        <div className="flex-1 flex flex-col gap-2">
          {question.answers.map((answer) => {
            const selectionData = selections.find(
              (s) => s.answer === answer
            );
            const isSelected = selectedAnswer === answer;
            const isCorrect = result
              ? answer === result.correctAnswer
              : false;
            const isWrong = result ? isSelected && !isCorrect : false;
            const pct =
              totalSelections > 0 && selectionData
                ? (selectionData.count / totalSelections) * 100
                : 0;
            return (
              <AnswerButton
                key={answer}
                answer={answer}
                isSelected={isSelected}
                isCorrect={isCorrect}
                isWrong={isWrong}
                hasResult={!!result}
                selectionData={selectionData}
                lockedAtPoints={isSelected ? lockedAtPoints : null}
                onPress={() => handleAnswer(answer)}
                disabled={phase !== "question"}
                percentage={pct}
                showPercentage={showPercentage}
              />
            );
          })}
        </div>

        {/* Multiplier panel */}
        {showMultiplierPanel && lockedAtPoints != null && (
          <div
            className="rounded-xl p-3 mt-2.5"
            style={{
              backgroundColor: BRAND.goldFaint,
              border: "1px solid rgba(245,158,11,0.3)",
            }}
          >
            <div
              className="text-[10px] font-extrabold text-center mb-2.5 uppercase"
              style={{ color: BRAND.gold, letterSpacing: "1.5px" }}
            >
              Risk multiplier?
            </div>
            <div className="flex gap-2">
              {([1.5, 2, 3] as const).map((m) => {
                const colors =
                  m === 1.5
                    ? {
                        bg: "rgba(34,197,94,0.12)",
                        border: "rgba(34,197,94,0.4)",
                        text: "#4ADE80",
                      }
                    : m === 2
                      ? {
                          bg: "rgba(245,158,11,0.15)",
                          border: BRAND.gold,
                          text: BRAND.gold,
                        }
                      : {
                          bg: "rgba(239,68,68,0.12)",
                          border: "rgba(239,68,68,0.4)",
                          text: "#FCA5A5",
                        };
                const stake = Math.round(lockedAtPoints * m);
                const isChosen = multiplierChosen && multiplier === m;
                const isDimmed = multiplierChosen && multiplier !== m;
                return (
                  <button
                    key={m}
                    onClick={() => !multiplierChosen && handleMultiplier(m)}
                    disabled={multiplierChosen}
                    className="flex-1 rounded-lg flex flex-col items-center wp-press-scale"
                    style={{
                      backgroundColor: isDimmed
                        ? "rgba(255,255,255,0.03)"
                        : colors.bg,
                      border: `${isChosen ? 2 : m === 2 ? 2 : 1}px solid ${isDimmed ? "rgba(255,255,255,0.1)" : colors.border}`,
                      padding: "10px 0",
                      opacity: isDimmed ? 0.4 : 1,
                    }}
                  >
                    <span
                      className="text-[20px] font-black"
                      style={{
                        color: isDimmed ? BRAND.muted : colors.text,
                        lineHeight: "22px",
                      }}
                    >
                      {m}×{isChosen ? " ✓" : ""}
                    </span>
                    <span
                      className="text-[9px] font-bold mt-0.5"
                      style={{
                        color: isDimmed ? BRAND.faint : colors.text,
                        opacity: 0.85,
                      }}
                    >
                      {stake.toLocaleString()} IQ
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Result breakdown */}
        {myResult &&
          (() => {
            const hasMultiplier = multiplierChosen && multiplier > 1;
            const baseEarned = lockedAtPoints ?? 0;
            const bet = hasMultiplier ? baseEarned * multiplier : 0;
            const baseDisplay = myResult.correct ? baseEarned : 0;
            const betDisplay = myResult.correct ? bet : -bet;
            const total = baseDisplay + betDisplay;
            const won = total > 0;
            const lost = total < 0;
            const totalColor = lost
              ? BRAND.red
              : won
                ? BRAND.green
                : BRAND.muted;
            const sign = (n: number) =>
              n > 0 ? `+${n.toLocaleString()}` : n.toLocaleString();

            return (
              <div
                className="mt-2.5 rounded-xl p-3"
                style={{
                  backgroundColor: lost
                    ? "rgba(239,68,68,0.08)"
                    : won
                      ? "rgba(34,197,94,0.08)"
                      : BRAND.card,
                  border: `1px solid ${lost ? "rgba(239,68,68,0.25)" : won ? "rgba(34,197,94,0.25)" : BRAND.cardBorder}`,
                }}
              >
                <div
                  className="flex justify-between items-center"
                  style={{ marginBottom: hasMultiplier ? 6 : 0 }}
                >
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: BRAND.muted }}
                  >
                    {myResult.correct ? "✅ Base points" : "❌ Wrong answer"}
                  </span>
                  <span
                    className="text-[13px] font-extrabold"
                    style={{
                      color: myResult.correct ? BRAND.green : BRAND.muted,
                    }}
                  >
                    {myResult.correct
                      ? `+${baseEarned.toLocaleString()}`
                      : "0"}{" "}
                    IQ
                  </span>
                </div>

                {hasMultiplier && (
                  <div className="flex justify-between items-center mb-2">
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: BRAND.muted }}
                    >
                      {multiplier}× bet
                    </span>
                    <span
                      className="text-[13px] font-extrabold"
                      style={{
                        color: betDisplay >= 0 ? BRAND.green : BRAND.red,
                      }}
                    >
                      {sign(betDisplay)} IQ
                    </span>
                  </div>
                )}

                {hasMultiplier && (
                  <>
                    <div
                      className="mb-2"
                      style={{
                        height: 1,
                        backgroundColor: lost
                          ? "rgba(239,68,68,0.2)"
                          : "rgba(34,197,94,0.2)",
                      }}
                    />
                    <div className="flex justify-between items-center">
                      <span
                        className="text-[15px] font-black"
                        style={{ color: BRAND.text }}
                      >
                        Total
                      </span>
                      <span
                        className="text-lg font-black"
                        style={{ color: totalColor }}
                      >
                        {sign(total)} IQ
                      </span>
                    </div>
                  </>
                )}

                {!hasMultiplier && (
                  <div className="flex justify-center mt-1">
                    <span
                      className="text-[26px] font-black"
                      style={{ color: totalColor }}
                    >
                      {myResult.correct
                        ? `+${baseEarned.toLocaleString()}`
                        : "0"}{" "}
                      IQ
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

        {phase === "result" && result?.funFact && (
          <div
            className="mt-2.5 rounded-lg p-3"
            style={{
              backgroundColor: BRAND.card,
              borderLeft: `3px solid ${BRAND.purpleLight}`,
            }}
          >
            <div
              className="text-[10px] font-semibold uppercase mb-0.5"
              style={{ color: BRAND.faint, letterSpacing: "0.8px" }}
            >
              Did you know?
            </div>
            <p
              className="text-[13px]"
              style={{ color: BRAND.muted, lineHeight: "19px" }}
            >
              {result.funFact}
            </p>
          </div>
        )}
      </div>

      {/* Points float overlay */}
      {floatPoints && (
        <div
          key={floatPoints.id}
          className="wp-float-up pointer-events-none absolute left-0 right-0 flex justify-center"
          style={{ top: "45%" }}
        >
          <span
            className="text-[36px] font-black"
            style={{
              color: floatPoints.correct ? BRAND.green : BRAND.red,
            }}
          >
            {floatPoints.value > 0
              ? `+${floatPoints.value.toLocaleString()}`
              : floatPoints.value === 0
                ? "0"
                : floatPoints.value.toLocaleString()}
          </span>
        </div>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen w-full flex justify-center"
      style={{ backgroundColor: BRAND.bg }}
    >
      <div
        className="relative flex flex-col w-full"
        style={{
          maxWidth: 420,
          backgroundColor: BRAND.bg,
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}
