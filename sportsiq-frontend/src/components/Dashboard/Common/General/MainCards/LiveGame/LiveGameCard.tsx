import DualRadial from "../../../../../Wrapper/DualRadial";

import { VSProgressBarCardProps } from "../../../../VSProgressBarCard";
import BorderWrapper from "../../../../../Wrapper/BorderWrapper";
import LiveGameCardHeader from "./LiveGameCardHeader";
import { SubBettingCardProps } from "../SubBettingCard";
import LiveGameCardBody from "./LiveGameCardBody";
import {
  getProbabilityDataFromLiveGame,
  getSportsbookDataFromLiveGame,
  getStatsDataFromGame,
} from "../../../../../../lib/utils";
import { LiveGame, SportsbookCardProps } from "../../../../../../types/general";
interface Props {
  isLarge: boolean;
  cardState: number;
  data: LiveGame;
}

export default function LiveGameCard({ isLarge, cardState, data }: Props) {
  const sportsbookData: SportsbookCardProps[] =
    getSportsbookDataFromLiveGame(data);
  const probabilityData: SubBettingCardProps[] =
    getProbabilityDataFromLiveGame(data);
  const statsData: VSProgressBarCardProps[] = getStatsDataFromGame(data);

  return (
    <BorderWrapper isAnimating={true}>
      <DualRadial
        left={`${data.away_team_primary_color}` || "#3C2B58"}
        right={`${data.home_team_primary_color}` || "#25375B"}
        className={`rounded-[8px] p-4 bg-green-900 flex flex-col gap-3 h-[427px]`}
      >
        <LiveGameCardHeader
          isLarge={isLarge}
          gameType={data.game_type}
          quarter={data.quarter}
          time_remaining_minutes={data.time_remaining_minutes}
          time_remaining_seconds={data.time_remaining_seconds}
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
          possession={data.possession}
          down={data.down}
          distance={data.distance}
          yard_line={data.yard_line}
        />

        <LiveGameCardBody
          isLarge={isLarge}
          cardState={cardState}
          sportsbookData={sportsbookData}
          probabilityData={probabilityData}
          statsData={statsData}
        />
      </DualRadial>
    </BorderWrapper>
  );
}
