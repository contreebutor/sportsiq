import { supabase } from "../utils/supabase";
import { resolveGame } from "./picksService";

const POLL_INTERVAL_MS = 5_000;

export const startPredictorWorker = async (): Promise<void> => {
  console.log("Predictor worker started");

  const tick = async () => {
    try {
      await runCycle();
    } catch (err) {
      console.error("Predictor worker cycle error:", err);
    }
    setTimeout(tick, POLL_INTERVAL_MS);
  };

  await tick();
};

async function runCycle(): Promise<void> {
  await autoResolveFeaturedGames();
}

function parseGameUuid(featuredGameId: string): string | null {
  const i = featuredGameId.lastIndexOf("_");
  if (i === -1) return null;
  return featuredGameId.slice(0, i);
}

async function fetchTeamStats(
  gameType: string,
  gameId: number,
  teamKey: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from(`team_game_stats_${gameType}`)
    .select("*")
    .eq("game_id", gameId)
    .eq("team_key", teamKey)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error(`Error fetching ${gameType} stats for ${teamKey}:`, error);
    return null;
  }

  return data?.[0] ?? null;
}

function getStatValue(
  stats: Record<string, unknown> | null | undefined,
  categoryValue: string
): number {
  if (!stats) return 0;
  const value = stats[categoryValue] ?? stats[String(categoryValue)];
  return typeof value === "number" ? value : 0;
}

// Box-score stats (points, 3PTM, rebounds, etc.) only increase during a game,
// so some conditions can be resolved mid-game once they're mathematically locked:
//   `>= X`  → YES as soon as stat >= X
//   `<= X`  → NO  as soon as stat >  X
//   `== X`  → NO  as soon as stat >  X
// Everything else waits for Final.
function decideAnswer(
  statValue: number,
  operator: string,
  threshold: number,
  isFinal: boolean
): "yes" | "no" | null {
  if (isFinal) {
    switch (operator) {
      case ">=":
        return statValue >= threshold ? "yes" : "no";
      case "<=":
        return statValue <= threshold ? "yes" : "no";
      case "==":
        return statValue === threshold ? "yes" : "no";
      default:
        return null;
    }
  }
  switch (operator) {
    case ">=":
      return statValue >= threshold ? "yes" : null;
    case "<=":
    case "==":
      return statValue > threshold ? "no" : null;
    default:
      return null;
  }
}

async function autoResolveFeaturedGames(): Promise<void> {
  const { data: featuredGames, error } = await supabase
    .from("m_featured_games")
    .select("*")
    .in("status", ["scheduled", "live"])
    .not("resolve_category", "is", null);

  if (error || !featuredGames || featuredGames.length === 0) return;

  const rowsByUuid = new Map<string, typeof featuredGames>();
  for (const fg of featuredGames) {
    const uuid = parseGameUuid(fg.game_id);
    if (!uuid) continue;
    const list = rowsByUuid.get(uuid) ?? [];
    list.push(fg);
    rowsByUuid.set(uuid, list);
  }
  if (rowsByUuid.size === 0) return;

  const { data: games } = await supabase
    .from("general_games")
    .select("id, status, game_type, home_team_key, away_team_key, game_id")
    .in("id", [...rowsByUuid.keys()]);

  if (!games || games.length === 0) return;

  for (const game of games) {
    const rows = rowsByUuid.get(game.id) ?? [];
    const isLive = game.status === "InProgress";
    const isFinal = game.status === "Final" || game.status === "F/OT";

    if (isLive) {
      const toActivate = rows.filter((r) => r.status === "scheduled");
      if (toActivate.length > 0) {
        await supabase
          .from("m_featured_games")
          .update({ status: "live" })
          .in(
            "id",
            toActivate.map((r) => r.id)
          );
        for (const r of toActivate) r.status = "live";
      }
    }

    if (!isLive && !isFinal) continue;

    const homeStats = await fetchTeamStats(
      game.game_type,
      game.game_id,
      game.home_team_key
    );
    const awayStats = await fetchTeamStats(
      game.game_type,
      game.game_id,
      game.away_team_key
    );

    for (const fg of rows) {
      if (fg.resolve_value == null || !fg.resolve_operator) continue;

      let statValue: number;
      if (fg.resolve_team === "total") {
        statValue =
          getStatValue(homeStats, fg.resolve_category) +
          getStatValue(awayStats, fg.resolve_category);
      } else {
        const stats =
          fg.resolve_team === "home" ? homeStats : awayStats;
        statValue = getStatValue(stats, fg.resolve_category);
      }

      const answer = decideAnswer(
        statValue,
        fg.resolve_operator,
        Number(fg.resolve_value),
        isFinal
      );
      if (!answer) continue;

      try {
        await resolveGame(fg.id, answer);
        console.log(
          `Auto-resolved featured game ${fg.id}: ${fg.pick_question} → ${answer} (stat=${statValue}, condition=${fg.resolve_operator}${fg.resolve_value}, ${isFinal ? "final" : "mid-game"})`
        );
      } catch (err) {
        console.error(`Error auto-resolving featured game ${fg.id}:`, err);
      }
    }
  }
}
