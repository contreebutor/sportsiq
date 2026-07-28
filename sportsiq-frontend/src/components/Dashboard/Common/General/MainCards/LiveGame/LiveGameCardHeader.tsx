import { getReversedColor } from "../../../../../../lib/utils";
import { GameQuarter, GameType } from "../../../../../../types/general";

type Props = {
  isLarge: boolean;
  gameType: GameType;
  quarter: GameQuarter;
  time_remaining_minutes: number | null;
  time_remaining_seconds: number | null;
  home_team_primary_color: string;
  away_team_primary_color: string;
  home_team_logo_url: string;
  away_team_logo_url: string;
  home_team_key: string;
  away_team_key: string;
  home_team_wins: number;
  away_team_wins: number;
  home_team_losses: number;
  away_team_losses: number;
  home_team_score: number;
  away_team_score: number;
  possession: string | null;
  down: number | null;
  distance: string | null;
  yard_line: number | null;
};

export default function LiveGameCardHeader({
  isLarge = true,
  gameType,
  quarter,
  time_remaining_minutes,
  time_remaining_seconds,
  home_team_primary_color,
  away_team_primary_color,
  home_team_logo_url,
  away_team_logo_url,
  home_team_key,
  away_team_key,
  home_team_wins,
  away_team_wins,
  home_team_losses,
  away_team_losses,
  home_team_score,
  away_team_score,
  possession,
  down,
  distance,
  yard_line,
}: Props) {
  let title = "";
  let downAndDistanceString = "";

  if (quarter) {
    if (quarter.toUpperCase() === "HALF") {
      title = "HALFTIME";
    } else if (quarter === "OT") {
      title = "OVERTIME";
    } else if (quarter === "F") {
      title = "FINAL";
    } else if (quarter === "F/OT") {
      title = "FINAL/OT";
    } else {
      const timeString = `${time_remaining_minutes ?? 0}:${String(
        time_remaining_seconds ?? 0
      ).padStart(2, "0")}`;
      if (gameType === "cbb") {
        if (quarter === "1") {
          title = "1ST";
        } else if (quarter === "2") {
          title = "2ND";
        }
        if (isLarge) {
          title += " HALF";
        }
        title += ` · ${timeString}`;
      } else if (gameType === "mlb") {
        const inningNum = parseInt(quarter);
        const suffix =
          inningNum === 1 ? "ST" : inningNum === 2 ? "ND" : inningNum === 3 ? "RD" : "TH";
        title = isLarge ? `${inningNum}${suffix} INNING` : `${inningNum}${suffix}`;
      } else {
        title = `Q${quarter} · ${timeString}`;
      }
    }
  } else {
    title = "";
  }

  if (down) {
    switch (down) {
      case 1:
        downAndDistanceString = "1st";
        break;
      case 2:
        downAndDistanceString = "2nd";
        break;
      case 3:
        downAndDistanceString = "3rd";
        break;
      case 4:
        downAndDistanceString = "4th";
        break;
      default:
        downAndDistanceString = "";
        break;
    }
  }

  if (distance) {
    downAndDistanceString += ` and ${distance} on ${possession}`;
  }

  if (yard_line) {
    downAndDistanceString += `  ${yard_line}`;
  }

  // Contrast-aware styles for away and home wins-losses
  const awayWinsLossesStyle = {
    color: getReversedColor(away_team_primary_color),

    padding: "0 .3em",
    marginLeft: "-.2em",
    marginRight: "-.2em",
    fontWeight: 500,
  };

  const homeWinsLossesStyle = {
    color: getReversedColor(home_team_primary_color),

    padding: "0 .3em",
    marginLeft: "-.2em",
    marginRight: "-.2em",
    fontWeight: 500,
  };

  return (
    <div className="w-full h-[60px] flex items-center justify-between">
      <div
        className={`${
          isLarge ? "gap-2" : "gap-1"
        } flex flex-1 justify-start items-center`}
      >
        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src={away_team_logo_url}
            alt={away_team_key}
            className="w-12 h-12 object-contain"
          />
        </div>
        <div>
          {isLarge ? (
            <>
              <div
                className={"text-3xl text-white font-medium -mb-1.5"}
                style={{
                  color: getReversedColor(away_team_primary_color),
                }}
              >
                {away_team_key}
              </div>
              <span className="font-light text-2xl" style={awayWinsLossesStyle}>
                {away_team_wins}-{away_team_losses}
              </span>
            </>
          ) : (
            <>
              <span className="text-white text-2xl font-medium">
                {away_team_score}
              </span>
              <div
                className={`${
                  away_team_key.length > 3 ? "text-lg" : "text-2xl"
                } text-white -mt-1.5`}
              >
                {away_team_key}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center text-white font-medium">
        <>
          {isLarge ? (
            <>
              <div className="flex items-center gap-10">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-medium">
                    {away_team_score}
                  </span>
                  {gameType === "nfl" && (
                    <PossessionIndicator
                      possession={possession}
                      team_key={away_team_key}
                    />
                  )}
                </div>
                <span className="text-2xl">{title}</span>
                <div className="flex items-center gap-3">
                  {gameType === "nfl" && (
                    <PossessionIndicator
                      possession={possession}
                      team_key={home_team_key}
                    />
                  )}
                  <span className="text-3xl font-medium">
                    {home_team_score}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                {gameType === "nfl" && (
                  <PossessionIndicator
                    possession={possession}
                    team_key={away_team_key}
                  />
                )}
                <span className="text-lg">{title}</span>
                {gameType === "nfl" && (
                  <PossessionIndicator
                    possession={possession}
                    team_key={home_team_key}
                  />
                )}
              </div>
            </>
          )}
        </>

        {downAndDistanceString && (
          <span
            className={`${
              isLarge ? "text-xl" : "text-base"
            } text-white font-medium`}
          >
            {downAndDistanceString}
          </span>
        )}
      </div>

      <div
        className={`${
          isLarge ? "gap-2" : "gap-1"
        } flex flex-1 justify-end items-center`}
      >
        <div className="text-right flex flex-col">
          {isLarge ? (
            <>
              <div
                className={"text-3xl text-white font-medium -mb-1.5"}
                style={{
                  color: getReversedColor(home_team_primary_color),
                }}
              >
                {home_team_key}
              </div>
              <span className="font-light text-2xl" style={homeWinsLossesStyle}>
                {home_team_wins}-{home_team_losses}
              </span>
            </>
          ) : (
            <>
              <span className="text-white text-2xl font-medium">
                {home_team_score}
              </span>
              <div
                className={`${
                  home_team_key.length > 3 ? "text-lg" : "text-2xl"
                } text-white -mt-1.5`}
              >
                {home_team_key}
              </div>
            </>
          )}
        </div>

        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src={home_team_logo_url}
            alt={home_team_key}
            className="w-12 h-12 object-contain"
          />
        </div>
      </div>
    </div>
  );
}

const PossessionIndicator = ({
  possession,
  team_key,
}: {
  possession: string | null;
  team_key: string;
}) => {
  if (possession === team_key) {
    return (
      <img
        src="/possession-indicator.svg"
        alt="possession"
        className="w-8 h-8"
      />
    );
  } else {
    return <span className="w-8 h-8" />;
  }
};
