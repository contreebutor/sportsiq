import { getReversedColor } from "../../lib/utils";

interface Props {
  title: string;
  away_team_primary_color: string;
  home_team_primary_color: string;
  away_team_logo_url: string;
  home_team_logo_url: string;
  away_team_key: string;
  home_team_key: string;
  away_team_wins: number;
  home_team_wins: number;
  away_team_losses: number;
  home_team_losses: number;
}

export default function PreBingoCardHeader({
  title,
  away_team_primary_color,
  home_team_primary_color,
  away_team_logo_url,
  home_team_logo_url,
  away_team_key,
  home_team_key,
  away_team_wins,
  home_team_wins,
  away_team_losses,
  home_team_losses,
}: Props) {
  // Contrast-aware styles for away and home wins-losses
  const awayWinsLossesStyle = {
    color: getReversedColor(away_team_primary_color),
  };

  const homeWinsLossesStyle = {
    color: getReversedColor(home_team_primary_color),
  };

  return (
    <div className="w-full h-[60px] flex items-center justify-between">
      <div className="gap-1 flex flex-1 items-center">
        <div className="w-16 h-16 flex items-center justify-center">
          <img
            src={away_team_logo_url}
            alt={away_team_key}
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="flex flex-col items-start">
          <span
            className="text-xl text-white font-medium -mb-1.5"
            style={awayWinsLossesStyle}
          >
            {away_team_key}
          </span>
          <span className="font-light text-xl" style={awayWinsLossesStyle}>
            {away_team_wins !== null ? away_team_wins : "0"}-
            {away_team_losses !== null ? away_team_losses : "0"}
          </span>
        </div>
      </div>

      <span className="text-lg text-white font-medium text-center">
        {title}
      </span>

      <div className="gap-1 flex flex-1 items-center justify-end">
        <div className="text-right flex flex-col">
          <span
            className="text-xl text-white font-medium -mb-1.5"
            style={homeWinsLossesStyle}
          >
            {home_team_key}
          </span>
          <span className="font-light text-xl" style={homeWinsLossesStyle}>
            {home_team_wins !== null ? home_team_wins : "0"}-
            {home_team_losses !== null ? home_team_losses : "0"}
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
