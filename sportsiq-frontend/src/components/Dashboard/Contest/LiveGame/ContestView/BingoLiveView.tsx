import { useEffect, useRef, useState } from "react";
import { contestStore } from "../../../../../store";
import { ContestBingoForLiveGame } from "../../../../../types/contests";
import { fetchContestBingoForLiveGame } from "../../../../../services/contestService";
import Loading from "../../../../Loading";
import Logo from "../../../../Logo";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import QRCode from "../../QRCode";
import { useParams } from "react-router-dom";

interface Props {
  teamLogos: {
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  };
}

export const BingoLiveView = ({ teamLogos }: Props) => {
  const { id: profileID } = useParams<{ id: string }>();
  const { contestForToday } = contestStore();
  const [count, setCount] = useState(0);
  const swiperRef = useRef<SwiperRef | null>(null);

  const abstractContestID = contestForToday.abstract_contest_id;

  const [contestBingo, setContestBingo] =
    useState<ContestBingoForLiveGame | null>(null);

  useEffect(() => {
    fetchBingo(abstractContestID, profileID);

    const interval = setInterval(() => {
      if (abstractContestID && profileID) {
        fetchBingo(abstractContestID, profileID);
        setCount((prev) => (prev + 1) % 10);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [abstractContestID, profileID]);

  useEffect(() => {
    if (!contestBingo) return;
    if (count >= 9) {
      swiperRef.current?.swiper?.slideTo(1);
    } else {
      swiperRef.current?.swiper?.slideTo(0);
    }
  }, [count, contestBingo]);

  const fetchBingo = async (abstractContestID: string, profileID: string) => {
    const newContestBingo = await fetchContestBingoForLiveGame(
      abstractContestID,
      profileID
    );
    setContestBingo(newContestBingo);
  };

  return (
    <>
      <div className="w-full h-full bg-[#0a0718] flex flex-col items-center justify-between px-6 pt-5">
        {contestBingo ? (
          <>
            <div className="w-full h-full flex items-center justify-center gap-5 overflow-hidden">
              <div className="w-full max-w-lg h-full flex flex-col items-center justify-start rounded-lg overflow-hidden">
                <div className="w-full h-fit flex items-center justify-center bg-white px-3 py-4 gap-3">
                  <LiveMarker title={contestBingo.live_title} />
                </div>
                <Swiper
                  ref={swiperRef}
                  spaceBetween={50}
                  slidesPerView={1}
                  onSlideChange={() => {}}
                  onSwiper={() => {}}
                  loop={true}
                  initialSlide={0}
                  className="w-full h-full flex flex-col items-center justify-center bg-white/10 rounded-b-lg"
                  onInit={() => {}}
                  direction="horizontal"
                >
                  <SwiperSlide>
                    <Markets
                      teamLogos={teamLogos}
                      markets={contestBingo.markets}
                    />
                  </SwiperSlide>
                  <SwiperSlide>
                    <Tabs tabs={contestBingo.tabs} />
                  </SwiperSlide>
                </Swiper>
                <span className="h-10" />
                <QRCodeWithDescription
                  value={`${window.location.origin}/submit-bingo-cards/${contestBingo.contest_bingo_id}`}
                />
              </div>

              <Leaderboard leaderboard={contestBingo.leaderboard} />
            </div>
          </>
        ) : (
          <Loading />
        )}

        <Footer />
      </div>
    </>
  );
};

interface TabsProps {
  tabs: ContestBingoForLiveGame["tabs"];
}

const Tabs = ({ tabs }: TabsProps) => {
  return (
    <>
      <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
        {tabs.map((tab) => (
          <div
            key={tab.quarter}
            className={`w-full h-full rounded-md px-3 flex flex-col items-center justify-center gap-1 border-1 bg-gradient-to-b to-white/0 ${
              tab.completed ? "from-[#5545D3]" : "from-white/10 border-white/5"
            }`}
          >
            <span className="text-white text-xl font-semibold leading-none">
              {`Q${tab.quarter} ${
                tab.completed ? `WINNER - ${tab.prize}` : "PRIZE"
              }`}
            </span>
            <span className="text-white text-3xl font-bold leading-tight text-center">
              {tab.completed
                ? tab.winner || "NO WINNER"
                : tab.prize || "WIN POINTS"}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};

const QRCodeWithDescription = ({ value }: { value: string }) => {
  return (
    <>
      <div className="w-full h-fit flex items-center justify-center gap-10">
        <span className="text-white text-2xl w-48 text-center">
          Scan the code to get your Bingo Card
        </span>
        <div className="w-fit h-fit p-3 bg-white rounded">
          <QRCode value={value} size={180} />
        </div>
      </div>
    </>
  );
};

const LiveMarker = ({ title }: { title: string }) => {
  return (
    <>
      <span className="w-fit h-fit flex items-center gap-2 px-3 py-1 rounded-full bg-gray-200">
        <span className="relative flex size-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500"></span>
          <span className="relative inline-flex size-2.5 rounded-full bg-green-500"></span>
        </span>
        <span className="text-lg font-semibold leading-tight">{title}</span>
      </span>
    </>
  );
};

interface LeaderboardProps {
  leaderboard: ContestBingoForLiveGame["leaderboard"];
}

const Leaderboard = ({ leaderboard }: LeaderboardProps) => {
  return (
    <>
      <div className="w-full h-full border border-indigo-500/50 flex flex-col items-center justify-start rounded-md overflow-hidden">
        <div className="w-full h-fit bg-[#5545D3]/80 flex items-center justify-center p-4">
          <BingoLogo />
        </div>
        <div className="w-full h-full flex flex-col items-center justify-start p-4 gap-4">
          <div className="w-full h-fit flex flex-col items-center justify-center">
            <span className="text-white text-lg font-semibold leading-tight">
              {leaderboard.prize_title}
            </span>
            <span className="text-white text-3xl font-bold leading-tight">
              {leaderboard.prize}
            </span>
          </div>
          <>
            {leaderboard.bingo_cards.length > 0 ? (
              <>
                <div className="w-full h-full flex flex-col items-center justify-start gap-3 text-white overflow-hidden">
                  {leaderboard.bingo_cards.map((item, index) => (
                    <div
                      key={`leaderboard-item-${index}`}
                      className="w-full h-fit bg-white/10 border border-indigo-500/50 rounded-md p-2 pr-4 flex items-center justify-between"
                    >
                      <div className="w-fit h-fit flex items-center justify-center gap-3">
                        <div className="w-12 h-12 grid grid-cols-3 grid-rows-3 gap-0.5">
                          {item.squares.map((square, index) => (
                            <div
                              key={`square-${index}`}
                              className={`w-full h-full rounded-xs ${
                                square ? "bg-indigo-500" : "bg-white/20"
                              }`}
                            ></div>
                          ))}
                        </div>
                        <span className="text-xl font-semibold leading-tight">
                          {item.username}
                        </span>
                      </div>

                      <span className="text-xl font-semibold leading-tight">
                        {item.points} points
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-white text-2xl font-semibold leading-tight text-center">
                  No leaderboard yet.
                  <br />
                  Be the first to win!
                </span>
              </div>
            )}
          </>
        </div>
      </div>
    </>
  );
};

interface MarketsProps {
  teamLogos: {
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  };
  markets: ContestBingoForLiveGame["markets"];
}

const Markets = ({ teamLogos, markets }: MarketsProps) => {
  // Utility to get home and away team keys
  const getHomeAwayKeys = () => {
    const teamKeys = Object.keys(teamLogos).filter((k) => k !== "TOTAL");
    let homeKey: string | undefined, awayKey: string | undefined;
    for (const key of teamKeys) {
      if (teamLogos[key]?.type === "home") homeKey = key;
      else if (teamLogos[key]?.type === "away") awayKey = key;
    }
    // fallback: use first two keys if not found
    if (!homeKey) homeKey = teamKeys[0];
    if (!awayKey) awayKey = teamKeys[1] || teamKeys[0];
    return { homeKey, awayKey };
  };

  const sortedMarkets = [...markets].sort((a, b) => {
    const aRatio = a.total > 0 ? a.done / a.total : 0;
    const bRatio = b.total > 0 ? b.done / b.total : 0;
    return bRatio - aRatio;
  });

  return (
    <>
      <div className="w-full h-full p-4 grid grid-cols-3 gap-y-2 gap-x-3.5 text-white">
        {sortedMarkets.map((market, index) => (
          <div
            key={`markets-item-${index}`}
            className={`relative w-full h-full flex flex-col items-center justify-center pb-4`}
          >
            <div
              className={`relative w-full h-full flex flex-col items-center justify-between rounded-md p-1 ${
                market.completed
                  ? "bg-[#228C88]"
                  : "bg-gradient-to-b from-white/10 to-white/5"
              }`}
            >
              {!market.completed && market.done > 0 && market.total > 0 && (
                <div
                  className="absolute left-0 bottom-0 w-full rounded-lg z-0 transition-all"
                  style={{
                    height: `${(market.done / market.total) * 100}%`,
                    backgroundColor: "rgba(99, 102, 241, 0.75)", // similar to bg-indigo-500/75
                  }}
                />
              )}

              <div
                className={`w-full flex items-center justify-between ${
                  market.team_key !== "TOTAL"
                    ? teamLogos[market.team_key].type === "home"
                      ? "flex-row-reverse"
                      : "flex-row"
                    : ""
                }`}
              >
                {market.team_key === "TOTAL" ? (
                  (() => {
                    const { homeKey, awayKey } = getHomeAwayKeys();
                    return (
                      <>
                        <img
                          src={teamLogos[awayKey]?.logo_url}
                          alt={awayKey}
                          className="w-6 h-6"
                        />
                        <span className=" text-sm font-bold text-white/80 z-10">
                          {market.done}/{market.total}
                        </span>
                        <img
                          src={teamLogos[homeKey]?.logo_url}
                          alt={homeKey}
                          className="w-6 h-6"
                        />
                      </>
                    );
                  })()
                ) : (
                  <>
                    <img
                      src={teamLogos[market.team_key].logo_url}
                      alt={market.team_key}
                      className="w-6 h-6"
                    />

                    <span className=" text-sm font-bold text-white/80 z-10">
                      {market.done}/{market.total}
                    </span>

                    <span className="w-6 h-6" />
                  </>
                )}
              </div>
              <div className="w-full h-fit flex flex-col items-center justify-center text-white/70">
                <span className="text-sm font-bold text-center z-10">
                  {market.team_key}
                </span>
                <span className="text-sm text-center z-10">
                  {market.description}
                </span>
              </div>

              <span className="w-6 h-6" />
            </div>

            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-1 text-sm font-bold text-white/80 z-10 border-2 border-[#0a0718]">
              +{market.points}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};

const Footer = () => {
  return (
    <>
      <div className="w-full h-fit py-4 flex items-center justify-between text-white/70">
        <div className="w-fit h-fit flex items-center justify-center gap-2">
          <span>Powered by</span>
          <Logo />
        </div>

        <span>Terms & Conditions apply</span>
      </div>
    </>
  );
};

const BingoLogo = () => {
  return (
    <>
      <div className="w-full h-fit flex items-center justify-center gap-4">
        <Logo size="h-8" isLight={true} />
        <span className="h-8.5 flex items-center justify-center text-white text-2xl font-bold leading-tight gap-0.5">
          <span className="self-start">B</span>
          <span className="self-end">I</span>
          <span className="self-start">N</span>
          <span className="self-end">G</span>
          <span className="self-start">O</span>
        </span>
      </div>
    </>
  );
};
