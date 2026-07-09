import { Namespace, Socket } from "socket.io";
import {
  fetchSportsIQPoints,
  upsertMultipleSportsIQPoints,
  processLoginStreak,
  fetchRandomTriviaQuestion,
  incrementTriviaQuestionStats,
} from "../services/generalService";

// ---------- Types ----------

interface TriviaUser {
  userId: string;
  phone: string;
  name: string;
  avatarUrl: string | null;
  socketId: string;
}

interface GameQuestion {
  id: number;
  category: string;
  question: string;
  answers: string[];
  correctAnswer: string;
  funFact: string | null;
}

interface AnswerSelection {
  answer: string;
  users: { userId: string; name: string; avatarUrl: string | null }[];
  count: number;
}

interface UserResult {
  userId: string;
  selectedAnswer: string | null;
  correct: boolean;
  pointsDelta: number;
  finalPointsDelta: number;
  multiplierUsed: number;
  crowdBonus: number;
  newPoints: number;
}

type GamePhase = "lobby" | "question" | "result" | "loading";

// ---------- Constants ----------

const QUESTION_DURATION_MS = 15_000;
const RESULT_DURATION_MS = 7_000;
const GAME_INTERVAL_MINUTES = 5; // Games start at :00, :05, :10, etc.
const GAME_END_DELAY_MS = 8_000;

/** Calculate ms until the next 5-minute wall-clock mark (:00, :05, :10, …) */
function msUntilNextInterval(): number {
  const now = new Date();
  const min = now.getMinutes();
  const sec = now.getSeconds();
  const ms = now.getMilliseconds();
  const currentSlotSeconds = (min % GAME_INTERVAL_MINUTES) * 60 + sec;
  const intervalSeconds = GAME_INTERVAL_MINUTES * 60;
  const remaining = (intervalSeconds - currentSlotSeconds) * 1000 - ms;
  // If we're essentially at the mark (< 100ms), skip to the next one
  return remaining < 100 ? remaining + intervalSeconds * 1000 : remaining;
}
const QUESTIONS_PER_GAME = 10;

const RECONNECT_GRACE_MS = 30_000; // 30 seconds to reconnect


// ---------- Helpers ----------

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// ---------- TriviaGameManager ----------

export class TriviaGameManager {
  private namespace: Namespace;
  private phase: GamePhase = "lobby";
  private currentQuestion: GameQuestion | null = null;
  private questionNumber = 0;
  private questionsThisGame = 0;

  // Connected users keyed by socket ID
  private users: Map<string, TriviaUser> = new Map();

  // Lobby: users who opted in for the next game
  private lobbyPlayers: Set<string> = new Set();

  // Active game: locked-in participants
  private gamePlayers: Set<string> = new Set();

  // Per-game score tracking (socket ID → cumulative delta)
  private gameScores: Map<string, number> = new Map();

  // Current round selections: answer string → Set of socket IDs
  private selections: Map<string, Set<string>> = new Map();

  // Per-question answer timestamps: socket ID → timestamp when they answered
  private answerTimestamps: Map<string, number> = new Map();


  // Disconnected players awaiting reconnection (keyed by userId)
  private disconnectedPlayers: Map<
    string,
    { user: TriviaUser; gameScore: number; timeout: NodeJS.Timeout }
  > = new Map();

  // Confidence multiplier: socket ID → chosen multiplier (B1)
  private multiplierChoices: Map<string, 1.5 | 2 | 3> = new Map();

  // Ghost mode: socket IDs eliminated from the game (B2)
  private ghostPlayers: Set<string> = new Set();

  // Track used question "no" values within a game to avoid repeats
  private usedQuestionNos: number[] = [];

  // Cached payloads for barscreen polling
  private lastQuestionPayload: Record<string, unknown> | null = null;
  private lastResultPayload: Record<string, unknown> | null = null;
  private lastAnswerCounts: Record<string, unknown> | null = null;
  private lastLeaderboard: { rank: number; username: string; total: number }[] = [];

  // Last completed game's final leaderboard (full, not just top3)
  // Persists across games and is exposed to barscreens that connect mid-evening.
  // Reset daily along with nightlyScores.
  private lastFinishedGameLeaderboard:
    | { rank: number; username: string; total: number }[]
    | null = null;
  private lastFinishedGameId: number | null = null;
  private lastFinishedAt: string | null = null;

  // Nightly accumulated leaderboard (keyed by userId, persists across games)
  private nightlyScores: Map<
    string,
    { userId: string; name: string; avatarUrl: string | null; points: number }
  > = new Map();
  private nightlyResetDate: string = new Date()
    .toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // YYYY-MM-DD in ET

  // Comeback Mode: socket IDs currently in comeback (bottom 25% after Q5)
  private comebackPlayers: Set<string> = new Set();

  private phaseTimer: NodeJS.Timeout | null = null;
  private questionStartTime = 0;

  // Game ID — starts at a random 4-digit number
  private gameId = Math.floor(Math.random() * 9000) + 1000;

  constructor(namespace: Namespace) {
    this.namespace = namespace;
  }

  start(): void {
    this.setupConnectionHandler();
    this.startLobby();
  }

  /** Expose current game status for the Live Now screen */
  getStatus(): {
    phase: GamePhase;
    gameId: number;
    playerCount: number;
    lobbyCountdown: number;
    questionIndex: number;
    totalQuestions: number;
    nextGameIn: number;
  } {
    let lobbyCountdown = 0;
    let nextGameIn = 0;

    if (this.phase === "lobby") {
      lobbyCountdown = Math.max(0, Math.ceil(msUntilNextInterval() / 1000));
    }

    // If game just ended, estimate time to next lobby
    if (this.phase === "result" || this.phase === "loading") {
      const questionsLeft = QUESTIONS_PER_GAME - this.questionsThisGame;
      // rough estimate: remaining questions × (question + result duration) + game end delay + lobby
      nextGameIn = Math.ceil(
        (questionsLeft * (QUESTION_DURATION_MS + RESULT_DURATION_MS) +
          GAME_END_DELAY_MS +
          msUntilNextInterval()) /
          1000
      );
    }

    return {
      phase: this.phase,
      gameId: this.gameId,
      playerCount: this.users.size,
      lobbyCountdown,
      questionIndex: this.questionsThisGame,
      totalQuestions: QUESTIONS_PER_GAME,
      nextGameIn,
    };
  }

  /** Cached final standings from the most recently completed game (today). */
  getLastGameLeaderboard(): {
    gameId: number | null;
    finishedAt: string | null;
    leaderboard: { rank: number; username: string; total: number }[];
  } {
    this.checkNightlyReset();
    return {
      gameId: this.lastFinishedGameId,
      finishedAt: this.lastFinishedAt,
      leaderboard: this.lastFinishedGameLeaderboard ?? [],
    };
  }

  /** Full state snapshot for barscreen polling */
  getBarScreenState(): {
    phase: GamePhase;
    playerCount: number;
    countdown: number;
    question: Record<string, unknown> | null;
    result: Record<string, unknown> | null;
    answerCounts: Record<string, unknown> | null;
    leaderboard: { rank: number; username: string; total: number }[];
  } {
    const now = Date.now();
    let countdown = 0;

    if (this.phase === "question" && this.questionStartTime > 0) {
      const elapsed = now - this.questionStartTime;
      countdown = Math.max(0, Math.ceil((QUESTION_DURATION_MS - elapsed) / 1000));
    } else if (this.phase === "lobby") {
      countdown = Math.max(0, Math.ceil(msUntilNextInterval() / 1000));
    }

    return {
      phase: this.phase,
      playerCount: this.users.size,
      countdown,
      question: this.phase === "question" ? this.lastQuestionPayload : null,
      result: this.phase === "result" ? this.lastResultPayload : null,
      answerCounts: this.lastAnswerCounts,
      leaderboard: this.lastLeaderboard,
    };
  }

  // ---------- Nightly Leaderboard ----------

  private checkNightlyReset(): void {
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "America/New_York",
    });
    if (today !== this.nightlyResetDate) {
      this.nightlyScores.clear();
      this.lastFinishedGameLeaderboard = null;
      this.lastFinishedGameId = null;
      this.lastFinishedAt = null;
      this.nightlyResetDate = today;
      console.log(`Nightly leaderboard reset for ${today}`);
    }
  }

  private addToNightlyScores(
    userId: string,
    name: string,
    avatarUrl: string | null,
    delta: number
  ): void {
    const existing = this.nightlyScores.get(userId);
    if (existing) {
      existing.points += delta;
      existing.name = name; // keep name fresh
      existing.avatarUrl = avatarUrl;
    } else {
      this.nightlyScores.set(userId, { userId, name, avatarUrl, points: delta });
    }
  }

  getNightlyLeaderboard(): {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  }[] {
    this.checkNightlyReset();
    return [...this.nightlyScores.values()]
      .sort((a, b) => b.points - a.points)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));
  }

  private emitNightlyLeaderboard(): void {
    const leaderboard = this.getNightlyLeaderboard();
    this.namespace.emit("trivia:nightly_leaderboard", { leaderboard });
  }

  // ---------- Lobby ----------

  private startLobby(): void {
    if (this.phaseTimer) clearTimeout(this.phaseTimer);
    this.checkNightlyReset();

    // Clear any remaining reconnection grace timers
    for (const [, entry] of this.disconnectedPlayers) {
      clearTimeout(entry.timeout);
    }
    this.disconnectedPlayers.clear();

    this.questionsThisGame = 0;
    this.questionNumber = 0;
    this.lobbyPlayers.clear();
    this.gamePlayers.clear();
    this.gameScores.clear();
    this.selections.clear();
    this.multiplierChoices.clear();
    this.ghostPlayers.clear();
    this.comebackPlayers.clear();
    this.usedQuestionNos = [];
    this.currentQuestion = null;
    this.phase = "lobby";
    const lobbyMs = msUntilNextInterval();
    console.log(`Lobby started. Next game in ${Math.ceil(lobbyMs / 1000)}s`);

    this.namespace.emit("trivia:lobby", this.buildLobbyPayload());

    this.phaseTimer = setTimeout(() => {
      this.startGame();
    }, lobbyMs);
  }

  private startGame(): void {
    // Copy lobby players into the active game
    this.gamePlayers = new Set(this.lobbyPlayers);

    if (this.gamePlayers.size === 0) {
      // Nobody joined — restart lobby
      console.log(
        `Game #${this.gameId}: no players joined, restarting lobby.`
      );
      this.startLobby();
      return;
    }

    // Increment game ID only when a game actually starts with players
    this.gameId++;

    // Initialize game scores for all participants
    for (const socketId of this.gamePlayers) {
      this.gameScores.set(socketId, 0);
    }

    console.log(
      `Game #${this.gameId}: starting with ${this.gamePlayers.size} players.`
    );
    this.advanceToNextQuestion();
  }

  private handleJoinGame(socket: Socket): void {
    if (this.phase !== "lobby") return;
    if (!this.users.has(socket.id)) return;

    this.lobbyPlayers.add(socket.id);
    this.namespace.emit("trivia:lobby", this.buildLobbyPayload());
  }

  private buildLobbyPayload(): {
    gameId: number;
    countdown: number;
    startTime: number;
    players: { userId: string; name: string; avatarUrl: string | null }[];
    playerCount: number;
  } {
    const remaining = Math.max(0, msUntilNextInterval());

    const players: { userId: string; name: string; avatarUrl: string | null }[] =
      [];
    for (const socketId of this.lobbyPlayers) {
      const user = this.users.get(socketId);
      if (user) {
        players.push({
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
        });
      }
    }

    // startTime is the authoritative epoch ms for game start. Clients should
    // derive countdown locally as ceil((startTime - Date.now()) / 1000) so
    // that all clients stay in sync regardless of network latency or local
    // tick jitter. `countdown` is kept for older clients still reading it.
    return {
      gameId: this.gameId,
      countdown: Math.ceil(remaining / 1000),
      startTime: Date.now() + remaining,
      players,
      playerCount: this.lobbyPlayers.size,
    };
  }

  // ---------- Connection handling ----------

  private setupConnectionHandler(): void {
    this.namespace.on("connection", (socket: Socket) => {
      const role = socket.handshake.auth?.role;

      // Barscreen viewers get current state immediately and don't join as players
      if (role === "barscreen") {
        console.log(`Barscreen connected: ${socket.id}`);
        socket.emit("trivia:nightly_leaderboard", {
          leaderboard: this.getNightlyLeaderboard(),
        });
        // Replay last completed game's standings so screen has "LAST GAME" data
        if (this.lastFinishedGameLeaderboard) {
          socket.emit("trivia:last-game-leaderboard", {
            gameId: this.lastFinishedGameId,
            finishedAt: this.lastFinishedAt,
            leaderboard: this.lastFinishedGameLeaderboard,
          });
        }
        // Send current game state
        if (this.phase === "lobby") {
          socket.emit("trivia:lobby", this.buildLobbyPayload());
        } else if (this.phase === "question" && this.lastQuestionPayload) {
          socket.emit("trivia:question", this.lastQuestionPayload);
          if (this.lastAnswerCounts) {
            socket.emit("trivia:answer_counts", this.lastAnswerCounts);
          }
        } else if (this.phase === "result" && this.lastResultPayload) {
          socket.emit("trivia:result", this.lastResultPayload);
          if (this.lastLeaderboard) {
            socket.emit("trivia:leaderboard", { top3: this.lastLeaderboard });
          }
        }
        socket.emit("trivia:playerCount", { count: this.users.size });
        return; // Don't set up player event handlers
      }

      console.log(`Trivia socket connected: ${socket.id}`);

      socket.on(
        "trivia:join",
        (data: {
          userId: string;
          phone: string;
          name: string;
          avatarUrl: string | null;
        }) => {
          this.handleJoin(socket, data);
        }
      );

      socket.on("trivia:join-game", () => {
        this.handleJoinGame(socket);
      });

      socket.on("trivia:answer", (data: { answer: string }) => {
        this.handleAnswer(socket, data.answer);
      });

      socket.on(
        "trivia:multiplier",
        (data: { gameId: number; multiplier: 1.5 | 2 | 3 }) => {
          this.handleMultiplier(socket, data);
        }
      );

      socket.on("disconnect", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private handleJoin(
    socket: Socket,
    data: {
      userId: string;
      phone: string;
      name: string;
      avatarUrl: string | null;
    }
  ): void {
    const user: TriviaUser = {
      userId: data.userId,
      phone: data.phone,
      name: data.name,
      avatarUrl: data.avatarUrl,
      socketId: socket.id,
    };
    this.users.set(socket.id, user);

    // Process daily login streak (B6) — fire-and-forget
    processLoginStreak(data.phone)
      .then(({ loginStreak, bonusAwarded }) => {
        if (bonusAwarded > 0) {
          socket.emit("trivia:streak", { loginStreak, bonusAwarded });
        }
      })
      .catch((err) => {
        console.error("Error processing login streak:", err);
      });

    // Check if this user is reconnecting mid-game
    const disconnected = this.disconnectedPlayers.get(data.userId);
    if (disconnected) {
      clearTimeout(disconnected.timeout);
      this.disconnectedPlayers.delete(data.userId);

      // Restore them as an active game player with their score
      this.gamePlayers.add(socket.id);
      this.gameScores.set(socket.id, disconnected.gameScore);

      console.log(
        `Game #${this.gameId}: player ${data.name} (${data.userId}) reconnected! Restoring to game.`
      );

      // Send current game state so they can continue playing
      if (this.phase === "question" && this.currentQuestion) {
        const elapsed = Date.now() - this.questionStartTime;
        const remaining = Math.max(0, QUESTION_DURATION_MS - elapsed);

        socket.emit("trivia:question", {
          gameId: this.gameId,
          questionNumber: this.questionNumber,
          questionIndex: this.questionsThisGame,
          totalQuestions: QUESTIONS_PER_GAME,
          category: this.currentQuestion.category,
          question: this.currentQuestion.question,
          answers: this.currentQuestion.answers,
          timeRemaining: Math.ceil(remaining / 1000),
          totalTime: QUESTION_DURATION_MS / 1000,
        });
        socket.emit("trivia:selections", this.buildSelectionsPayload());
      } else if (this.phase === "result" && this.currentQuestion) {
        socket.emit("trivia:result", {
          gameId: this.gameId,
          questionNumber: this.questionNumber,
          questionIndex: this.questionsThisGame,
          totalQuestions: QUESTIONS_PER_GAME,
          correctAnswer: this.currentQuestion.correctAnswer,
          userResults: [],
        });
      }

      // Tell the client they're still a playing participant so the mobile UI
      // flips out of observer mode after the disconnect reset.
      socket.emit("trivia:game-status", {
        gameId: this.gameId,
        inProgress: true,
        questionIndex: this.questionsThisGame,
        totalQuestions: QUESTIONS_PER_GAME,
        isPlayer: true,
      });

      this.namespace.emit("trivia:playerCount", { count: this.users.size });
      return;
    }

    if (this.phase === "lobby") {
      // Send current lobby state
      socket.emit("trivia:lobby", this.buildLobbyPayload());
    } else if (this.phase === "question" && this.currentQuestion) {
      // Game in progress — send current question state as spectator
      const elapsed = Date.now() - this.questionStartTime;
      const remaining = Math.max(0, QUESTION_DURATION_MS - elapsed);

      socket.emit("trivia:question", {
        gameId: this.gameId,
        questionNumber: this.questionNumber,
        questionIndex: this.questionsThisGame,
        totalQuestions: QUESTIONS_PER_GAME,
        category: this.currentQuestion.category,
        question: this.currentQuestion.question,
        answers: this.currentQuestion.answers,
        timeRemaining: Math.ceil(remaining / 1000),
        totalTime: QUESTION_DURATION_MS / 1000,
      });

      socket.emit("trivia:selections", this.buildSelectionsPayload());

      // Genuine late-joiner — not a player in this game.
      socket.emit("trivia:game-status", {
        gameId: this.gameId,
        inProgress: true,
        questionIndex: this.questionsThisGame,
        totalQuestions: QUESTIONS_PER_GAME,
        isPlayer: false,
      });
    } else if (this.phase === "result" && this.currentQuestion) {
      socket.emit("trivia:result", {
        gameId: this.gameId,
        questionNumber: this.questionNumber,
        questionIndex: this.questionsThisGame,
        totalQuestions: QUESTIONS_PER_GAME,
        correctAnswer: this.currentQuestion.correctAnswer,
        userResults: [],
      });

      socket.emit("trivia:game-status", {
        gameId: this.gameId,
        inProgress: true,
        questionIndex: this.questionsThisGame,
        totalQuestions: QUESTIONS_PER_GAME,
        isPlayer: false,
      });
    }

    this.namespace.emit("trivia:playerCount", { count: this.users.size });
  }

  private handleAnswer(socket: Socket, answer: string): void {
    if (this.phase !== "question" || !this.currentQuestion) return;

    // Only game players can answer
    if (!this.gamePlayers.has(socket.id)) return;

    // Ghost mode disabled for Phase 4
    // if (this.ghostPlayers.has(socket.id)) return;

    const user = this.users.get(socket.id);
    if (!user) return;

    // Validate answer is one of the options
    const answerSet = this.selections.get(answer);
    if (!answerSet) return;

    // Remove from any previous selection so the user can change their answer
    for (const [, socketIds] of this.selections) {
      socketIds.delete(socket.id);
    }

    answerSet.add(socket.id);
    this.answerTimestamps.set(socket.id, Date.now());

    // Broadcast updated selections to all clients
    this.namespace.emit("trivia:selections", this.buildSelectionsPayload());

    // Emit live answer counts (B3)
    this.emitAnswerCounts();
  }

  private handleMultiplier(
    socket: Socket,
    data: { gameId: number; multiplier: 1.5 | 2 | 3 }
  ): void {
    if (this.phase !== "question") return;
    if (!this.gamePlayers.has(socket.id)) return;
    // Ghost mode disabled for Phase 4
    // if (this.ghostPlayers.has(socket.id)) return;
    if (data.multiplier !== 1.5 && data.multiplier !== 2 && data.multiplier !== 3) return;
    this.multiplierChoices.set(socket.id, data.multiplier);
  }

  private handleDisconnect(socket: Socket): void {
    const user = this.users.get(socket.id);
    if (!user) return;

    const isInGame = this.gamePlayers.has(socket.id);
    const isGameActive =
      this.phase === "question" ||
      this.phase === "result" ||
      this.phase === "loading";

    // Remove from answer selections
    for (const [, socketIds] of this.selections) {
      socketIds.delete(socket.id);
    }

    // Remove from lobby
    this.lobbyPlayers.delete(socket.id);

    this.users.delete(socket.id);

    if (isInGame && isGameActive) {
      // Mid-game disconnect: hold spot with grace period
      this.gamePlayers.delete(socket.id);
      const gameScore = this.gameScores.get(socket.id) ?? 0;
      this.gameScores.delete(socket.id);

      // Clear any existing grace timer for this user (e.g. rapid disconnect/reconnect)
      const existing = this.disconnectedPlayers.get(user.userId);
      if (existing) clearTimeout(existing.timeout);

      const timeout = setTimeout(() => {
        console.log(
          `Game #${this.gameId}: player ${user.name} (${user.userId}) did not reconnect within grace period.`
        );
        this.disconnectedPlayers.delete(user.userId);
      }, RECONNECT_GRACE_MS);

      this.disconnectedPlayers.set(user.userId, {
        user,
        gameScore,
        timeout,
      });

      console.log(
        `Game #${this.gameId}: player ${user.name} disconnected mid-game. Holding spot for ${RECONNECT_GRACE_MS / 1000}s.`
      );
    } else {
      // Lobby or not in game: remove immediately
      this.gamePlayers.delete(socket.id);
    }

    if (this.phase === "lobby") {
      this.namespace.emit("trivia:lobby", this.buildLobbyPayload());
    } else if (this.phase === "question") {
      this.namespace.emit("trivia:selections", this.buildSelectionsPayload());
    }

    this.namespace.emit("trivia:playerCount", { count: this.users.size });
  }

  // ---------- Game loop ----------

  private advanceToNextQuestion(): void {
    if (this.questionsThisGame >= QUESTIONS_PER_GAME) {
      this.endGame();
      return;
    }

    this.selections.clear();
    this.answerTimestamps.clear();
    this.multiplierChoices.clear();
    void this.startQuestion();
  }

  private async startQuestion(): Promise<void> {
    this.phase = "loading";
    this.namespace.emit("trivia:loading", { message: "Loading question..." });

    // Fetch a random question using the "no" column (1-500)
    const row = await fetchRandomTriviaQuestion(this.usedQuestionNos);

    if (!row) {
      console.error("No trivia questions available in DB, skipping.");
      this.advanceToNextQuestion();
      return;
    }

    this.usedQuestionNos.push(row.no);

    this.currentQuestion = {
      id: row.id,
      category: row.category,
      question: row.question,
      answers: shuffle(row.answers),
      correctAnswer: row.correct_answer,
      funFact: row.fun_fact,
    };

    this.questionNumber++;
    this.questionsThisGame++;
    this.phase = "question";
    this.questionStartTime = Date.now();

    for (const answer of this.currentQuestion.answers) {
      this.selections.set(answer, new Set());
    }

    const questionPayload = {
      gameId: this.gameId,
      questionNumber: this.questionNumber,
      questionIndex: this.questionsThisGame,
      totalQuestions: QUESTIONS_PER_GAME,
      category: this.currentQuestion.category,
      question: this.currentQuestion.question,
      answers: this.currentQuestion.answers,
      timeRemaining: QUESTION_DURATION_MS / 1000,
      totalTime: QUESTION_DURATION_MS / 1000,
    };
    this.lastQuestionPayload = questionPayload;
    this.lastResultPayload = null;
    this.namespace.emit("trivia:question", questionPayload);

    this.phaseTimer = setTimeout(() => {
      this.revealResult();
    }, QUESTION_DURATION_MS);
  }

  private async revealResult(): Promise<void> {
    if (!this.currentQuestion) return;

    this.phase = "result";
    const { correctAnswer } = this.currentQuestion;

    // Emit final answer counts on timer expiry (B3)
    this.emitAnswerCounts();

    // ── Crowd bonus stats (B4) ──
    let totalAnswered = 0;
    let totalCorrect = 0;
    for (const [answer, socketIds] of this.selections) {
      for (const socketId of socketIds) {
        if (!this.gamePlayers.has(socketId)) continue;
        // Ghost mode disabled for Phase 4
        totalAnswered++;
        if (answer === correctAnswer) totalCorrect++;
      }
    }
    const correctPercent =
      totalAnswered > 0 ? totalCorrect / totalAnswered : 1;

    const userResults: UserResult[] = [];
    const pointsUpdates: { phone: string; points: number }[] = [];
    const newGhostUserIds: string[] = [];
    const processedSocketIds = new Set<string>();

    // ── Process players who answered ──
    for (const [answer, socketIds] of this.selections) {
      for (const socketId of socketIds) {
        if (!this.gamePlayers.has(socketId)) continue;
        // Ghost mode disabled for Phase 4

        const user = this.users.get(socketId);
        if (!user) continue;
        processedSocketIds.add(socketId);

        const isCorrect = answer === correctAnswer;

        // Base points: 10 per second remaining (max 150 for 15s)
        const answerTime = this.answerTimestamps.get(socketId);
        const secondsRemaining = answerTime
          ? Math.max(
              0,
              QUESTION_DURATION_MS / 1000 -
                (answerTime - this.questionStartTime) / 1000
            )
          : 0;
        const baseDelta = Math.round(secondsRemaining) * 10;

        // ── Confidence multiplier (B1) ──
        // No multiplier: correct = +base, wrong = 0
        // With multiplier M (>1): bet = base × M
        //   correct = base + bet (e.g. 2× with base 100 → +300)
        //   wrong   = -bet
        const multiplier = this.multiplierChoices.get(socketId) ?? 1;
        const hasMultiplier = multiplier > 1;
        const bet = hasMultiplier ? baseDelta * multiplier : 0;
        let finalDelta: number;
        if (isCorrect) {
          finalDelta = baseDelta + bet;
          // ── Comeback Mode: 1.5× for bottom 25% after Q5 ──
          if (this.comebackPlayers.has(socketId)) {
            finalDelta = Math.floor(finalDelta * 1.5);
          }
        } else {
          // Wrong without multiplier = 0, with multiplier = -bet
          finalDelta = -bet;
        }

        // ── Crowd bonus (B4) — only correct, non-ghost ──
        let crowdBonus = 0;
        if (isCorrect) {
          if (correctPercent < 0.3) {
            crowdBonus = Math.floor(baseDelta * 0.5);
          } else if (correctPercent < 0.5) {
            crowdBonus = Math.floor(baseDelta * 0.25);
          }
        }

        // ── Ghost mode (B2) disabled for Phase 4 ──
        // if (!isCorrect && this.questionsThisGame >= 3) {
        //   this.ghostPlayers.add(socketId);
        //   newGhostUserIds.push(user.userId);
        // }

        try {
          const currentPoints =
            (await fetchSportsIQPoints(user.phone)) ?? 0;
          const totalDelta = finalDelta + crowdBonus;
          const newPoints = Math.max(0, currentPoints + totalDelta);

          userResults.push({
            userId: user.userId,
            selectedAnswer: answer,
            correct: isCorrect,
            pointsDelta: totalDelta,
            finalPointsDelta: totalDelta,
            multiplierUsed: multiplier,
            crowdBonus,
            newPoints,
          });

          pointsUpdates.push({ phone: user.phone, points: newPoints });

          // Track per-game score
          const prevScore = this.gameScores.get(socketId) ?? 0;
          this.gameScores.set(socketId, Math.max(0, prevScore + totalDelta));

          // Accumulate nightly leaderboard
          if (totalDelta !== 0) {
            this.addToNightlyScores(
              user.userId,
              user.name,
              user.avatarUrl,
              totalDelta
            );
          }
        } catch (err) {
          console.error(
            `Error computing points for user ${user.userId}:`,
            err
          );
        }
      }
    }

    // ── Ghost check for players who didn't answer (B2) — disabled for Phase 4 ──
    // for (const socketId of this.gamePlayers) {
    //   if (this.ghostPlayers.has(socketId)) continue;
    //   if (processedSocketIds.has(socketId)) continue;
    //   const user = this.users.get(socketId);
    //   if (!user) continue;
    //   if (this.questionsThisGame >= 3) {
    //     this.ghostPlayers.add(socketId);
    //     newGhostUserIds.push(user.userId);
    //   }
    // }

    // ── Batch upsert all points changes ──
    if (pointsUpdates.length > 0) {
      try {
        await upsertMultipleSportsIQPoints(pointsUpdates);
      } catch (err) {
        console.error("Error upserting trivia points:", err);
      }
    }

    // ── Record per-question accuracy stats ──
    if (totalAnswered > 0) {
      void incrementTriviaQuestionStats(
        this.currentQuestion.id,
        totalAnswered,
        totalCorrect
      );
    }

    // ── Count active (non-ghost) players (B2) ──
    let activePlayers = 0;
    for (const socketId of this.gamePlayers) {
      if (!this.ghostPlayers.has(socketId)) activePlayers++;
    }

    const resultPayload = {
      gameId: this.gameId,
      questionNumber: this.questionNumber,
      questionIndex: this.questionsThisGame,
      totalQuestions: QUESTIONS_PER_GAME,
      correctAnswer,
      userResults,
      funFact: this.currentQuestion.funFact,
      ghostPlayers: newGhostUserIds,
      activePlayers,
    };
    this.lastResultPayload = resultPayload;
    this.namespace.emit("trivia:result", resultPayload);
    this.emitNightlyLeaderboard();

    // ── Emit ghost_rank to each ghost (B2) ──
    const sortedScores = [...this.gameScores.entries()].sort(
      ([, a], [, b]) => b - a
    );
    const totalPlayers = this.gamePlayers.size;

    for (const ghostSocketId of this.ghostPlayers) {
      const user = this.users.get(ghostSocketId);
      if (!user) continue;
      const rankIndex = sortedScores.findIndex(
        ([sid]) => sid === ghostSocketId
      );
      const phantomRank = rankIndex >= 0 ? rankIndex + 1 : totalPlayers;

      const ghostSocket = this.namespace.sockets.get(ghostSocketId);
      if (ghostSocket) {
        ghostSocket.emit("trivia:ghost_rank", {
          phantomRank,
          totalPlayers,
        });
      }
    }

    // ── Emit live leaderboard (B5) ──
    this.emitLeaderboard();

    // ── Comeback Mode: after Q5, bottom 25% of active players ──
    if (this.questionsThisGame >= 5) {
      this.computeComeback();
    }

    this.phaseTimer = setTimeout(() => {
      this.advanceToNextQuestion();
    }, RESULT_DURATION_MS);
  }

  private computeComeback(): void {
    // Collect active (non-ghost) player scores
    const activeScores: { socketId: string; score: number }[] = [];
    for (const socketId of this.gamePlayers) {
      if (this.ghostPlayers.has(socketId)) continue;
      activeScores.push({
        socketId,
        score: this.gameScores.get(socketId) ?? 0,
      });
    }

    if (activeScores.length < 4) return; // Need at least 4 players for bottom 25%

    activeScores.sort((a, b) => a.score - b.score);
    const bottom25Count = Math.max(1, Math.floor(activeScores.length * 0.25));
    const threshold = activeScores[bottom25Count - 1].score;

    const newComeback = new Set<string>();
    for (const { socketId, score } of activeScores) {
      if (score <= threshold && newComeback.size < bottom25Count) {
        newComeback.add(socketId);
      }
    }

    // Notify players whose comeback status changed
    for (const socketId of newComeback) {
      if (!this.comebackPlayers.has(socketId)) {
        const socket = this.namespace.sockets.get(socketId);
        if (socket) {
          socket.emit("trivia:comeback", { active: true });
        }
      }
    }
    for (const socketId of this.comebackPlayers) {
      if (!newComeback.has(socketId)) {
        const socket = this.namespace.sockets.get(socketId);
        if (socket) {
          socket.emit("trivia:comeback", { active: false });
        }
      }
    }

    this.comebackPlayers = newComeback;
  }

  private endGame(): void {
    // Build leaderboard from gameScores
    const leaderboard: {
      userId: string;
      name: string;
      avatarUrl: string | null;
      score: number;
    }[] = [];

    for (const [socketId, score] of this.gameScores) {
      const user = this.users.get(socketId);
      if (user) {
        leaderboard.push({
          userId: user.userId,
          name: user.name,
          avatarUrl: user.avatarUrl,
          score,
        });
      }
    }

    leaderboard.sort((a, b) => b.score - a.score);

    console.log(
      `Game #${this.gameId}: ended. ${leaderboard.length} players scored.`
    );

    // Cache the final standings so newly-connecting barscreens (and the REST
    // endpoint) can show "LAST GAME" without losing it on refresh / cold start.
    this.lastFinishedGameLeaderboard = leaderboard.map((e, i) => ({
      rank: i + 1,
      username: e.name,
      total: e.score,
    }));
    this.lastFinishedGameId = this.gameId;
    this.lastFinishedAt = new Date().toISOString();

    // nextGameStartTime is the authoritative epoch ms of when the next game
    // will begin (the next 5-minute wall-clock mark). Clients use this to
    // render a synced "Next game in Xs" countdown on the post-game screen,
    // the same way they use `startTime` during the lobby phase.
    this.namespace.emit("trivia:game-end", {
      gameId: this.gameId,
      leaderboard,
      totalPlayers: this.gamePlayers.size,
      nextGameStartTime: Date.now() + Math.max(0, msUntilNextInterval()),
    });
    // Push the cached final standings so connected barscreens can update.
    this.namespace.emit("trivia:last-game-leaderboard", {
      gameId: this.lastFinishedGameId,
      finishedAt: this.lastFinishedAt,
      leaderboard: this.lastFinishedGameLeaderboard,
    });
    this.emitNightlyLeaderboard();

    // Start new lobby after a delay — players must click join again
    this.phaseTimer = setTimeout(() => {
      this.startLobby();
    }, GAME_END_DELAY_MS);
  }

  // ---------- B3: Live Crowd % ----------

  private emitAnswerCounts(): void {
    if (!this.currentQuestion) return;
    const answers = this.currentQuestion.answers;
    const labels = ["A", "B", "C", "D"];
    const counts: Record<string, number> = {};
    let total = 0;

    for (let i = 0; i < answers.length; i++) {
      const count = this.selections.get(answers[i])?.size ?? 0;
      counts[labels[i]] = count;
      total += count;
    }

    this.lastAnswerCounts = { questionIndex: this.questionsThisGame, counts, total };
    this.namespace.emit("trivia:answer_counts", {
      questionIndex: this.questionsThisGame,
      counts,
      total,
    });
  }

  // ---------- B5: Live Leaderboard ----------

  private emitLeaderboard(): void {
    const sorted = [...this.gameScores.entries()].sort(
      ([, a], [, b]) => b - a
    );

    const top3 = sorted.slice(0, 3).map(([socketId, total], i) => {
      const user = this.users.get(socketId);
      return {
        rank: i + 1,
        username: user?.name ?? "Unknown",
        total,
      };
    });

    this.lastLeaderboard = top3;
    this.namespace.emit("trivia:leaderboard", { top3 });

    // Per-player rank
    const totalPlayers = this.gamePlayers.size;
    for (let i = 0; i < sorted.length; i++) {
      const [socketId, total] = sorted[i];
      const socket = this.namespace.sockets.get(socketId);
      if (socket) {
        socket.emit("trivia:my_rank", {
          rank: i + 1,
          total,
          totalPlayers,
        });
      }
    }
  }

  // ---------- Payload builders ----------

  private buildSelectionsPayload(): AnswerSelection[] {
    const result: AnswerSelection[] = [];

    for (const [answer, socketIds] of this.selections) {
      const users: {
        userId: string;
        name: string;
        avatarUrl: string | null;
      }[] = [];
      for (const socketId of socketIds) {
        const user = this.users.get(socketId);
        if (user) {
          users.push({
            userId: user.userId,
            name: user.name,
            avatarUrl: user.avatarUrl,
          });
        }
      }
      result.push({
        answer,
        users: users.slice(0, 5),
        count: socketIds.size,
      });
    }

    return result;
  }

}
