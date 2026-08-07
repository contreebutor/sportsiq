import { contestStore } from "../../../../../store/contestStore";
import { useParams } from "react-router-dom";
import { ContestPredictorForLiveGame } from "../../../../../types/contests";
import { useEffect, useRef, useState } from "react";
import { fetchContestPredictorForLiveGame } from "../../../../../services/contestService";
import Logo from "../../../../Logo";
import QRCode from "../../QRCode";
import Loading from "../../../../Loading";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";

import { BiSolidStar } from "react-icons/bi";

export const PredictorLiveView = () => {
  const { id: profileID } = useParams<{ id: string }>();
  const { contestForToday } = contestStore();
  const abstractContestID = contestForToday.abstract_contest_id;

  const [predictor, setPredictor] =
    useState<ContestPredictorForLiveGame | null>(null);
  const [count, setCount] = useState(0);

  const swiperRef = useRef<SwiperRef | null>(null);

  useEffect(() => {
    if (!abstractContestID || !profileID) {
      return;
    }

    fetchContestPredictor(abstractContestID, profileID);

    const interval = setInterval(() => {
      fetchContestPredictor(abstractContestID, profileID);
      setCount((prev) => (prev + 1) % 10);
    }, 5000);

    return () => clearInterval(interval);
  }, [abstractContestID, profileID]);

  useEffect(() => {
    if (!predictor) return;
    if (count >= 9) {
      swiperRef.current?.swiper?.slideTo(1);
    } else {
      swiperRef.current?.swiper?.slideTo(0);
    }
  }, [count, predictor]);

  const fetchContestPredictor = async (
    abstractContestID: string,
    profileID: string
  ) => {
    const data = await fetchContestPredictorForLiveGame(
      abstractContestID,
      profileID
    );
    setPredictor(data);
  };

  if (!predictor) {
    return <Loading />;
  }

  return (
    <>
      <div className="w-full h-full bg-[#0a0718] flex flex-col items-center justify-center px-6 pt-5">
        <div className="w-full h-full flex items-center justify-center gap-5">
          <div className="w-full h-full max-w-lg flex flex-col items-center justify-center">
            <div className="w-full h-full flex flex-col items-center justify-center rounded-lg overflow-hidden">
              <Header
                quarter_title={predictor.quarter_title}
                outcomesCount={predictor.statuses.length}
              />
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
                  <Statuses statuses={predictor.statuses} />
                </SwiperSlide>
                <SwiperSlide>
                  <Prizes prizes={predictor.prizes} />
                </SwiperSlide>
              </Swiper>
            </div>
            <span className="h-5" />
            <QRCodeWithDescription
              value={`${window.location.origin}/submit-predictions/${predictor.contest_predictor_id}`}
            />
          </div>

          <Leaderboard leaderboard={predictor.leaderboard} />
        </div>

        <Footer />
      </div>
    </>
  );
};

const Header = ({
  quarter_title,
  outcomesCount,
}: {
  quarter_title: string;
  outcomesCount: number;
}) => {
  return (
    <>
      <div className="w-full h-fit p-3 flex flex-col items-center justify-center bg-white">
        <LiveMarker title={quarter_title} />
        <span className="h-4" />
        <div className="w-full h-full flex items-center justify-center gap-4 text-4xl font-extrabold">
          <span>PREDICT</span>
          <span className="text-indigo-500">{outcomesCount} OUTCOMES</span>
        </div>
        <span className="h-1" />
        <span className="w-full h-fit text-center text-lg leading-tight text-black/80">
          The more outcomes you get right,
          <br />
          the more IQ Points you earn.
        </span>
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

const Statuses = ({
  statuses,
}: {
  statuses: ContestPredictorForLiveGame["statuses"];
}) => {
  const teamKey = (teamKey: string) => {
    if (teamKey === "TOTAL") {
      return "COMBINED";
    } else {
      return teamKey;
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-between p-5 gap-5 pb-7">
        {statuses.map((status, index) => (
          <div
            key={index}
            className="w-full h-fit flex flex-col items-center justify-center gap-2"
          >
            <div className="w-full h-fit flex items-center justify-between">
              <span className="text-white text-lg font-medium">
                {teamKey(status.team_key) + " " + status.category.label}
              </span>
              <span className="w-fit flex items-center justify-center gap-2">
                <span className="text-white/70 text-lg font-medium">Live:</span>
                <span className="text-white text-lg font-medium">
                  {status.progress}
                </span>
              </span>
            </div>
            <div className="w-full h-fit flex items-center justify-center gap-2">
              <PredictionCard
                leadingLabel="Under"
                value={status.value}
                points={status.points.under}
                option="under"
                isSelected={status.progress < status.value}
                isExact={false}
              />
              <PredictionCard
                leadingLabel="Exact"
                value={status.value}
                points={status.points.exact}
                option="exact"
                isSelected={status.progress === status.value}
                isExact={true}
              />
              <PredictionCard
                leadingLabel="Over"
                value={status.value}
                points={status.points.over}
                option="over"
                isSelected={status.progress > status.value}
                isExact={false}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

interface PredictionCardProps {
  leadingLabel: string;
  value: number;
  points: number;
  option: "under" | "exact" | "over";
  isSelected: boolean;
  isExact: boolean;
}

function PredictionCard({
  leadingLabel,
  value,
  points,
  isSelected,
  isExact = false,
}: PredictionCardProps) {
  const formatPoints = (pts: number) => {
    return `+${pts.toLocaleString()}`;
  };

  return (
    <div
      className={`flex-1 relative rounded-md px-2 pt-3 pb-4 transition-colors duration-200 min-h-[60px] bg-gradient-to-b border-2 border-b-transparent ${
        isSelected
          ? isExact
            ? "from-yellow-500/25 to-yellow-500/10 text-yellow-400 border-yellow-500/50"
            : "from-green-500/25 to-green-500/10 text-green-400 border-green-500/50"
          : "from-white/10 to-transparent text-white/60 border-transparent"
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 h-full leading-none">
        <span className="text-lg">{leadingLabel}</span>
        <span className="text-xl font-semibold">{value}</span>
      </div>
      <span
        className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-sm leading-none px-2.5 py-1 rounded-full border-2 border-[#1D1A35] transition-colors duration-200 ${
          isSelected
            ? isExact
              ? "bg-[#775929]"
              : "bg-[#1F5F47]"
            : "bg-[#423F55]"
        }`}
      >
        {formatPoints(points)}
      </span>
    </div>
  );
}

const Prizes = ({
  prizes,
}: {
  prizes: ContestPredictorForLiveGame["prizes"];
}) => {
  return (
    <>
      <div className="w-full h-full p-4 flex flex-col items-center justify-center gap-3">
        {prizes.map((prize) => (
          <div
            key={prize.quarter_title}
            className={`w-full h-full rounded-md px-3 flex flex-col items-center justify-center gap-1 border-1 bg-gradient-to-b to-white/0 ${
              prize.completed
                ? "from-[#5545D3]"
                : "from-white/10 border-white/5"
            }`}
          >
            <span className="text-white text-xl font-semibold leading-none">
              {`${prize.quarter_title} ${
                prize.completed ? `WINNER - ${prize.prize}` : "PRIZE"
              }`}
            </span>
            <span className="text-white text-3xl font-bold leading-tight text-center">
              {prize.completed
                ? prize.winner || "NO WINNER"
                : prize.prize || "WIN POINTS"}
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
      <div className="w-full h-fit flex items-center justify-center gap-10 px-6">
        <span className="text-2xl text-center w-md font-medium text-white">
          Scan the code to submit your predictions
        </span>

        <div className="w-fit h-fit p-3 bg-white rounded">
          <QRCode value={value} size={180} />
        </div>
      </div>
    </>
  );
};

const Leaderboard = ({
  leaderboard,
}: {
  leaderboard: ContestPredictorForLiveGame["leaderboard"];
}) => {
  return (
    <>
      <div className="w-full h-full rounded-lg flex flex-col items-center justify-center overflow-hidden">
        <PredictorLogo />
        <div className="w-full h-full bg-[#5545D3] pt-4 px-3 pb-3 flex flex-col items-center justify-center">
          <div className="w-full h-fit flex flex-col items-center justify-center">
            <span className="text-white text-lg font-semibold leading-tight">
              {leaderboard.title.quarter}
            </span>
            <span className="text-white text-3xl font-bold leading-tight">
              {leaderboard.title.prize}
            </span>
          </div>
          <span className="h-4" />
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            {leaderboard.predictions.length > 0 ? (
              <>
                <div className="w-full h-full flex flex-col items-center justify-start gap-2">
                  {leaderboard.predictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="w-full h-12 bg-white/10 border border-white/20 rounded-sm px-4 flex items-center justify-between"
                    >
                      <span className="text-white text-lg font-bold">
                        {prediction.username}
                      </span>

                      <div className="w-fit flex items-center justify-center">
                        <div className="w-fit h-fit flex items-center justify-center gap-1">
                          {prediction.dots.map((dot, index) =>
                            dot.star ? (
                              <BiSolidStar
                                key={index}
                                className={`size-6  ${
                                  dot.filled
                                    ? "fill-[#FFB200]"
                                    : "fill-white/20"
                                }`}
                              />
                            ) : (
                              <div
                                key={index}
                                className="size-6 flex items-center justify-center"
                              >
                                <div
                                  className={`size-4.5 rounded-full ${
                                    dot.filled ? "bg-green-400" : "bg-white/20"
                                  }`}
                                ></div>
                              </div>
                            )
                          )}
                        </div>
                        <span className="min-w-24 text-right text-white text-lg font-bold">
                          {prediction.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <span className="text-white text-2xl font-bold text-center">
                No leaderboard yet.
                <br />
                Be the first to win!
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

const PredictorLogo = () => {
  return (
    <>
      <div className="w-full h-fit bg-[#5545D3]/80 flex items-center justify-center py-4 gap-4">
        <div className="w-fit h-fit flex items-center justify-center gap-4">
          <Logo size="h-8" isLight={true} />
        </div>
        <span className="h-fit flex items-center justify-center text-white text-2xl font-bold leading-tight gap-0.5">
          {["P", "R", "E", "D", "I", "C", "T", "O", "R"].map(
            (letter, index) => (
              <span key={index}>{letter}</span>
            )
          )}
        </span>
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
