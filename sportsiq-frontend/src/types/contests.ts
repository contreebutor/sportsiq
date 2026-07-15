import { GameQuarter, GameStatus, GameType } from "./general";

export interface CreateContestPredictorRequest {
  upcomingGameUUID: string;
  settings: {
    quarter: GameQuarter;
    groups: {
      team_key: string;
      category: string;
      value: number;
      points: {
        under: number;
        exact: number;
        over: number;
      };
    }[];
  }[];
}

export interface CreateContestBingoRequest {
  upcomingGameUUID: string;
  groups: {
    team_key: string;
    description: string;
    category: string;
    value: number;
    points: number;
  }[];
}

export interface ContestBingoForPreGame {
  contest_bingo_id: string;
  prizes: {
    1: string | null;
    2: string | null;
    3: string | null;
    4: string | null;
  };
  categories: {
    team_key: string;
    description: string;
    points: number;
  }[];
}

export interface ContestPredictorForPreGame {
  contest_predictor_id: string;
  titles: {
    [key: string]: {
      quarter: string;
      prize: string;
    };
  };
  settings: {
    quarter: GameQuarter;
    team_key: string;
    category: {
      label: string;
      value: string;
    };
    value: number;
    points: { under: number; exact: number; over: number };
  }[];
}

export interface ContestBingoForLiveGame {
  contest_bingo_id: string;
  live_title: string;
  quarter: GameQuarter;
  tabs: {
    quarter: string;
    prize: string | null;
    winner: string | null;
    completed: boolean;
  }[];
  leaderboard: {
    quarter: GameQuarter;
    prize_title: string;
    prize: string;
    bingo_cards: {
      username: string;
      squares: boolean[];
      points: number;
    }[];
  };
  markets: {
    team_key: string;
    description: string;
    done: number;
    total: number;
    completed: boolean;
    points: number;
    required_count: number;
  }[];
}

export interface GetGameInfoByContestBingoIDResponse {
  game_type: GameType;
  status: GameStatus;
  date_time: string;
  home_team_key: string;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;
  away_team_key: string;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;
  quarter: GameQuarter | null;
  time_remaining_minutes: number | null;
  time_remaining_seconds: number | null;
}

export interface BingoCardSquareProps {
  team_key: string;
  description: string;
  completed: boolean;
  done: number;
  total: number;
  points: number;
}

export interface GetContestBingoCardsResponse {
  id: string;
  quarter: Quarter;
  squares: {
    1: BingoCardSquareProps;
    2: BingoCardSquareProps;
    3: BingoCardSquareProps;
    4: BingoCardSquareProps;
    5: BingoCardSquareProps;
    6: BingoCardSquareProps;
    7: BingoCardSquareProps;
    8: BingoCardSquareProps;
    9: BingoCardSquareProps;
  };
  retryable: boolean;
}

export interface GetUpcomingGameWithContestStatusResponse {
  id: string;
  date_time: string;

  home_team_key: string;
  home_team_logo_url: string;
  home_team_primary_color: string;
  home_team_wins: number;
  home_team_losses: number;

  away_team_key: string;
  away_team_logo_url: string;
  away_team_primary_color: string;
  away_team_wins: number;
  away_team_losses: number;
  contest: {
    enabled: boolean;
    type: string;
    options: string[];
  } | null;
}

export interface FetchContestBingoCategorySetting {
  team_key: string;
  description: string;
  category: {
    label: string;
    value: string;
  };
  value: number;
  points: number;
}

export interface FetchContestPredictorCategorySettingsResponse {
  quarter: GameQuarter;
  team_key: string;
  category: {
    label: string;
    value: string;
  };
  value: number;
  points: {
    under: number;
    exact: number;
    over: number;
  };
}

export interface ContestWinnerJson {
  nickname: string;
  quarter: string;
  redeemed: boolean;
  prize: string | null;
  day: string;
  date_time: string;
  home_team: {
    key: string;
    logo_url: string;
    primary_color: string;
    wins: number;
    losses: number;
  };
  away_team: {
    key: string;
    logo_url: string;
    primary_color: string;
    wins: number;
    losses: number;
  };
}

export interface FetchPredictorInfoResponse {
  game: {
    day: string;
    date_time: string;
    home_team: {
      key: string;
      logo_url: string;
      primary_color: string;
      wins: number;
      losses: number;
    };
    away_team: {
      key: string;
      logo_url: string;
      primary_color: string;
      wins: number;
      losses: number;
    };
  };
  titles: {
    [key: string]: {
      quarter: string;
      prize: string;
    };
  };
  settings: {
    id: number;
    quarter: GameQuarter;
    team_key: string;
    category: { label: string; value: string };
    value: number;
    points: { under: number; exact: number; over: number };
  }[];
}

export interface ContestPredictorForLiveGame {
  contest_predictor_id: string;
  quarter: string;
  quarter_title: string;
  statuses: {
    team_key: string;
    category: {
      label: string;
      value: string;
    };
    progress: number;
    value: number;
    points: {
      under: number;
      exact: number;
      over: number;
    };
  }[];
  prizes: {
    quarter_title: string;
    prize: string;
    winner: string | null;
    completed: boolean;
  }[];
  leaderboard: {
    title: {
      quarter: string;
      prize: string;
    };
    predictions: {
      username: string;
      dots: {
        star: boolean;
        filled: boolean;
      }[];
      points: number;
    }[];
  };
}

export interface RetrievePredictionsResponse {
  quarter: string;
  predictions: string[];
}

/**
 * Check if the below interfaces are deprecated
 */

export type Quarter = "1" | "2" | "3" | "4" | "full";
