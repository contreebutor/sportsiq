import { getReversedColor } from "../../../../../../lib/utils";

interface Props {
  isLarge: boolean;
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
  away_team_score: number;
  home_team_score: number;
}

export default function FinalGameCardHeader({
  isLarge,
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
  away_team_score,
  home_team_score,
}: Props) {
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
    <div className="h-[60px] flex items-center justify-between">
      <div className={`${isLarge ? "gap-2" : "gap-1"} flex items-center`}>
        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src={away_team_logo_url}
            alt={away_team_key}
            className="w-12 h-12 object-contain"
          />
        </div>
        <div>
          <>
            <div
              className={`${
                isLarge ? "text-3xl" : "text-lg"
              } text-white font-medium -mb-1.5`}
              style={{
                color: getReversedColor(away_team_primary_color),
              }}
            >
              {away_team_key}
            </div>
            <span className="font-light text-lg" style={awayWinsLossesStyle}>
              {away_team_wins}-{away_team_losses}
            </span>
          </>
        </div>
      </div>

      <div className="text-white font-medium">
        <div
          className={`${
            isLarge ? "text-2xl gap-8" : "text-lg gap-3"
          } flex items-center justify-center`}
        >
          <span>{away_team_score}</span>
          <span>FINAL</span>
          <span>{home_team_score}</span>
        </div>
      </div>

      <div className={`${isLarge ? "gap-2" : "gap-1"} flex items-center`}>
        <div className="text-right flex flex-col">
          <div
            className={`${
              isLarge ? "text-3xl" : "text-lg"
            } text-white font-medium -mb-1.5`}
            style={{
              color: getReversedColor(home_team_primary_color),
            }}
          >
            {home_team_key}
          </div>
          <span className="font-light text-lg" style={homeWinsLossesStyle}>
            {home_team_wins}-{home_team_losses}
          </span>
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
