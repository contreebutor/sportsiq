import { supabase } from "../utils/supabase";

// IQ scoring table
const IQ_SCORING: Record<number, { win: number; loss: number }> = {
  1: { win: 50, loss: -25 },
  2: { win: 100, loss: -50 },
  5: { win: 250, loss: -125 },
};

export interface FeaturedGame {
  id: string;
  game_id: string;
  home_team: string;
  away_team: string;
  pick_question: string;
  start_time: string;
  status: string;
}

export interface UserPick {
  id: string;
  user_id: string;
  featured_game_id: string;
  choice: string;
  multiplier: number;
  status: string;
  iq_change: number;
  created_at: string;
}

// Get today's featured game (if any is scheduled or live)
export async function getFeaturedGame(): Promise<FeaturedGame | null> {
  const { data, error } = await supabase
    .from("m_featured_games")
    .select("id, game_id, home_team, away_team, pick_question, start_time, status")
    .in("status", ["scheduled", "live"])
    .order("start_time", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data as FeaturedGame;
}

export interface BarscreenPredictionGame {
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
  picks: {
    id: string;
    pick_question: string;
    status: string;
    correct_answer: "yes" | "no" | null;
    yes_votes: number;
    no_votes: number;
  }[];
}

export interface FeaturedPredictionGame {
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
  picks: {
    id: string;
    pick_question: string;
    status: string;
    correct_answer: "yes" | "no" | null;
    user_pick: "yes" | "no" | null;
  }[];
}

// Parse "${game_uuid}_${index}" → game_uuid. Returns null if malformed.
function parseGameUuid(featuredGameId: string): string | null {
  const lastUnderscore = featuredGameId.lastIndexOf("_");
  if (lastUnderscore === -1) return null;
  return featuredGameId.slice(0, lastUnderscore);
}

// Fetch featured picks for all games accepting picks, grouped by sports game.
// Includes sports_game metadata + the current user's pick for each question.
export async function getFeaturedPredictions(
  userId?: string
): Promise<FeaturedPredictionGame[]> {
  const { data: featured, error: featuredError } = await supabase
    .from("m_featured_games")
    .select(
      "id, game_id, home_team, away_team, pick_question, start_time, status, correct_answer"
    )
    .in("status", ["scheduled", "live"])
    .order("start_time", { ascending: true })
    .order("game_id", { ascending: true });

  if (featuredError || !featured || featured.length === 0) return [];

  const byGameUuid = new Map<string, typeof featured>();
  for (const row of featured) {
    const uuid = parseGameUuid(row.game_id);
    if (!uuid) continue;
    const list = byGameUuid.get(uuid) ?? [];
    list.push(row);
    byGameUuid.set(uuid, list);
  }
  if (byGameUuid.size === 0) return [];

  const gameUuids = [...byGameUuid.keys()];

  const { data: generalGames } = await supabase
    .from("general_games")
    .select(
      "id, game_type, date_time, status, home_team_key, away_team_key"
    )
    .in("id", gameUuids);

  if (!generalGames || generalGames.length === 0) return [];

  const teamKeysByGameType = new Map<string, Set<string>>();
  for (const g of generalGames) {
    const keys = teamKeysByGameType.get(g.game_type) ?? new Set<string>();
    keys.add(g.home_team_key);
    keys.add(g.away_team_key);
    teamKeysByGameType.set(g.game_type, keys);
  }

  const profilesByKey = new Map<
    string,
    { logo_url: string | null; primary_color: string | null }
  >();
  const statsByKey = new Map<string, { wins: number; losses: number }>();

  await Promise.all(
    [...teamKeysByGameType.entries()].map(async ([gameType, keys]) => {
      const keyArr = [...keys];
      const [profilesRes, statsRes] = await Promise.all([
        supabase
          .from("general_team_profiles")
          .select("team_key, team_primary_color, team_logo_url")
          .eq("game_type", gameType)
          .in("team_key", keyArr),
        supabase
          .from("general_team_season_stats")
          .select("team_key, team_wins, team_losses")
          .eq("game_type", gameType)
          .in("team_key", keyArr),
      ]);
      for (const p of profilesRes.data ?? []) {
        profilesByKey.set(`${gameType}:${p.team_key}`, {
          logo_url: p.team_logo_url,
          primary_color: p.team_primary_color,
        });
      }
      for (const s of statsRes.data ?? []) {
        statsByKey.set(`${gameType}:${s.team_key}`, {
          wins: Number(s.team_wins ?? 0),
          losses: Number(s.team_losses ?? 0),
        });
      }
    })
  );

  const featuredIds = featured.map((f) => f.id);
  const userPickByFeaturedId = new Map<string, "yes" | "no">();
  if (userId && featuredIds.length > 0) {
    const { data: userPicks } = await supabase
      .from("m_user_picks")
      .select("featured_game_id, choice")
      .eq("user_id", userId)
      .in("featured_game_id", featuredIds);
    for (const p of userPicks ?? []) {
      if (p.choice === "yes" || p.choice === "no") {
        userPickByFeaturedId.set(p.featured_game_id, p.choice);
      }
    }
  }

  const result: FeaturedPredictionGame[] = [];
  for (const game of generalGames) {
    const picksForGame = byGameUuid.get(game.id) ?? [];
    if (picksForGame.length === 0) continue;

    const homeProfile = profilesByKey.get(
      `${game.game_type}:${game.home_team_key}`
    );
    const awayProfile = profilesByKey.get(
      `${game.game_type}:${game.away_team_key}`
    );
    const homeStats = statsByKey.get(`${game.game_type}:${game.home_team_key}`);
    const awayStats = statsByKey.get(`${game.game_type}:${game.away_team_key}`);

    result.push({
      game_uuid: game.id,
      sports_game: {
        date_time: game.date_time,
        status: game.status,
        teams: {
          home: {
            key: game.home_team_key,
            logo_url: homeProfile?.logo_url ?? null,
            primary_color: homeProfile?.primary_color ?? null,
            wins: homeStats?.wins ?? 0,
            losses: homeStats?.losses ?? 0,
          },
          away: {
            key: game.away_team_key,
            logo_url: awayProfile?.logo_url ?? null,
            primary_color: awayProfile?.primary_color ?? null,
            wins: awayStats?.wins ?? 0,
            losses: awayStats?.losses ?? 0,
          },
        },
      },
      picks: picksForGame.map((p) => ({
        id: p.id,
        pick_question: p.pick_question,
        status: p.status,
        correct_answer: (p.correct_answer as "yes" | "no" | null) ?? null,
        user_pick: userPickByFeaturedId.get(p.id) ?? null,
      })),
    });
  }

  result.sort(
    (a, b) =>
      new Date(a.sports_game.date_time).getTime() -
      new Date(b.sports_game.date_time).getTime()
  );

  return result;
}

// Bar screen version — filters to live sports games only and includes
// aggregated Yes/No vote counts instead of a per-user pick.
export async function getBarscreenPredictions(): Promise<
  BarscreenPredictionGame[]
> {
  const { data: featured, error: featuredError } = await supabase
    .from("m_featured_games")
    .select(
      "id, game_id, home_team, away_team, pick_question, start_time, status, correct_answer"
    )
    .order("start_time", { ascending: true })
    .order("game_id", { ascending: true });

  if (featuredError || !featured || featured.length === 0) return [];

  const byGameUuid = new Map<string, typeof featured>();
  for (const row of featured) {
    const uuid = parseGameUuid(row.game_id);
    if (!uuid) continue;
    const list = byGameUuid.get(uuid) ?? [];
    list.push(row);
    byGameUuid.set(uuid, list);
  }
  if (byGameUuid.size === 0) return [];

  const gameUuids = [...byGameUuid.keys()];

  const { data: generalGames } = await supabase
    .from("general_games")
    .select(
      "id, game_type, date_time, status, home_team_key, away_team_key"
    )
    .in("id", gameUuids)
    .eq("status", "InProgress");

  if (!generalGames || generalGames.length === 0) return [];

  const teamKeysByGameType = new Map<string, Set<string>>();
  for (const g of generalGames) {
    const keys = teamKeysByGameType.get(g.game_type) ?? new Set<string>();
    keys.add(g.home_team_key);
    keys.add(g.away_team_key);
    teamKeysByGameType.set(g.game_type, keys);
  }

  const profilesByKey = new Map<
    string,
    { logo_url: string | null; primary_color: string | null }
  >();
  const statsByKey = new Map<string, { wins: number; losses: number }>();

  await Promise.all(
    [...teamKeysByGameType.entries()].map(async ([gameType, keys]) => {
      const keyArr = [...keys];
      const [profilesRes, statsRes] = await Promise.all([
        supabase
          .from("general_team_profiles")
          .select("team_key, team_primary_color, team_logo_url")
          .eq("game_type", gameType)
          .in("team_key", keyArr),
        supabase
          .from("general_team_season_stats")
          .select("team_key, team_wins, team_losses")
          .eq("game_type", gameType)
          .in("team_key", keyArr),
      ]);
      for (const p of profilesRes.data ?? []) {
        profilesByKey.set(`${gameType}:${p.team_key}`, {
          logo_url: p.team_logo_url,
          primary_color: p.team_primary_color,
        });
      }
      for (const s of statsRes.data ?? []) {
        statsByKey.set(`${gameType}:${s.team_key}`, {
          wins: Number(s.team_wins ?? 0),
          losses: Number(s.team_losses ?? 0),
        });
      }
    })
  );

  const liveGameUuids = new Set(generalGames.map((g) => g.id));
  const featuredIds = featured
    .filter((f) => {
      const uuid = parseGameUuid(f.game_id);
      return uuid !== null && liveGameUuids.has(uuid);
    })
    .map((f) => f.id);

  const votesByFeaturedId = new Map<string, { yes: number; no: number }>();
  if (featuredIds.length > 0) {
    const { data: votes } = await supabase
      .from("m_user_picks")
      .select("featured_game_id, choice")
      .in("featured_game_id", featuredIds);
    for (const v of votes ?? []) {
      const entry = votesByFeaturedId.get(v.featured_game_id) ?? {
        yes: 0,
        no: 0,
      };
      if (v.choice === "yes") entry.yes += 1;
      else if (v.choice === "no") entry.no += 1;
      votesByFeaturedId.set(v.featured_game_id, entry);
    }
  }

  const result: BarscreenPredictionGame[] = [];
  for (const game of generalGames) {
    const picksForGame = byGameUuid.get(game.id) ?? [];
    if (picksForGame.length === 0) continue;

    const homeProfile = profilesByKey.get(
      `${game.game_type}:${game.home_team_key}`
    );
    const awayProfile = profilesByKey.get(
      `${game.game_type}:${game.away_team_key}`
    );
    const homeStats = statsByKey.get(`${game.game_type}:${game.home_team_key}`);
    const awayStats = statsByKey.get(`${game.game_type}:${game.away_team_key}`);

    result.push({
      game_uuid: game.id,
      sports_game: {
        date_time: game.date_time,
        status: game.status,
        teams: {
          home: {
            key: game.home_team_key,
            logo_url: homeProfile?.logo_url ?? null,
            primary_color: homeProfile?.primary_color ?? null,
            wins: homeStats?.wins ?? 0,
            losses: homeStats?.losses ?? 0,
          },
          away: {
            key: game.away_team_key,
            logo_url: awayProfile?.logo_url ?? null,
            primary_color: awayProfile?.primary_color ?? null,
            wins: awayStats?.wins ?? 0,
            losses: awayStats?.losses ?? 0,
          },
        },
      },
      picks: picksForGame.map((p) => {
        const votes = votesByFeaturedId.get(p.id) ?? { yes: 0, no: 0 };
        return {
          id: p.id,
          pick_question: p.pick_question,
          status: p.status,
          correct_answer: (p.correct_answer as "yes" | "no" | null) ?? null,
          yes_votes: votes.yes,
          no_votes: votes.no,
        };
      }),
    });
  }

  result.sort(
    (a, b) =>
      new Date(a.sports_game.date_time).getTime() -
      new Date(b.sports_game.date_time).getTime()
  );

  return result;
}

// Submit a pick (one per user per game)
export async function submitPick(
  userId: string,
  featuredGameId: string,
  choice: string,
  multiplier: number
): Promise<{ pickId: string; status: string }> {
  // Verify game exists and is accepting picks
  const { data: game, error: gameError } = await supabase
    .from("m_featured_games")
    .select("id, status")
    .eq("id", featuredGameId)
    .single();

  if (gameError || !game) {
    throw new Error("Featured game not found");
  }

  if (game.status !== "scheduled") {
    throw new Error("Picks are locked — the game has already started");
  }

  // Validate multiplier
  if (![1, 2, 5].includes(multiplier)) {
    throw new Error("Invalid multiplier. Must be 1, 2, or 5");
  }

  // Validate choice
  if (choice !== "yes" && choice !== "no") {
    throw new Error("Invalid choice. Must be 'yes' or 'no'");
  }

  // Check if user already has a pick for this game
  const { data: existing } = await supabase
    .from("m_user_picks")
    .select("id")
    .eq("user_id", userId)
    .eq("featured_game_id", featuredGameId)
    .limit(1)
    .single();

  if (existing) {
    // Update existing pick
    const { data, error } = await supabase
      .from("m_user_picks")
      .update({ choice, multiplier })
      .eq("id", existing.id)
      .select("id, status")
      .single();

    if (error) {
      throw new Error(`Failed to update pick: ${error.message}`);
    }
    return { pickId: data.id, status: "locked" };
  }

  // Insert new pick
  const { data, error } = await supabase
    .from("m_user_picks")
    .insert({
      user_id: userId,
      featured_game_id: featuredGameId,
      choice,
      multiplier,
      status: "pending",
      iq_change: 0,
    })
    .select("id, status")
    .single();

  if (error) {
    throw new Error(`Failed to submit pick: ${error.message}`);
  }

  return { pickId: data.id, status: "locked" };
}

// Resolve a game (admin action) — sets correct_answer and updates all picks
export async function resolveGame(
  featuredGameId: string,
  correctAnswer: "yes" | "no"
): Promise<void> {
  // Update game status
  const { error: gameError } = await supabase
    .from("m_featured_games")
    .update({ status: "resolved", correct_answer: correctAnswer })
    .eq("id", featuredGameId);

  if (gameError) {
    throw new Error(`Failed to resolve game: ${gameError.message}`);
  }

  // Get all picks for this game
  const { data: picks, error: picksError } = await supabase
    .from("m_user_picks")
    .select("id, user_id, choice, multiplier")
    .eq("featured_game_id", featuredGameId);

  if (picksError || !picks) return;

  // Update each pick and adjust IQ points
  for (const pick of picks) {
    const won = pick.choice === correctAnswer;
    const scoring = IQ_SCORING[pick.multiplier as 1 | 2 | 5];
    const iqChange = won ? scoring.win : scoring.loss;

    // Update pick status
    await supabase
      .from("m_user_picks")
      .update({
        status: won ? "won" : "lost",
        iq_change: iqChange,
      })
      .eq("id", pick.id);

    // Look up user phone for points table
    const { data: userData } = await supabase
      .from("m_users")
      .select("phone")
      .eq("id", pick.user_id)
      .single();

    if (userData) {
      const { data: pointsRow } = await supabase
        .from("points_sportsiq")
        .select("points")
        .eq("phone", userData.phone)
        .single();

      const newPoints = Math.max(0, (pointsRow?.points ?? 0) + iqChange);

      await supabase
        .from("points_sportsiq")
        .upsert(
          { phone: userData.phone, points: newPoints },
          { onConflict: "phone" }
        );
    }
  }
}

// Get global leaderboard (top 100 + user rank)
export async function getGlobalLeaderboard(
  userId?: string
): Promise<{
  leaderboard: {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  }[];
  userRank: {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  } | null;
}> {
  // Get all points sorted by score
  const { data: allPoints } = await supabase
    .from("points_sportsiq")
    .select("phone, points")
    .order("points", { ascending: false });

  if (!allPoints) {
    return { leaderboard: [], userRank: null };
  }

  // Get all users to map phone → user info
  const { data: allUsers } = await supabase
    .from("m_users")
    .select("id, phone, name, avatar_url");

  if (!allUsers) {
    return { leaderboard: [], userRank: null };
  }

  const phoneToUser = new Map(
    allUsers.map((u) => [u.phone, { id: u.id, name: u.name, avatarUrl: u.avatar_url }])
  );

  // Build ranked list
  const ranked = allPoints
    .map((p, i) => {
      const user = phoneToUser.get(p.phone);
      if (!user) return null;
      return {
        rank: i + 1,
        userId: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        points: p.points,
      };
    })
    .filter(Boolean) as {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  }[];

  const top100 = ranked.slice(0, 100);
  let userRank = null;

  if (userId) {
    userRank = ranked.find((r) => r.userId === userId) ?? null;
  }

  return { leaderboard: top100, userRank };
}

// Get user stats for Settings modal
export async function getUserStats(
  userId: string
): Promise<{
  record: string;
  winRate: number;
  streak: number;
  rank: number;
  wins: number;
  losses: number;
}> {
  // Get all picks for user
  const { data: picks } = await supabase
    .from("m_user_picks")
    .select("status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const wins = picks?.filter((p) => p.status === "won").length ?? 0;
  const losses = picks?.filter((p) => p.status === "lost").length ?? 0;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
  const record = `${wins}-${losses}`;

  // Calculate current win streak
  let streak = 0;
  if (picks) {
    for (const pick of picks) {
      if (pick.status === "won") streak++;
      else if (pick.status === "lost") break;
    }
  }

  // Get rank from global leaderboard
  const leaderboard = await getGlobalLeaderboard(userId);
  const rank = leaderboard.userRank?.rank ?? 0;

  return { record, winRate, streak, rank, wins, losses };
}

// Get bar leaderboard (by venue — placeholder, uses all users for now)
export async function getBarLeaderboard(
  venueId?: string,
  userId?: string
): Promise<{
  leaderboard: {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  }[];
  userRank: {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  } | null;
}> {
  // For Phase 4, bar leaderboard returns the same as global
  // In the future, filter by venue_id
  return getGlobalLeaderboard(userId);
}

/**
 * Today's leaderboard: aggregates IQ points earned today from all activities.
 * Currently sources from m_user_picks resolved today.
 * The trivia nightly scores are handled in-memory by the socket server
 * and merged client-side on the bar screen.
 */
export async function getTodayLeaderboard(): Promise<{
  leaderboard: {
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    points: number;
  }[];
}> {
  const { DateTime } = require("luxon");
  const todayStart = DateTime.now()
    .setZone("America/New_York")
    .startOf("day")
    .toISO();

  // Sum iq_change per user for picks resolved today
  const { data: picks } = await supabase
    .from("m_user_picks")
    .select("user_id, iq_change, created_at")
    .in("status", ["won", "lost"])
    .gte("created_at", todayStart);

  // Build user_id → total points map
  const pointsMap = new Map<string, number>();
  for (const p of picks ?? []) {
    const current = pointsMap.get(p.user_id) ?? 0;
    pointsMap.set(p.user_id, current + (p.iq_change ?? 0));
  }

  if (pointsMap.size === 0) {
    return { leaderboard: [] };
  }

  // Fetch user info
  const { data: users } = await supabase
    .from("m_users")
    .select("id, name, avatar_url")
    .in("id", [...pointsMap.keys()]);

  const userMap = new Map(
    (users ?? []).map((u) => [u.id, { name: u.name, avatarUrl: u.avatar_url }])
  );

  // Build ranked list sorted by points descending
  const ranked = [...pointsMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([userId, points], i) => {
      const user = userMap.get(userId);
      return {
        rank: i + 1,
        userId,
        name: user?.name ?? "Unknown",
        avatarUrl: user?.avatarUrl ?? null,
        points,
      };
    });

  return { leaderboard: ranked.slice(0, 50) };
}
