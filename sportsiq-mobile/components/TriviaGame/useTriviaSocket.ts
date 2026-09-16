import { getTriviaSocket } from "@/lib/socket";
import type {
  TriviaAnswerSelection,
  TriviaGameEndPayload,
  TriviaGameStatusPayload,
  TriviaLobbyPayload,
  TriviaQuestionPayload,
  TriviaResultPayload,
} from "@/lib/triviaTypes";
import { type UserInfo } from "@/store/user";
import { useCallback, useEffect, useRef, useState } from "react";
import { TOTAL_TIME_S, type GamePhase } from "./constants";

interface UseTriviaSocketArgs {
  user: UserInfo | null;
  disabled: boolean;
  setUser: (user: UserInfo | null) => void;
  onObserverTap: () => void;
}

export interface TriviaSocketState {
  phase: GamePhase;

  // Lobby
  lobby: TriviaLobbyPayload | null;
  lobbyCountdown: number;
  joinedGame: boolean;

  // Question / result
  question: TriviaQuestionPayload | null;
  selections: TriviaAnswerSelection[];
  result: TriviaResultPayload | null;
  selectedAnswer: string | null;
  lockedAtPoints: number | null;
  displayedPoints: number;
  playerCount: number;
  comebackActive: boolean;

  // Multiplier
  multiplier: number;
  multiplierChosen: boolean;

  // Game end
  gameEnd: TriviaGameEndPayload | null;
  nextGameCountdown: number;

  // Handlers
  handleJoinGame: () => void;
  handleAnswer: (answer: string) => void;
  handleMultiplier: (m: number) => void;
}

// Drives every piece of state that comes from the /trivia socket: phase
// transitions, lobby players, question + selection updates, result reveals,
// game-end, and the derived timers tied to those phases. The parent component
// only consumes the returned state and focuses on the view layer.
export function useTriviaSocket({
  user,
  disabled,
  setUser,
  onObserverTap,
}: UseTriviaSocketArgs): TriviaSocketState {
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

  const [comebackActive, setComebackActive] = useState(false);

  const [displayedPoints, setDisplayedPoints] = useState(0);
  const pointsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lockedAtPoints, setLockedAtPoints] = useState<number | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [multiplierChosen, setMultiplierChosen] = useState(false);

  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!user || disabled) return;

    const socket = getTriviaSocket();

    socket.on("connect", () => {
      socket.emit("trivia:join", {
        userId: user.id,
        phone: user.phone,
        name: user.name,
        avatarUrl: user.avatar_url ?? null,
      });
    });

    socket.on("disconnect", () => {
      setPhase("connecting");
      setJoinedGame(false);
    });

    socket.on("trivia:lobby", (data: TriviaLobbyPayload) => {
      setPhase("lobby");
      setLobby(data);
      setLobbyCountdown(data.countdown);
      setGameEnd(null);
      setQuestion(null);
      setResult(null);
      setSelectedAnswer(null);
      // Reconnect case: backend already tracks us as a lobby player.
      const alreadyJoined = data.players.some((p) => p.userId === user.id);
      if (alreadyJoined) setJoinedGame(true);
    });

    socket.on("trivia:question", (data: TriviaQuestionPayload) => {
      setPhase("question");
      setQuestion(data);
      setSelections([]);
      setResult(null);
      setSelectedAnswer(null);
    });

    socket.on("trivia:selections", (data: TriviaAnswerSelection[]) => {
      setSelections(data);
    });

    socket.on("trivia:result", (data: TriviaResultPayload) => {
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
    });

    socket.on("trivia:playerCount", (data: { count: number }) => {
      setPlayerCount(data.count);
    });

    socket.on("trivia:loading", () => {
      setPhase("loading");
    });

    socket.on("trivia:comeback", (data: { active: boolean }) => {
      setComebackActive(data.active);
    });

    socket.on("trivia:game-end", (data: TriviaGameEndPayload) => {
      setPhase("game-end");
      setGameEnd(data);
      setJoinedGame(false);
      setComebackActive(false);
    });

    socket.on("trivia:game-status", (data: TriviaGameStatusPayload) => {
      // The server tells us whether this socket is a playing participant
      // (reconnecting within grace period) or a genuine late-joiner observer.
      // Use it as the source of truth — the client's "disconnect" handler
      // resets joinedGame to false, so a reconnected player needs this signal
      // to flip back to true.
      setJoinedGame(data.isPlayer);
    });

    socket.connect();

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("trivia:lobby");
      socket.off("trivia:question");
      socket.off("trivia:selections");
      socket.off("trivia:result");
      socket.off("trivia:playerCount");
      socket.off("trivia:loading");
      socket.off("trivia:comeback");
      socket.off("trivia:game-end");
      socket.off("trivia:game-status");
      socket.disconnect();
    };
  }, [user?.id, disabled, setUser]);

  // Derive lobby countdown from the server's authoritative startTime (epoch
  // ms) so mobile and the bar screen tick in sync. Falls back to the one-shot
  // countdown value for older servers that don't send startTime.
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

  // Same pattern for the post-game "Next game in Xs" countdown.
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

  // IQ points tick down 10/sec over the 15s question window. Uses server's
  // timeRemaining so reconnect / late-render starts at the right value.
  useEffect(() => {
    if (phase !== "question" || !question) return;

    const serverRemaining = question.timeRemaining ?? TOTAL_TIME_S;
    const startPoints = Math.round(serverRemaining) * 10;

    setLockedAtPoints(null);
    setMultiplierChosen(false);
    setMultiplier(1);
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

  useEffect(() => {
    if (phase === "result" && pointsIntervalRef.current) {
      clearInterval(pointsIntervalRef.current);
      pointsIntervalRef.current = null;
    }
  }, [phase]);

  const handleJoinGame = useCallback(() => {
    const socket = getTriviaSocket();
    socket.emit("trivia:join-game");
    setJoinedGame(true);
  }, []);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (phase !== "question") return;
      if (!joinedGame) {
        onObserverTap();
        return;
      }
      setSelectedAnswer(answer);
      setLockedAtPoints(displayedPoints);
      const socket = getTriviaSocket();
      socket.emit("trivia:answer", { answer });
    },
    [phase, joinedGame, displayedPoints, onObserverTap]
  );

  const handleMultiplier = useCallback((m: number) => {
    setMultiplier(m);
    setMultiplierChosen(true);
    const socket = getTriviaSocket();
    // Backend wires this in a future iteration.
    socket.emit("trivia:multiplier", { multiplier: m });
  }, []);

  return {
    phase,
    lobby,
    lobbyCountdown,
    joinedGame,
    question,
    selections,
    result,
    selectedAnswer,
    lockedAtPoints,
    displayedPoints,
    playerCount,
    comebackActive,
    multiplier,
    multiplierChosen,
    gameEnd,
    nextGameCountdown,
    handleJoinGame,
    handleAnswer,
    handleMultiplier,
  };
}
