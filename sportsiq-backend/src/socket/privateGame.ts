import { Namespace, Socket } from "socket.io";
import {
  fetchSportsIQPoints,
  upsertMultipleSportsIQPoints,
  fetchRandomTriviaQuestion,
} from "../services/generalService";

// ---------- Types ----------

interface PrivatePlayer {
  socketId: string;
  userId: string;
  phone: string;
  name: string;
  avatarUrl: string | null;
}

interface PrivateRoom {
  roomCode: string;
  hostSocketId: string;
  players: Map<string, PrivatePlayer>; // socketId → player
  phase: "waiting" | "question" | "result" | "loading" | "ended";
  questionNumber: number;
  currentQuestion: {
    category: string;
    question: string;
    answers: string[];
    correctAnswer: string;
    funFact: string | null;
  } | null;
  scores: Map<string, number>; // socketId → score
  selections: Map<string, Set<string>>; // answer → socketIds
  answerTimestamps: Map<string, number>;
  usedQuestionNos: number[];
  questionStartTime: number;
  phaseTimer: NodeJS.Timeout | null;
}

// ---------- Constants ----------

const QUESTIONS_PER_PRIVATE_GAME = 10;
const QUESTION_DURATION_MS = 15_000;
const RESULT_DURATION_MS = 7_000;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 8;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function generateRoomCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// ---------- PrivateGameManager ----------

export class PrivateGameManager {
  private namespace: Namespace;
  private rooms: Map<string, PrivateRoom> = new Map(); // roomCode → room
  private socketToRoom: Map<string, string> = new Map(); // socketId → roomCode

  constructor(namespace: Namespace) {
    this.namespace = namespace;
  }

  setupHandlers(socket: Socket): void {
    socket.on(
      "trivia:create_private",
      (data: {
        userId: string;
        phone: string;
        name: string;
        avatarUrl: string | null;
      }) => {
        this.handleCreate(socket, data);
      }
    );

    socket.on(
      "trivia:join_private",
      (data: {
        roomCode: string;
        userId: string;
        phone: string;
        name: string;
        avatarUrl: string | null;
      }) => {
        this.handleJoin(socket, data);
      }
    );

    socket.on("trivia:start_private", (data: { roomCode: string }) => {
      this.handleStart(socket, data.roomCode);
    });

    socket.on("trivia:answer_private", (data: { answer: string }) => {
      this.handleAnswer(socket, data.answer);
    });

    socket.on("trivia:leave_private", () => {
      this.handleLeave(socket);
    });

    socket.on("disconnect", () => {
      this.handleDisconnect(socket);
    });
  }

  private handleCreate(
    socket: Socket,
    data: {
      userId: string;
      phone: string;
      name: string;
      avatarUrl: string | null;
    }
  ): void {
    // Generate unique room code
    let roomCode = generateRoomCode();
    while (this.rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const player: PrivatePlayer = {
      socketId: socket.id,
      userId: data.userId,
      phone: data.phone,
      name: data.name,
      avatarUrl: data.avatarUrl,
    };

    const room: PrivateRoom = {
      roomCode,
      hostSocketId: socket.id,
      players: new Map([[socket.id, player]]),
      phase: "waiting",
      questionNumber: 0,
      currentQuestion: null,
      scores: new Map(),
      selections: new Map(),
      answerTimestamps: new Map(),
      usedQuestionNos: [],
      questionStartTime: 0,
      phaseTimer: null,
    };

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(socket.id, roomCode);
    socket.join(`private:${roomCode}`);

    socket.emit("trivia:private_created", { roomCode });
    this.emitLobby(room);

    console.log(
      `Private room ${roomCode} created by ${data.name} (${data.userId})`
    );
  }

  private handleJoin(
    socket: Socket,
    data: {
      roomCode: string;
      userId: string;
      phone: string;
      name: string;
      avatarUrl: string | null;
    }
  ): void {
    const room = this.rooms.get(data.roomCode);

    if (!room) {
      socket.emit("trivia:private_error", { message: "Room not found" });
      return;
    }

    if (room.phase !== "waiting") {
      socket.emit("trivia:private_error", {
        message: "Game already in progress",
      });
      return;
    }

    if (room.players.size >= MAX_PLAYERS) {
      socket.emit("trivia:private_error", { message: "Room is full" });
      return;
    }

    const player: PrivatePlayer = {
      socketId: socket.id,
      userId: data.userId,
      phone: data.phone,
      name: data.name,
      avatarUrl: data.avatarUrl,
    };

    room.players.set(socket.id, player);
    this.socketToRoom.set(socket.id, data.roomCode);
    socket.join(`private:${data.roomCode}`);

    this.emitLobby(room);

    console.log(
      `Player ${data.name} joined private room ${data.roomCode} (${room.players.size}/${MAX_PLAYERS})`
    );
  }

  private handleStart(socket: Socket, roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    if (room.hostSocketId !== socket.id) {
      socket.emit("trivia:private_error", {
        message: "Only the host can start",
      });
      return;
    }

    if (room.players.size < MIN_PLAYERS) {
      socket.emit("trivia:private_error", {
        message: `Need at least ${MIN_PLAYERS} players to start`,
      });
      return;
    }

    // Initialize scores
    for (const socketId of room.players.keys()) {
      room.scores.set(socketId, 0);
    }

    console.log(
      `Private room ${roomCode}: starting game with ${room.players.size} players`
    );
    this.advanceToNextQuestion(room);
  }

  private handleAnswer(socket: Socket, answer: string): void {
    const roomCode = this.socketToRoom.get(socket.id);
    if (!roomCode) return;
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "question" || !room.currentQuestion) return;
    if (!room.players.has(socket.id)) return;

    const answerSet = room.selections.get(answer);
    if (!answerSet) return;

    // Remove from previous selection
    for (const [, socketIds] of room.selections) {
      socketIds.delete(socket.id);
    }

    answerSet.add(socket.id);
    room.answerTimestamps.set(socket.id, Date.now());

    // Broadcast selections
    this.emitSelections(room);
  }

  private handleLeave(socket: Socket): void {
    this.removeFromRoom(socket);
  }

  private handleDisconnect(socket: Socket): void {
    this.removeFromRoom(socket);
  }

  private removeFromRoom(socket: Socket): void {
    const roomCode = this.socketToRoom.get(socket.id);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.socketToRoom.delete(socket.id);
      return;
    }

    room.players.delete(socket.id);
    room.selections.forEach((socketIds) => socketIds.delete(socket.id));
    this.socketToRoom.delete(socket.id);
    socket.leave(`private:${roomCode}`);

    if (room.players.size === 0) {
      if (room.phaseTimer) clearTimeout(room.phaseTimer);
      this.rooms.delete(roomCode);
      console.log(`Private room ${roomCode} deleted (empty)`);
      return;
    }

    // If host left, reassign
    if (room.hostSocketId === socket.id) {
      const firstPlayer = room.players.keys().next().value;
      if (firstPlayer) room.hostSocketId = firstPlayer;
    }

    if (room.phase === "waiting") {
      this.emitLobby(room);
    }
  }

  // ---------- Game loop ----------

  private advanceToNextQuestion(room: PrivateRoom): void {
    if (room.questionNumber >= QUESTIONS_PER_PRIVATE_GAME) {
      this.endGame(room);
      return;
    }

    room.selections.clear();
    room.answerTimestamps.clear();
    void this.startQuestion(room);
  }

  private async startQuestion(room: PrivateRoom): Promise<void> {
    room.phase = "loading";
    this.namespace
      .to(`private:${room.roomCode}`)
      .emit("trivia:loading", { message: "Loading question..." });

    const row = await fetchRandomTriviaQuestion(room.usedQuestionNos);
    if (!row) {
      console.error(
        `Private room ${room.roomCode}: no questions available, skipping`
      );
      this.advanceToNextQuestion(room);
      return;
    }

    room.usedQuestionNos.push(row.no);
    room.currentQuestion = {
      category: row.category,
      question: row.question,
      answers: shuffle(row.answers),
      correctAnswer: row.correct_answer,
      funFact: row.fun_fact,
    };

    room.questionNumber++;
    room.phase = "question";
    room.questionStartTime = Date.now();

    for (const answer of room.currentQuestion.answers) {
      room.selections.set(answer, new Set());
    }

    this.namespace.to(`private:${room.roomCode}`).emit("trivia:question", {
      gameId: room.roomCode,
      questionNumber: room.questionNumber,
      questionIndex: room.questionNumber,
      totalQuestions: QUESTIONS_PER_PRIVATE_GAME,
      category: room.currentQuestion.category,
      question: room.currentQuestion.question,
      answers: room.currentQuestion.answers,
      timeRemaining: QUESTION_DURATION_MS / 1000,
      totalTime: QUESTION_DURATION_MS / 1000,
      isPrivate: true,
    });

    room.phaseTimer = setTimeout(() => {
      this.revealResult(room);
    }, QUESTION_DURATION_MS);
  }

  private async revealResult(room: PrivateRoom): Promise<void> {
    if (!room.currentQuestion) return;
    room.phase = "result";
    const { correctAnswer } = room.currentQuestion;

    const userResults: {
      userId: string;
      selectedAnswer: string | null;
      correct: boolean;
      pointsDelta: number;
      finalPointsDelta: number;
      multiplierUsed: number;
      crowdBonus: number;
      newPoints: number;
    }[] = [];

    const pointsUpdates: { phone: string; points: number }[] = [];

    for (const [answer, socketIds] of room.selections) {
      for (const socketId of socketIds) {
        const player = room.players.get(socketId);
        if (!player) continue;

        const isCorrect = answer === correctAnswer;
        const answerTime = room.answerTimestamps.get(socketId);
        const secondsRemaining = answerTime
          ? Math.max(
              0,
              QUESTION_DURATION_MS / 1000 -
                (answerTime - room.questionStartTime) / 1000
            )
          : 0;
        const baseDelta = Math.round(secondsRemaining) * 100;
        const finalDelta = isCorrect ? baseDelta : -baseDelta;

        try {
          const currentPoints =
            (await fetchSportsIQPoints(player.phone)) ?? 0;
          const newPoints = Math.max(0, currentPoints + finalDelta);

          userResults.push({
            userId: player.userId,
            selectedAnswer: answer,
            correct: isCorrect,
            pointsDelta: isCorrect ? baseDelta : 0,
            finalPointsDelta: finalDelta,
            multiplierUsed: 1,
            crowdBonus: 0,
            newPoints,
          });

          pointsUpdates.push({ phone: player.phone, points: newPoints });

          const prevScore = room.scores.get(socketId) ?? 0;
          room.scores.set(socketId, Math.max(0, prevScore + finalDelta));
        } catch (err) {
          console.error(
            `Private room: Error computing points for ${player.userId}:`,
            err
          );
        }
      }
    }

    if (pointsUpdates.length > 0) {
      try {
        await upsertMultipleSportsIQPoints(pointsUpdates);
      } catch (err) {
        console.error("Error upserting private game points:", err);
      }
    }

    this.namespace.to(`private:${room.roomCode}`).emit("trivia:result", {
      gameId: room.roomCode,
      questionNumber: room.questionNumber,
      questionIndex: room.questionNumber,
      totalQuestions: QUESTIONS_PER_PRIVATE_GAME,
      correctAnswer,
      userResults,
      funFact: room.currentQuestion.funFact,
      isPrivate: true,
    });

    // Emit leaderboard
    this.emitPrivateLeaderboard(room);

    room.phaseTimer = setTimeout(() => {
      this.advanceToNextQuestion(room);
    }, RESULT_DURATION_MS);
  }

  private endGame(room: PrivateRoom): void {
    room.phase = "ended";

    const leaderboard: {
      userId: string;
      name: string;
      avatarUrl: string | null;
      score: number;
    }[] = [];

    for (const [socketId, score] of room.scores) {
      const player = room.players.get(socketId);
      if (player) {
        leaderboard.push({
          userId: player.userId,
          name: player.name,
          avatarUrl: player.avatarUrl,
          score,
        });
      }
    }

    leaderboard.sort((a, b) => b.score - a.score);

    this.namespace.to(`private:${room.roomCode}`).emit("trivia:game-end", {
      gameId: room.roomCode,
      leaderboard,
      totalPlayers: room.players.size,
      isPrivate: true,
    });

    console.log(
      `Private room ${room.roomCode}: game ended. ${leaderboard.length} players scored.`
    );

    // Clean up room after a delay
    setTimeout(() => {
      if (room.phaseTimer) clearTimeout(room.phaseTimer);
      for (const socketId of room.players.keys()) {
        this.socketToRoom.delete(socketId);
        const socket = this.namespace.sockets.get(socketId);
        if (socket) socket.leave(`private:${room.roomCode}`);
      }
      this.rooms.delete(room.roomCode);
      console.log(`Private room ${room.roomCode} cleaned up`);
    }, 15_000);
  }

  // ---------- Emitters ----------

  private emitLobby(room: PrivateRoom): void {
    const players: { name: string; avatarUrl: string | null }[] = [];
    for (const player of room.players.values()) {
      players.push({ name: player.name, avatarUrl: player.avatarUrl });
    }

    this.namespace
      .to(`private:${room.roomCode}`)
      .emit("trivia:private_lobby", {
        roomCode: room.roomCode,
        players,
        canStart: room.players.size >= MIN_PLAYERS,
      });
  }

  private emitSelections(room: PrivateRoom): void {
    const result: {
      answer: string;
      users: { userId: string; name: string; avatarUrl: string | null }[];
      count: number;
    }[] = [];

    for (const [answer, socketIds] of room.selections) {
      const users: {
        userId: string;
        name: string;
        avatarUrl: string | null;
      }[] = [];
      for (const socketId of socketIds) {
        const player = room.players.get(socketId);
        if (player) {
          users.push({
            userId: player.userId,
            name: player.name,
            avatarUrl: player.avatarUrl,
          });
        }
      }
      result.push({ answer, users, count: socketIds.size });
    }

    this.namespace
      .to(`private:${room.roomCode}`)
      .emit("trivia:selections", result);
  }

  private emitPrivateLeaderboard(room: PrivateRoom): void {
    const sorted = [...room.scores.entries()].sort(([, a], [, b]) => b - a);
    const top3 = sorted.slice(0, 3).map(([socketId, total], i) => {
      const player = room.players.get(socketId);
      return {
        rank: i + 1,
        username: player?.name ?? "Unknown",
        total,
      };
    });

    this.namespace
      .to(`private:${room.roomCode}`)
      .emit("trivia:leaderboard", { top3 });
  }
}
