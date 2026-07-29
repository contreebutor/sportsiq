import DualRadial from "../../../../../Wrapper/DualRadial";
import VSProgressBarCard, {
  VSProgressBarCardProps,
} from "../../../../VSProgressBarCard";
import FinalGameCardHeader from "./FinalGameCardHeader";
import { FinalGame } from "../../../../../../types/general";
import { getStatsDataFromGame } from "../../../../../../lib/utils";

interface Props {
  isLarge: boolean;
  data: FinalGame;
}

const FinalGameCard = ({ isLarge, data }: Props) => {
  const statsData: VSProgressBarCardProps[] = getStatsDataFromGame(data);

  return (
    <DualRadial
      left={`${data.away_team_primary_color}` || "#3C2B58"}
      right={`${data.home_team_primary_color}` || "#25375B"}
      className={`rounded-[8px] p-4 bg-green-900 flex flex-col gap-3 h-[427px]`}
    >
      <FinalGameCardHeader
        isLarge={isLarge}
        home_team_primary_color={data.home_team_primary_color}
        away_team_primary_color={data.away_team_primary_color}
        home_team_logo_url={data.home_team_logo_url}
        away_team_logo_url={data.away_team_logo_url}
        home_team_key={data.home_team_key}
        away_team_key={data.away_team_key}
        home_team_wins={data.home_team_wins}
        away_team_wins={data.away_team_wins}
        home_team_losses={data.home_team_losses}
        away_team_losses={data.away_team_losses}
        home_team_score={data.home_team_score}
        away_team_score={data.away_team_score}
      />

      <div className="h-full flex flex-col items-center justify-between gap-1">
        {statsData.map((stat, index) => (
          <div
            key={`finalgamecard-${index}`}
            className="w-full h-full bg-white rounded-xs flex items-center justify-center px-3"
          >
            <VSProgressBarCard
              key={index}
              showProgressBar={isLarge}
              data={stat}
            />
          </div>
        ))}
      </div>
    </DualRadial>
  );
};

export default FinalGameCard;
