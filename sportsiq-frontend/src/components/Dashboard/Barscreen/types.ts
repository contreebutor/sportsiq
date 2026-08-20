export type ScreenState =
  | "idle"
  | "intermission"
  | "trivia-q"
  | "trivia-rev"
  | "predictions";

export interface BarRankInfo {
  rank: number;
  totalBars: number;
}

export interface TriviaQuestion {
  questionId: string;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  questionNumber: number;
  totalQuestions: number;
  durationMs: number;
}

export interface TriviaReveal {
  questionId: string;
  correctAnswer: "A" | "B" | "C" | "D";
  answerCounts: { A: number; B: number; C: number; D: number };
  totalAnswers: number;
  funFact: string | null;
  leaderboard: LeaderboardEntry[];
}

export interface PredictorQuestion {
  questionId: string;
  playerName: string;
  teamName: string;
  teamColorHome?: string;
  teamColorAway?: string;
  statLabel: string;
  statLine: number;
  sportsiqProbability: number;
  locksAt: string;
}

export interface PredictorCrowdSplit {
  more: number;
  less: number;
  morePercent: number;
  lessPercent: number;
}

export interface PredictorResolved {
  questionId: string;
  result: "more" | "less";
  finalStat: number;
  crowdSplit: PredictorCrowdSplit;
  wiseGuyPoints: number;
  heatCheckPoints: number;
  chalkPoints: number;
}

export interface IntelligenceAlert {
  question: string;
  teamName?: string;
  from: number;
  to: number;
  direction: "up" | "down";
  movePct: number;
}

export interface LeaderboardEntry {
  rank: number;
  displayName: string;
  totalPoints: number;
}

export interface AnswerCounts {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface PredictionPick {
  id: string;
  pick_question: string;
  status: string;
  correct_answer: "yes" | "no" | null;
  yes_votes: number;
  no_votes: number;
}

export interface PredictionGame {
  game_uuid: string;
  sports_game: {
    date_time: string;
    status: string;
    teams: {
      home: {
        key: string;
        logo_url: string | null;
        primary_color: string | null;
        wins: number;
        losses: number;
      };
      away: {
        key: string;
        logo_url: string | null;
        primary_color: string | null;
        wins: number;
        losses: number;
      };
    };
  };
  picks: PredictionPick[];
}
