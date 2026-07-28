import {
  getBettingDataFromPreGame,
  getSportsbookDataFromPreGame,
} from "../../../../../../lib/utils";
import { PreGame } from "../../../../../../types/general";
import BorderWrapper from "../../../../../Wrapper/BorderWrapper";
import DualRadial from "../../../../../Wrapper/DualRadial";
import { SportsbookCardProps } from "../../SportsbookCard";
import { SubBettingCardProps } from "../SubBettingCard";
import PreGameCardBody from "./PreGameCardBody";
import PreGameCardHeader from "./PreGameCardHeader";

type Props = {
  isLarge: boolean;
  cardState: number;
  data: PreGame;
};

export default function PreGameCard({ isLarge, cardState, data }: Props) {
  const bettingData: SubBettingCardProps[] = getBettingDataFromPreGame(
    data,
    isLarge
  );

  const sportsbookData: SportsbookCardProps[] =
    getSportsbookDataFromPreGame(data);

  return (
    <BorderWrapper isAnimating={false}>
      <DualRadial
        left={`${data.away_team_primary_color}` || "#3C2B58"}
        right={`${data.home_team_primary_color}` || "#25375B"}
        className={`rounded-[8px] p-4 bg-green-900 flex flex-col gap-3 h-[427px]`}
      >
        <PreGameCardHeader
          isLarge={isLarge}
          date_time={data.date_time}
          away_team_primary_color={data.away_team_primary_color}
          home_team_primary_color={data.home_team_primary_color}
          away_team_logo_url={data.away_team_logo_url}
          home_team_logo_url={data.home_team_logo_url}
          away_team_key={data.away_team_key}
          home_team_key={data.home_team_key}
          away_team_wins={data.away_team_wins}
          home_team_wins={data.home_team_wins}
          away_team_losses={data.away_team_losses}
          home_team_losses={data.home_team_losses}
        />

        <PreGameCardBody
          isLarge={isLarge}
          cardState={cardState}
          bettingData={bettingData}
          sportsbookData={sportsbookData}
        />
      </DualRadial>
    </BorderWrapper>
  );
}
