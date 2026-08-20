import { useEffect, useRef, useState } from "react";
import {
  getBarTriviaSocket,
  disconnectBarSockets,
} from "../lib/socket";
import type {
  ScreenState,
  TriviaQuestion,
  TriviaReveal,
  LeaderboardEntry,
  AnswerCounts,
  PredictionGame,
  BarRankInfo,
} from "../types";

// Bar-screen QR points at a web landing page that lets users choose between
// the native app (iOS deep link → App Store fallback) and a mobile web fallback.
// See sportsiq-frontend/src/webPlay/. Uses the current host so it works across
// prod, staging, and localhost.
const QR_LANDING_PATH = "/play";
const QR_LANDING_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}${QR_LANDING_PATH}`
    : QR_LANDING_PATH;

const INTERMISSION_DURATION_SECONDS = 60;

// localStorage key + helpers for the cached "last game" leaderboard.
// The cache is scoped to today (ET) so we never display yesterday's results.
const LAST_GAME_STORAGE_KEY = "barscreen.lastGameLeaderboard.v1";

interface LastGameCache {
  date: string; // YYYY-MM-DD in America/New_York
  leaderboard: LeaderboardEntry[];
}

function todayET(): string {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/New_York",
  });
}

function readLastGameCache(): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(LAST_GAME_STORAGE_KEY);
    if (!raw) return [];
    const parsed: LastGameCache = JSON.parse(raw);
    if (parsed.date !== todayET()) {
      // Stale (different day) — drop it
      localStorage.removeItem(LAST_GAME_STORAGE_KEY);
      return [];
    }
    return parsed.leaderboard ?? [];
  } catch {
    return [];
  }
}

function writeLastGameCache(leaderboard: LeaderboardEntry[]): void {
  try {
    const payload: LastGameCache = { date: todayET(), leaderboard };
    localStorage.setItem(LAST_GAME_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* quota / private mode — fine to ignore */
  }
}

export interface LobbyPlayer {
  userId: string;
  name: string;
  avatarUrl: string | null;
}

export interface BarSocketState {
  screen: ScreenState;
  triviaQ: TriviaQuestion | null;
  triviaRev: TriviaReveal | null;
  answerCounts: AnswerCounts | null;
  totalAnswers: number;
  predictionGames: PredictionGame[];
  nightlyLeaderboard: LeaderboardEntry[];
  /** Live game leaderboard for the LEFT column. Persists last game's standings between games. */
  liveGameLeaderboard: LeaderboardEntry[];
  /** Label describing the live game leaderboard ("CURRENT GAME" or "LAST GAME"). */
  liveGameLeaderboardTitle: string;
  /** Today's cumulative leaderboard for the RIGHT column. */
  todayLeaderboard: LeaderboardEntry[];
  /** National leaderboard across all bars (CENTER during intermission). */
  nationalLeaderboard: LeaderboardEntry[];
  /** Bar's national rank info shown above national leaderboard. */
  barRank: BarRankInfo | null;
  countdown: number;
  /** Seconds left in the current intermission (0 if not in intermission). */
  intermissionCountdown: number;
  qrCodeUrl: string;
  triviaActive: boolean;
  // Lobby info
  lobbyActive: boolean;
  lobbyPlayers: LobbyPlayer[];
  lobbyCountdown: number;
  playerCount: number;
}

export function useBarSockets(): BarSocketState {
  const [triviaQ, setTriviaQ] = useState<TriviaQuestion | null>(null);
  const [triviaRev, setTriviaRev] = useState<TriviaReveal | null>(null);
  const [answerCounts, setAnswerCounts] = useState<AnswerCounts | null>(null);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [predictionGames, setPredictionGames] = useState<PredictionGame[]>([]);
  const [nightlyLeaderboard, setNightlyLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [roundLeaderboard, setRoundLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [triviaPhase, setTriviaPhase] = useState<
    "idle" | "lobby" | "question" | "result"
  >("idle");
  const [predictionsActive, setPredictionsActive] = useState(false);
  const [todayLeaderboard, setTodayLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lobbyPlayers, setLobbyPlayers] = useState<LobbyPlayer[]>([]);
  const [lobbyCountdown, setLobbyCountdown] = useState(0);
  const [playerCount, setPlayerCount] = useState(0);
  const [lastGameLeaderboard, setLastGameLeaderboard] = useState<LeaderboardEntry[]>(
    () => readLastGameCache()
  );
  const [nationalLeaderboard, setNationalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [barRank, setBarRank] = useState<BarRankInfo | null>(null);
  const [intermissionCountdown, setIntermissionCountdown] = useState(0);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lobbyCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const intermissionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const answerCountsRef = useRef<AnswerCounts | null>(null);
  const totalAnswersRef = useRef(0);
  const latestAnswersRef = useRef<string[]>([]);

  // Absolute end-time refs so every tick recalculates from the real clock
  // instead of decrementing a variable (prevents drift).
  const countdownEndRef = useRef(0);
  const lobbyEndRef = useRef(0);
  const intermissionEndRef = useRef(0);

  // Takes an absolute epoch-ms deadline so bar screen and mobile can render
  // the same "Next game in Xs" countdown off the server's `nextGameStartTime`.
  function startIntermission(endMs: number) {
    if (intermissionRef.current) clearInterval(intermissionRef.current);
    intermissionEndRef.current = endMs;
    setIntermissionCountdown(Math.max(0, Math.ceil((endMs - Date.now()) / 1000)));
    intermissionRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((intermissionEndRef.current - Date.now()) / 1000));
      setIntermissionCountdown(remaining);
      if (remaining <= 0 && intermissionRef.current) {
        clearInterval(intermissionRef.current);
        intermissionRef.current = null;
      }
    }, 250);
  }

  function startCountdown(seconds: number) {
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownEndRef.current = Date.now() + seconds * 1000;
    setCountdown(seconds);
    countdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((countdownEndRef.current - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 250);
  }

  // Prefer the server's authoritative epoch-ms startTime so bar screen and
  // mobile clients compute from the same wall-clock. Fall back to offsetting
  // from local Date.now() for older servers that only send `countdown`.
  function startLobbyCountdown(endMs: number) {
    if (lobbyCountdownRef.current) clearInterval(lobbyCountdownRef.current);
    lobbyEndRef.current = endMs;
    setLobbyCountdown(Math.max(0, Math.ceil((endMs - Date.now()) / 1000)));
    lobbyCountdownRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((lobbyEndRef.current - Date.now()) / 1000));
      setLobbyCountdown(remaining);
      if (remaining <= 0 && lobbyCountdownRef.current) {
        clearInterval(lobbyCountdownRef.current);
        lobbyCountdownRef.current = null;
      }
    }, 250);
  }

  useEffect(() => {
    const trivia = getBarTriviaSocket();

    // --- Trivia events ---

    trivia.on("trivia:lobby", (data) => {
      setTriviaPhase("lobby");
      setLobbyPlayers(data.players ?? []);
      const endMs =
        typeof data.startTime === "number"
          ? data.startTime
          : Date.now() + (data.countdown ?? 0) * 1000;
      setLobbyCountdown(Math.max(0, Math.ceil((endMs - Date.now()) / 1000)));
      startLobbyCountdown(endMs);
      setTriviaQ(null);
      setTriviaRev(null);
      if (countdownRef.current) clearInterval(countdownRef.current);
    });

    trivia.on("trivia:playerCount", (data) => {
      setPlayerCount(data.count ?? 0);
    });

    trivia.on("trivia:question", (q) => {
      const answers = q.answers ?? [];
      const tq: TriviaQuestion = {
        questionId: `${q.questionNumber}`,
        question: q.question,
        options: {
          A: answers[0] ?? "",
          B: answers[1] ?? "",
          C: answers[2] ?? "",
          D: answers[3] ?? "",
        },
        questionNumber: q.questionNumber,
        totalQuestions: q.totalQuestions,
        durationMs: (q.totalTime ?? 15) * 1000,
      };
      // Store answers array for mapping correctAnswer text → letter
      latestAnswersRef.current = answers;
      setTriviaQ(tq);
      setTriviaRev(null);
      setAnswerCounts({ A: 0, B: 0, C: 0, D: 0 });
      setTotalAnswers(0);
      setTriviaPhase("question");
      if (lobbyCountdownRef.current) clearInterval(lobbyCountdownRef.current);
      const secs = Number(q.timeRemaining ?? q.totalTime ?? 15);
      startCountdown(isNaN(secs) ? 15 : secs);
    });

    trivia.on("trivia:answer_counts", (data) => {
      if (data.counts) {
        const counts = {
          A: data.counts["A"] ?? 0,
          B: data.counts["B"] ?? 0,
          C: data.counts["C"] ?? 0,
          D: data.counts["D"] ?? 0,
        };
        answerCountsRef.current = counts;
        totalAnswersRef.current = data.total ?? 0;
        setAnswerCounts(counts);
        setTotalAnswers(data.total ?? 0);
      }
    });

    trivia.on("trivia:result", (data) => {
      // Backend sends correctAnswer as the answer text, map it to A/B/C/D
      const labels: ("A" | "B" | "C" | "D")[] = ["A", "B", "C", "D"];
      const idx = latestAnswersRef.current.indexOf(data.correctAnswer);
      const correctLetter = idx >= 0 ? labels[idx] : "A";

      const rev: TriviaReveal = {
        questionId: `${data.questionNumber}`,
        correctAnswer: correctLetter,
        answerCounts: answerCountsRef.current ?? { A: 0, B: 0, C: 0, D: 0 },
        totalAnswers: totalAnswersRef.current,
        funFact: data.funFact ?? null,
        leaderboard: [],
      };
      setTriviaRev(rev);
      setTriviaPhase("result");
      if (countdownRef.current) clearInterval(countdownRef.current);
    });

    trivia.on("trivia:leaderboard", (data) => {
      const entries = (data.top3 ?? data ?? []).map(
        (e: { rank: number; username: string; total: number }, i: number) => ({
          rank: e.rank ?? i + 1,
          displayName: e.username,
          totalPoints: e.total,
        })
      );
      setRoundLeaderboard(entries);
    });

    trivia.on("trivia:nightly_leaderboard", (data) => {
      const entries = (data.leaderboard ?? []).map(
        (e: { rank: number; name: string; points: number }) => ({
          rank: e.rank,
          displayName: e.name,
          totalPoints: e.points,
        })
      );
      setNightlyLeaderboard(entries);
    });

    trivia.on("trivia:game-end", (data) => {
      // Prefer the FULL leaderboard from the event payload (all players).
      // Fall back to the in-memory roundLeaderboard (top3) if the payload is missing.
      const fullLeaderboard: LeaderboardEntry[] = Array.isArray(data?.leaderboard)
        ? data.leaderboard.map(
            (
              e: { name: string; score: number },
              i: number
            ) => ({
              rank: i + 1,
              displayName: e.name,
              totalPoints: e.score,
            })
          )
        : [];

      if (fullLeaderboard.length > 0) {
        setLastGameLeaderboard(fullLeaderboard);
        writeLastGameCache(fullLeaderboard);
        setRoundLeaderboard([]);
      } else {
        setRoundLeaderboard((current) => {
          setLastGameLeaderboard(current);
          writeLastGameCache(current);
          return [];
        });
      }

      setTriviaPhase("idle");
      if (countdownRef.current) clearInterval(countdownRef.current);
      // Intermission countdown is driven by server's authoritative
      // nextGameStartTime so bar screen and mobile stay in sync. Falls back
      // to the old hardcoded duration for older servers.
      const endMs =
        typeof data?.nextGameStartTime === "number"
          ? data.nextGameStartTime
          : Date.now() + INTERMISSION_DURATION_SECONDS * 1000;
      startIntermission(endMs);
    });

    // Authoritative push from backend on barscreen connect AND after each game ends
    trivia.on("trivia:last-game-leaderboard", (data) => {
      const entries: LeaderboardEntry[] = (data?.leaderboard ?? []).map(
        (e: { rank: number; username: string; total: number }) => ({
          rank: e.rank,
          displayName: e.username,
          totalPoints: e.total,
        })
      );
      if (entries.length > 0) {
        setLastGameLeaderboard(entries);
        writeLastGameCache(entries);
      }
    });

    // Connect
    trivia.connect();

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (lobbyCountdownRef.current) clearInterval(lobbyCountdownRef.current);
      if (intermissionRef.current) clearInterval(intermissionRef.current);
      disconnectBarSockets();
    };
  }, []);

  // One-shot REST fetch for last-game leaderboard on mount.
  // Runs in parallel with localStorage hydration + socket replay so the
  // bar screen always has *some* data for the LEFT column on cold start.
  useEffect(() => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${BACKEND_URL}/v1/barscreen/last-game-leaderboard`
        );
        if (!res.ok) return;
        const json = await res.json();
        const entries: LeaderboardEntry[] = (
          json.data?.leaderboard ?? []
        ).map((e: { rank: number; username: string; total: number }) => ({
          rank: e.rank,
          displayName: e.username,
          totalPoints: e.total,
        }));
        if (!cancelled && entries.length > 0) {
          setLastGameLeaderboard(entries);
          writeLastGameCache(entries);
        }
      } catch {
        /* ignore — localStorage + socket will fill in */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Poll national (global) leaderboard every 30s for intermission display
  useEffect(() => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";
    async function fetchNational() {
      try {
        const res = await fetch(`${BACKEND_URL}/v1/mobile/leaderboard/global`);
        if (!res.ok) return;
        const json = await res.json();
        const entries: LeaderboardEntry[] = (
          json.data?.leaderboard ?? []
        ).map((e: { rank: number; name: string; points: number }) => ({
          rank: e.rank,
          displayName: e.name,
          totalPoints: e.points,
        }));
        setNationalLeaderboard(entries);
        // Bar rank info — backend should return this; until then, keep null
        if (json.data?.barRank) {
          setBarRank({
            rank: json.data.barRank.rank,
            totalBars: json.data.barRank.totalBars,
          });
        }
      } catch {
        /* ignore */
      }
    }
    fetchNational();
    const iv = setInterval(fetchNational, 30_000);
    return () => clearInterval(iv);
  }, []);

  // Poll live predictions (featured picks + yes/no vote counts) every 10s
  useEffect(() => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";
    async function fetchPredictions() {
      try {
        const res = await fetch(
          `${BACKEND_URL}/v1/barscreen/featured-predictions`
        );
        if (!res.ok) return;
        const json = await res.json();
        const games = (json.data ?? []) as PredictionGame[];
        setPredictionGames(games);
        setPredictionsActive(games.length > 0);
      } catch {
        /* ignore */
      }
    }
    fetchPredictions();
    const iv = setInterval(fetchPredictions, 10_000);
    return () => clearInterval(iv);
  }, []);

  // Poll today's leaderboard from REST API every 30s
  useEffect(() => {
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";
    async function fetchToday() {
      try {
        const res = await fetch(`${BACKEND_URL}/v1/mobile/leaderboard/today`);
        if (!res.ok) return;
        const json = await res.json();
        const entries: LeaderboardEntry[] = (
          json.data?.leaderboard ?? []
        ).map((e: { rank: number; name: string; points: number }) => ({
          rank: e.rank,
          displayName: e.name,
          totalPoints: e.points,
        }));
        setTodayLeaderboard(entries);
      } catch {
        /* ignore */
      }
    }
    fetchToday();
    const iv = setInterval(fetchToday, 30_000);
    return () => clearInterval(iv);
  }, []);

  // Merge trivia nightly scores + REST picks leaderboard into one "today" board
  const mergedTodayLeaderboard = (() => {
    const pointsMap = new Map<string, number>();
    for (const e of nightlyLeaderboard) {
      pointsMap.set(e.displayName, (pointsMap.get(e.displayName) ?? 0) + e.totalPoints);
    }
    for (const e of todayLeaderboard) {
      pointsMap.set(e.displayName, (pointsMap.get(e.displayName) ?? 0) + e.totalPoints);
    }
    return [...pointsMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, pts], i) => ({
        rank: i + 1,
        displayName: name,
        totalPoints: pts,
      }));
  })();

  // Determine screen state — trivia takes priority only when players are active
  let screen: ScreenState = "idle";
  if (triviaPhase === "question" && triviaQ) {
    screen = "trivia-q";
  } else if (triviaPhase === "result" && triviaRev) {
    screen = "trivia-rev";
  } else if (predictionsActive && predictionGames.length > 0) {
    screen = "predictions";
  } else if (intermissionCountdown > 0) {
    screen = "intermission";
  }

  const triviaActive =
    triviaPhase === "question" || triviaPhase === "result";
  const lobbyActive = triviaPhase === "lobby";

  // Live game leaderboard (LEFT column) — only ever "CURRENT GAME" or "LAST GAME"
  // - Active game (trivia or predictions): current round leaderboard → "CURRENT GAME"
  // - Otherwise: previous game's final standings → "LAST GAME"
  let liveGameLeaderboard: LeaderboardEntry[];
  let liveGameLeaderboardTitle: string;
  if (triviaActive || predictionsActive) {
    liveGameLeaderboard = roundLeaderboard;
    liveGameLeaderboardTitle = "CURRENT GAME";
  } else {
    liveGameLeaderboard = lastGameLeaderboard;
    liveGameLeaderboardTitle = "LAST GAME";
  }

  return {
    screen,
    triviaQ,
    triviaRev,
    answerCounts,
    totalAnswers,
    predictionGames,
    nightlyLeaderboard,
    liveGameLeaderboard,
    liveGameLeaderboardTitle,
    todayLeaderboard: mergedTodayLeaderboard,
    nationalLeaderboard,
    barRank,
    countdown,
    intermissionCountdown,
    qrCodeUrl: QR_LANDING_URL,
    triviaActive,
    lobbyActive,
    lobbyPlayers,
    lobbyCountdown,
    playerCount,
  };
}
