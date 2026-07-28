import {
  convertToClientTimezone,
  getReversedColor,
} from "../../../../../../lib/utils";

interface Props {
  isLarge: boolean;
  date_time: string;
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

export default function PreGameCardHeader({
  isLarge,
  date_time,
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
  const clientTimeString = convertToClientTimezone(date_time);
  const curDate = new Date(clientTimeString);

  const time = curDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  // Check if the date is today
  const today = new Date();
  const isToday =
    curDate.getFullYear() === today.getFullYear() &&
    curDate.getMonth() === today.getMonth() &&
    curDate.getDate() === today.getDate();

  const day = curDate
    .toLocaleDateString([], {
      weekday: "long",
    })
    .slice(0, 3);

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
          <div
            className={`${
              isLarge
                ? "text-3xl"
                : away_team_key.length > 3
                ? "text-lg"
                : "text-2xl"
            } text-white font-medium -mb-1.5`}
            style={{
              color: getReversedColor(away_team_primary_color),
            }}
          >
            {away_team_key}
          </div>
          <span className="font-light text-xl" style={awayWinsLossesStyle}>
            {away_team_wins !== null ? away_team_wins : "0"}-
            {away_team_losses !== null ? away_team_losses : "0"}
          </span>
        </div>
      </div>

      <div className="text-white font-medium">
        {isLarge ? (
          <span className="text-2xl">
            {time}
            {!isToday && ` · ${day}`}
          </span>
        ) : (
          <div className="flex flex-col items-center text-lg">
            <span>{time}</span>
            {!isToday && <span>{day}</span>}
          </div>
        )}
      </div>

      <div
        className={`${
          isLarge ? "gap-2" : "gap-1"
        } flex flex-1 justify-end items-center`}
      >
        <div className="text-right flex flex-col">
          <div
            className={`${
              isLarge
                ? "text-3xl"
                : home_team_key.length > 3
                ? "text-lg"
                : "text-2xl"
            } text-white font-medium -mb-1.5`}
            style={{
              color: getReversedColor(home_team_primary_color),
            }}
          >
            {home_team_key}
          </div>
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
