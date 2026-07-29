import {
  getBettingDataFromPreGame,
  getSportsbookDataFromPreGame,
} from "../../../../lib/utils";
import { PreGame } from "../../../../types/general";
import DualRadial from "../../../Wrapper/DualRadial";
import GradientContainer from "../../Common/Contest/GradientContainer";
import PreGameCardHeader from "../../Common/General/MainCards/PreGame/PreGameCardHeader";
import SubBettingCard, {
  SubBettingCardProps,
} from "../../Common/General/MainCards/SubBettingCard";
import SportsbookCard, {
  SportsbookCardProps,
} from "../../Common/General/SportsbookCard";

interface Props {
  game: PreGame;
}

const ContestPreGameView = ({ game }: Props) => {
  const bettingData: SubBettingCardProps[] = getBettingDataFromPreGame(
    game,
    true
  );

  const sportsbookData: SportsbookCardProps[] =
    getSportsbookDataFromPreGame(game);

  return (
    <>
      <DualRadial
        left={game.away_team_primary_color}
        right={game.home_team_primary_color}
        className="w-full h-full bg-white flex flex-col items-center justify-center p-3 gap-2"
      >
        <PreGameCardHeader
          isLarge={true}
          date_time={game.date_time}
          away_team_primary_color={game.away_team_primary_color}
          home_team_primary_color={game.home_team_primary_color}
          away_team_logo_url={game.away_team_logo_url}
          home_team_logo_url={game.home_team_logo_url}
          away_team_key={game.away_team_key}
          home_team_key={game.home_team_key}
          away_team_wins={game.away_team_wins}
          home_team_wins={game.home_team_wins}
          away_team_losses={game.away_team_losses}
          home_team_losses={game.home_team_losses}
        />

        <div className="w-full h-5/12">
          <GradientContainer title="Markets">
            <div className="w-full h-full flex flex-col items-center justify-between gap-1.5">
              {bettingData.map((data: SubBettingCardProps, index: number) => (
                <SubBettingCard key={index} data={data} />
              ))}
            </div>
          </GradientContainer>
        </div>

        <div className="w-full h-7/12">
          <GradientContainer title="Odds">
            <div className="w-full h-full flex items-center justify-between gap-1.5">
              {sportsbookData.map(
                (data: SportsbookCardProps, index: number) => (
                  <SportsbookCard key={index} isLarge={true} data={data} />
                )
              )}
            </div>
          </GradientContainer>
        </div>
      </DualRadial>
    </>
  );
};

export default ContestPreGameView;
