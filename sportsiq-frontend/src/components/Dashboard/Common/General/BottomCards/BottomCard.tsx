import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import { BottomCardProps, HighlightedOdd } from "../../../../../types/general";
import DualRadial from "../../../../Wrapper/DualRadial";
import { useEffect, useRef } from "react";

export default function BottomCard({
  data,
  cardState,
}: {
  data: BottomCardProps;
  cardState: number;
}) {
  const swiperRef = useRef<SwiperRef | null>(null);

  useEffect(() => {
    swiperRef.current?.swiper?.slideTo(cardState);
  }, [cardState]);

  const cells: {
    direction: "left" | "right";
    data: HighlightedOdd | null;
  }[] = [
    {
      direction: "left",
      data: data.moneyline.away[0] || null,
    },
    {
      direction: "right",
      data: data.moneyline.home[0] || null,
    },
    {
      direction: "left",
      data: data.spread.away[0] || null,
    },
    {
      direction: "right",
      data: data.spread.home[0] || null,
    },
    {
      direction: "left",
      data: data.total.away[0] || null,
    },
    {
      direction: "right",
      data: data.total.home[0] || null,
    },
  ];

  return (
    <>
      <div className="flex-1 rounded-[4px] overflow-hidden flex flex-col">
        {/* Header */}
        <DualRadial
          left={`${data.away_team_primary_color}`}
          right={`${data.home_team_primary_color}`}
          className="h-10 px-1 py-1 text-white flex items-center justify-between"
        >
          {/* Left Team */}
          <div className="flex flex-1 justify-start items-center gap-1">
            <img
              src={data.away_team_logo_url}
              alt={data.away_team_key}
              className="size-[32px]"
            />
            <div
              className={`font-bold tracking-wide leading-none ${
                data.away_team_key.length > 3 ? "text-xs" : "text-lg"
              }`}
            >
              {data.away_team_key}
            </div>
          </div>

          {/* Title */}
          <div
            className={`font-semibold tracking-wide text-center leading-none ${
              data.title.length > 8 ? "text-xs" : "text-base"
            }`}
          >
            {data.title}
          </div>

          {/* Right Team */}
          <div className="flex flex-1 justify-end items-center gap-1">
            <div
              className={`font-bold tracking-wide leading-none ${
                data.home_team_key.length > 3 ? "text-xs" : "text-lg"
              }`}
            >
              {data.home_team_key}
            </div>
            <img
              src={data.home_team_logo_url}
              alt={data.home_team_key}
              className="size-[32px]"
            />
          </div>
        </DualRadial>

        {/* Body */}
        <div className="w-full h-full p-1 bg-white flex items-center justify-center">
          {["Final", "F/OT"].includes(data.status) ? (
            <FinalScoreboardBody
              data={{
                awayTeamName: data.away_team_key,
                awayTeamScore: data.away_team_score,
                awayTeamColor: data.away_team_primary_color,

                homeTeamName: data.home_team_key,
                homeTeamScore: data.home_team_score,
                homeTeamColor: data.home_team_primary_color,

                coverage: (() => {
                  const awayTeamCovered =
                    data.away_team_score +
                      parseFloat(data.spread.away[0]?.value || "0") >
                    data.home_team_score;

                  const gameWentOver =
                    data.away_team_score + data.home_team_score >
                    parseFloat(data.total.away[0]?.value || "0");

                  return awayTeamCovered
                    ? `${data.away_team_key} covered ${
                        data.spread.away[0]?.value
                      }, ${gameWentOver ? "Over" : "Under"} ${
                        data.total.away[0]?.value
                      }`
                    : `${data.home_team_key} covered ${
                        data.spread.home[0]?.value
                      }, ${gameWentOver ? "Over" : "Under"} ${
                        data.total.home[0]?.value
                      }`;
                })(),
              }}
            />
          ) : data.status === "InProgress" ? (
            <Swiper
              ref={swiperRef}
              spaceBetween={50}
              slidesPerView={1}
              onSlideChange={() => {}}
              onSwiper={() => {}}
              loop={true}
              initialSlide={0}
              className="w-full h-full flex flex-col items-center justify-center"
              onInit={() => {}}
              direction="horizontal"
            >
              {/* Sportsbook */}
              <SwiperSlide>
                <LiveScoreboardBodyFirst
                  data={{
                    awayTeamName: data.away_team_key,
                    awayTeamScore: data.away_team_score,
                    awayTeamColor: data.away_team_primary_color,

                    homeTeamName: data.home_team_key,
                    homeTeamScore: data.home_team_score,
                    homeTeamColor: data.home_team_primary_color,
                  }}
                />
              </SwiperSlide>
              <SwiperSlide>
                <div className="w-full h-full grid grid-cols-2 gap-1">
                  {cells.map((cell, index) => (
                    <ScoreboardCell
                      key={`scoreboard-cell-${index}`}
                      direction={cell.direction}
                      data={cell.data}
                    />
                  ))}
                </div>
              </SwiperSlide>
            </Swiper>
          ) : (
            <div className="w-full h-full grid grid-cols-2 gap-1">
              {cells.map((cell, index) => (
                <ScoreboardCell
                  key={`scoreboard-cell-${index}`}
                  direction={cell.direction}
                  data={cell.data}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface LiveScoreboardBodyFirstProps {
  awayTeamName: string;
  awayTeamScore: number;
  awayTeamColor: string;

  homeTeamName: string;
  homeTeamScore: number;
  homeTeamColor: string;
}

const LiveScoreboardBodyFirst = ({
  data,
}: {
  data: LiveScoreboardBodyFirstProps;
}) => {
  return (
    <>
      <div className="w-full h-full flex items-center gap-2">
        {/* Away Team */}
        <div className="w-full h-full bg-gray-100 rounded-xs flex flex-col items-center justify-center">
          <span className="text-base text-gray-500 font-medium">
            {data.awayTeamName}
          </span>
          <span
            className="font-bold text-3xl"
            style={{ color: data.awayTeamColor }}
          >
            {data.awayTeamScore}
          </span>
        </div>

        {/* Home Team */}
        <div className="w-full h-full bg-gray-100 rounded-xs flex flex-col items-center justify-center">
          <span className="text-base text-gray-500 font-medium">
            {data.homeTeamName}
          </span>
          <span
            className="font-bold text-3xl"
            style={{ color: data.homeTeamColor }}
          >
            {data.homeTeamScore}
          </span>
        </div>
      </div>
    </>
  );
};

interface FinalScoreboardBodyProps extends LiveScoreboardBodyFirstProps {
  coverage: string;
}

const FinalScoreboardBody = ({ data }: { data: FinalScoreboardBodyProps }) => {
  return (
    <>
      <div className="w-full h-full flex flex-col items-center gap-2.5">
        <LiveScoreboardBodyFirst data={data} />

        {/* Coverage */}
        <span className="text-center text-gray-700 font-medium">
          {data.coverage}
        </span>
      </div>
    </>
  );
};

const ScoreboardCell = ({
  direction,
  data,
}: {
  direction: "left" | "right";
  data: HighlightedOdd | null;
}) => {
  return (
    <>
      <div
        className={`w-full h-8 bg-gray-200 rounded-xs overflow-hidden flex items-center justify-between ${
          direction === "left" ? "" : "flex-row-reverse"
        }`}
      >
        {data === null ? (
          <></>
        ) : (
          <>
            <img src={data.logoURL} alt={data.sportsbook} className="h-full" />
            <div className="w-full flex items-center justify-center gap-1">
              <span className="font-medium">{data.value}</span>
              {data.additionalValue && (
                <span className="text-gray-500">{data.additionalValue}</span>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};
