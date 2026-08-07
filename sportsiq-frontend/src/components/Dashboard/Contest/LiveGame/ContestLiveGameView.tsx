import { LiveGame } from "../../../../types/general";
import DualRadial from "../../../Wrapper/DualRadial";
import GradientContainer from "../../Common/Contest/GradientContainer";
import LiveGameCardHeader from "../../Common/General/MainCards/LiveGame/LiveGameCardHeader";
import SportsbookCard, {
  SportsbookCardProps,
} from "../../Common/General/SportsbookCard";
import {
  getProbabilityDataFromLiveGame,
  getSportsbookDataFromLiveGame,
} from "../../../../lib/utils";
import SubBettingCard, {
  SubBettingCardProps,
} from "../../Common/General/MainCards/SubBettingCard";
import VSProgressBarCard, {
  VSProgressBarCardProps,
} from "../../Common/General/VSProgressBarCard";
import { getStatsDataFromGame } from "../../../../lib/utils";

interface Props {
  game: LiveGame | null;
}

export default function ContestLiveGameView({ game }: Props) {
  const sportsbookData: SportsbookCardProps[] =
    getSportsbookDataFromLiveGame(game);
  const probabilityData: SubBettingCardProps[] =
    getProbabilityDataFromLiveGame(game);
  const statsData: VSProgressBarCardProps[] = getStatsDataFromGame(game);

  return (
    <>
      <DualRadial
        left={`${game.away_team_primary_color}`}
        right={`${game.home_team_primary_color}`}
        className="w-full h-full shrink-0 bg-white flex flex-col items-center justify-center p-3 gap-2"
      >
        <LiveGameCardHeader
          isLarge
          gameType={game.game_type}
          quarter={game.quarter}
          time_remaining_minutes={game.time_remaining_minutes}
          time_remaining_seconds={game.time_remaining_seconds}
          home_team_primary_color={game.home_team_primary_color}
          away_team_primary_color={game.away_team_primary_color}
          home_team_logo_url={game.home_team_logo_url}
          away_team_logo_url={game.away_team_logo_url}
          home_team_key={game.home_team_key}
          away_team_key={game.away_team_key}
          home_team_wins={game.home_team_wins}
          away_team_wins={game.away_team_wins}
          home_team_losses={game.home_team_losses}
          away_team_losses={game.away_team_losses}
          home_team_score={game.home_team_score}
          away_team_score={game.away_team_score}
          possession={game.possession}
          down={game.down}
          distance={game.distance}
          yard_line={game.yard_line}
        />

        <GradientContainer title="Live Odds">
          <div className="w-full h-full grid grid-cols-4 gap-1.5">
            {sportsbookData.map((data: SportsbookCardProps, index: number) => (
              <SportsbookCard key={index} isLarge={true} data={data} />
            ))}
          </div>
        </GradientContainer>

        <GradientContainer title="Projections">
          <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
            {probabilityData.map((data: SubBettingCardProps, index: number) => (
              <SubBettingCard key={index} data={data} />
            ))}
          </div>
        </GradientContainer>
        <GradientContainer title="Team Stats">
          <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
            {statsData.map((data: VSProgressBarCardProps, index: number) => (
              <span
                key={`stats-card-${index}`}
                className="w-full h-full bg-white rounded-sm flex items-center justify-center px-3"
              >
                <VSProgressBarCard
                  key={index}
                  showProgressBar={true}
                  data={data}
                />
              </span>
            ))}
          </div>
        </GradientContainer>
      </DualRadial>
    </>
  );
}
