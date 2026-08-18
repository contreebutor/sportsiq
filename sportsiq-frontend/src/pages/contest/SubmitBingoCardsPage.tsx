import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  BingoCardSquareProps,
  GetContestBingoCardsResponse,
  GetGameInfoByContestBingoIDResponse,
} from "../../types/contests";
import {
  createContestUserByBingoID,
  getAnotherCard,
  getContestBingoCards,
  getGameInfoByContestBingoID,
  fetchSportsIQPoints,
  fetchBarPoints,
} from "../../services/contestService";
import DualRadial from "../../components/Wrapper/DualRadial";
import { CustomButton } from "../../components/StyledDefault";
import Logo from "../../components/Logo";
import Loading from "../../components/Loading";
import JoinTheGame from "../../components/SubmitPredictions/JoinTheGame";
import VerifyYourNumber from "../../components/SubmitPredictions/VerifyYourNumber";
import { toast } from "react-toastify";
import {
  convertToClientTimezone,
  getStoredContestUserID,
  storeContestUserID,
} from "../../lib/utils";
import { Swiper, SwiperSlide } from "swiper/react";
import PreBingoCardHeader from "./PreBingoCardHeader";
import { Pagination } from "swiper/modules";
import { createOTP, verifyOTP } from "../../services/phoneService";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import { GameStatus } from "../../types/general";

const STEPS = {
  HOME: "HOME",
  ENTER_PHONE: "ENTER_PHONE",
  VERIFY_PHONE: "VERIFY_PHONE",
  SHOW_BINGO_CARD: "SHOW_BINGO_CARD",
};

export default function SubmitBingoCardsPage() {
  const { id: contestBingoID } = useParams();
  const [gameInfo, setGameInfo] =
    useState<GetGameInfoByContestBingoIDResponse | null>(null);
  const [step, setStep] = useState<string>(STEPS.HOME);
  const [nickname, setNickname] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [bingoCards, setBingoCards] = useState<
    GetContestBingoCardsResponse[] | null
  >(null);
  const [contestUserID, setContestUserID] = useState<string | null>(null);
  const [teamLogos, setTeamLogos] = useState<{
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  }>({});
  const [gameStatus, setGameStatus] = useState<GameStatus | null>(null);
  const [sportsIQPoints, setSportsIQPoints] = useState<number>(0);
  const [barPoints, setBarPoints] = useState<number>(0);

  useEffect(() => {
    if (contestBingoID && step === STEPS.HOME) {
      fetchGameInfo(contestBingoID);
    }
  }, [contestBingoID, step]);

  useEffect(() => {
    // Check for stored contestUserID after gameInfo is loaded
    if (contestBingoID && step === STEPS.HOME && gameInfo) {
      const storedContestUserID = getStoredContestUserID(contestBingoID);
      if (storedContestUserID) {
        setContestUserID(storedContestUserID);
        fetchBingoCards(contestBingoID, storedContestUserID);
        setStep(STEPS.SHOW_BINGO_CARD);
      }
    }
  }, [contestBingoID, step, gameInfo]);

  // Poll fetchBingoCards only when game is InProgress
  useEffect(() => {
    if (
      step === STEPS.SHOW_BINGO_CARD &&
      contestBingoID &&
      contestUserID &&
      gameStatus === "InProgress"
    ) {
      fetchBingoCards(contestBingoID, contestUserID);

      const interval = setInterval(() => {
        fetchBingoCards(contestBingoID, contestUserID);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [contestBingoID, step, contestUserID, gameStatus]);

  // Poll fetchGameInfo based on game status
  useEffect(() => {
    if (step === STEPS.SHOW_BINGO_CARD && contestBingoID) {
      if (gameStatus === "Scheduled") {
        // Poll fetchGameInfo every minute when Scheduled
        const interval = setInterval(() => {
          fetchGameInfo(contestBingoID);
        }, 60000); // 60 seconds = 1 minute

        return () => clearInterval(interval);
      } else if (gameStatus === "InProgress") {
        // Poll fetchGameInfo every 5 seconds when InProgress
        const interval = setInterval(() => {
          fetchGameInfo(contestBingoID);
        }, 5000);

        return () => clearInterval(interval);
      }
    }
  }, [contestBingoID, step, gameStatus]);

  useEffect(() => {
    if (step === STEPS.SHOW_BINGO_CARD && contestBingoID && contestUserID) {
      fetchPoints(contestUserID, contestBingoID);

      const interval = setInterval(() => {
        fetchPoints(contestUserID, contestBingoID);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [step, contestBingoID, contestUserID]);

  const fetchGameInfo = async (contestBingoID: string) => {
    const gameInfo = await getGameInfoByContestBingoID(contestBingoID);
    setGameInfo(gameInfo);

    if (gameInfo) {
      setGameStatus(gameInfo.status);
      setTeamLogos({
        [gameInfo.home_team_key]: {
          logo_url: gameInfo.home_team_logo_url,
          type: "home",
        },
        [gameInfo.away_team_key]: {
          logo_url: gameInfo.away_team_logo_url,
          type: "away",
        },
      });
    }
  };

  const handleSubmitUserInfo = async () => {
    const isTenDigitNumber =
      phone.trim().length === 10 &&
      [...phone.trim()].every((char) => char >= "0" && char <= "9");

    if (!isTenDigitNumber) {
      toast.error(
        "Invalid mobile number: must be exactly 10 digits (numbers only). Please try again."
      );
      return;
    }

    if (nickname.length < 3) {
      toast.error("Name must be at least 3 characters long. Please try again.");
      return;
    }

    const success = await createOTP(`+1${phone}`);
    if (!success) {
      toast.error("Failed to send OTP");
      return;
    }

    setStep(STEPS.VERIFY_PHONE);
  };

  const handleVerifyOTP = async (otp: string) => {
    if (otp.length !== 5) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    const success = await verifyOTP(`+1${phone}`, otp);
    if (!success) {
      toast.error("Failed to verify OTP");
      return;
    }

    const newContestUserID = await registerUser();
    setContestUserID(newContestUserID);
    // Store contestUserID in local storage
    if (newContestUserID) {
      storeContestUserID(contestBingoID, newContestUserID);
    }
    fetchBingoCards(contestBingoID, newContestUserID);
    setStep(STEPS.SHOW_BINGO_CARD);
  };

  const registerUser = async () => {
    const contestUserID = await createContestUserByBingoID(
      contestBingoID as string,
      `+1${phone}`,
      nickname
    );
    return contestUserID;
  };

  const fetchBingoCards = async (
    contestBingoID: string,
    contestUserID: string
  ) => {
    const newBingoCards = await getContestBingoCards(
      contestBingoID,
      contestUserID
    );
    setBingoCards(newBingoCards);
  };

  const handleGetAnotherCard = async (bingoCardID: string) => {
    const anotherCard = await getAnotherCard(bingoCardID);
    if (anotherCard) {
      setBingoCards((prev) =>
        prev.map((card) => (card.id === bingoCardID ? anotherCard : card))
      );
      toast.success("New card has been received.");
    } else {
      toast.error("Failed to receive new card. Please try again.");
    }
  };

  const handleRevealBingoCard = () => {
    // Check if we have a valid stored contestUserID
    const storedContestUserID =
      contestUserID || getStoredContestUserID(contestBingoID);
    if (storedContestUserID) {
      setContestUserID(storedContestUserID);
      setStep(STEPS.SHOW_BINGO_CARD);
    } else {
      setStep(STEPS.ENTER_PHONE);
    }
  };

  const fetchPoints = async (contestUserID: string, contestBingoID: string) => {
    const sportsIQPoints = await fetchSportsIQPoints(contestUserID);
    setSportsIQPoints(sportsIQPoints);
    const barPoints = await fetchBarPoints(
      contestUserID,
      contestBingoID,
      "bingo"
    );
    setBarPoints(barPoints);
  };

  return (
    <>
      <div
        className="w-full h-full bg-[#0a0718] flex items-center justify-start"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {step === STEPS.HOME ? (
          gameInfo ? (
            <HomeStep gameInfo={gameInfo} onReveal={handleRevealBingoCard} />
          ) : (
            <Loading />
          )
        ) : step === STEPS.ENTER_PHONE ? (
          <JoinTheGame
            handleSubmit={handleSubmitUserInfo}
            nickname={nickname}
            mobile={phone}
            setNickname={setNickname}
            setMobile={setPhone}
          />
        ) : step === STEPS.VERIFY_PHONE ? (
          <VerifyYourNumber handleVerify={handleVerifyOTP} />
        ) : step === STEPS.SHOW_BINGO_CARD ? (
          bingoCards ? (
            <BingoCardStep
              gameInfo={gameInfo}
              bingoCards={bingoCards}
              handleGetAnotherCard={handleGetAnotherCard}
              teamLogos={teamLogos}
              sportsIQPoints={sportsIQPoints}
              barPoints={barPoints}
            />
          ) : (
            <Loading />
          )
        ) : (
          <></>
        )}
      </div>
    </>
  );
}

interface HomeStepProps {
  gameInfo: GetGameInfoByContestBingoIDResponse;
  onReveal: () => void;
}

const HomeStep = ({ gameInfo, onReveal }: HomeStepProps) => {
  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-start overflow-y-auto">
        <div className="w-full h-fit p-4 flex flex-col items-center justify-center gap-4">
          <BingoLogo />
        </div>
        <BingoCard
          gameInfo={gameInfo}
          headerTitle={getTimeString(gameInfo.date_time)}
          title="CLAIM YOUR FREE BINGO CARD"
          squares={null}
        />
        <div className="w-full h-fit p-4">
          <CustomButton onClick={onReveal} className="w-full">
            Reveal My Bingo Card
          </CustomButton>
        </div>
        <div className="w-full h-fit flex flex-col items-center justify-center gap-5">
          <div className="w-fit h-fit flex items-center justify-center gap-2">
            <span className="text-white/80 font-light">Powered by</span>
            <Logo size="h-6" />
          </div>
          {/* <span className="text-white/80 font-light text-xs">
            Terms & Conditions apply
          </span> */}
        </div>
      </div>
    </>
  );
};

interface BingoCardProps {
  gameInfo: GetGameInfoByContestBingoIDResponse;
  headerTitle: string;
  title: string;
  squares: {
    1: BingoCardSquareProps;
    2: BingoCardSquareProps;
    3: BingoCardSquareProps;
    4: BingoCardSquareProps;
    5: BingoCardSquareProps;
    6: BingoCardSquareProps;
    7: BingoCardSquareProps;
    8: BingoCardSquareProps;
    9: BingoCardSquareProps;
  } | null;
  teamLogos?: {
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  };
}

const BingoCard = ({
  gameInfo,
  headerTitle,
  title,
  squares,
  teamLogos = {
    home: {
      logo_url: "",
      type: "home",
    },
    away: {
      logo_url: "",
      type: "away",
    },
  },
}: BingoCardProps) => {
  // Utility to find home and away keys in teamLogos, fallback to "home"/"away"
  const getHomeAwayKeys = () => {
    let homeKey = "home";
    let awayKey = "away";
    const keys = Object.keys(teamLogos);
    for (const k of keys) {
      if (teamLogos[k]?.type === "home") homeKey = k;
      if (teamLogos[k]?.type === "away") awayKey = k;
    }
    return { homeKey, awayKey };
  };

  const { homeKey, awayKey } = getHomeAwayKeys();

  return (
    <>
      <DualRadial
        left={gameInfo.away_team_primary_color}
        right={gameInfo.home_team_primary_color}
        className="w-full h-fit flex flex-col items-center justify-center gap-3 bg-white text-white shadow-md p-3"
      >
        <PreBingoCardHeader
          title={headerTitle}
          away_team_primary_color={gameInfo.away_team_primary_color}
          home_team_primary_color={gameInfo.home_team_primary_color}
          away_team_logo_url={gameInfo.away_team_logo_url}
          home_team_logo_url={gameInfo.home_team_logo_url}
          away_team_key={gameInfo.away_team_key}
          home_team_key={gameInfo.home_team_key}
          away_team_wins={gameInfo.away_team_wins}
          home_team_wins={gameInfo.home_team_wins}
          away_team_losses={gameInfo.away_team_losses}
          home_team_losses={gameInfo.home_team_losses}
        />

        <span className="text-2xl font-medium text-center">{title}</span>

        <div className="w-full aspect-[11/10] grid grid-cols-3 gap-2">
          {squares
            ? Object.values(squares).map((square, index) => (
                <div
                  key={index}
                  className={`relative w-full h-full flex flex-col items-center justify-center rounded-md p-2 ${
                    square.completed ? "bg-green-500/75" : "bg-white/10"
                  }`}
                >
                  {!square.completed && square.done > 0 && square.total > 0 && (
                    <div
                      className="absolute left-0 bottom-0 w-full rounded-md z-0 transition-all"
                      style={{
                        height: `${(square.done / square.total) * 100}%`,
                        backgroundColor: "rgba(99, 102, 241, 0.75)", // similar to bg-indigo-500/75
                      }}
                    />
                  )}

                  <div className="absolute top-0 left-0 w-full flex items-center justify-between z-10">
                    {square.team_key === "TOTAL" ? (
                      <>
                        <span className="mt-0.5 ml-0.5 text-sm font-bold text-white/70">
                          <img
                            src={teamLogos[awayKey]?.logo_url}
                            alt={awayKey}
                            className="w-6 h-6"
                          />
                        </span>
                        <span className="absolute left-1/2 -translate-x-1/2 top-0.5 text-sm font-bold text-white/80">
                          {square.done}/{square.total}
                        </span>
                        <span className="mt-0.5 mr-0.5 text-sm font-bold text-white/70">
                          <img
                            src={teamLogos[homeKey]?.logo_url}
                            alt={homeKey}
                            className="w-6 h-6"
                          />
                        </span>
                      </>
                    ) : (
                      <>
                        <span
                          className={`mt-0.5 ${
                            teamLogos[square.team_key]?.type === "home"
                              ? "ml-auto mr-0.5"
                              : "ml-0.5 mr-auto"
                          } text-sm font-bold text-white/70`}
                        >
                          <img
                            src={teamLogos[square.team_key]?.logo_url}
                            alt={square.team_key}
                            className="w-6 h-6"
                          />
                        </span>
                        <span className="absolute left-1/2 -translate-x-1/2 top-0.5 text-sm font-bold text-white/80">
                          {square.done}/{square.total}
                        </span>
                      </>
                    )}
                  </div>

                  <div className="z-10 w-full h-fit flex flex-col items-center justify-center gap-0.5">
                    <span className="text-sm font-bold text-white/70">
                      {square.team_key}
                    </span>
                    <span className="text-sm text-white/70 text-center leading-tight">
                      {square.description}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2">
                    <span className="w-fit h-fit bg-white/10 rounded-t-md border-t border-x border-white/10 px-4 text-sm text-white/70 font-semibold">
                      +{square.points}
                    </span>
                  </div>
                </div>
              ))
            : Array.from({ length: 9 }).map((_, index) => (
                <div
                  key={index}
                  className="w-full h-full bg-white/10 rounded-md flex flex-col items-center justify-center"
                >
                  <span className="text-2xl text-white/70 text-center z-10">
                    {index + 1}
                  </span>
                </div>
              ))}
        </div>
      </DualRadial>
    </>
  );
};

const BingoLogo = () => {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-center">
        <Logo size="h-6" isLight={true} />
        <div className="w-fit h-10 flex gap-1 text-white font-bold text-3xl">
          <span className="self-start">B</span>
          <span className="self-end">I</span>
          <span className="self-start">N</span>
          <span className="self-end">G</span>
          <span className="self-start">O</span>
        </div>
      </div>
    </>
  );
};

interface BingoCardStepProps {
  gameInfo: GetGameInfoByContestBingoIDResponse;
  bingoCards: GetContestBingoCardsResponse[];
  handleGetAnotherCard: (id: string) => void;
  teamLogos: {
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  };
  sportsIQPoints: number;
  barPoints: number;
}

const BingoCardStep = ({
  gameInfo,
  bingoCards,
  handleGetAnotherCard,
  teamLogos,
  sportsIQPoints,
  barPoints,
}: BingoCardStepProps) => {
  const getQuarterText = (quarter: string) => {
    if (gameInfo.game_type === "cbb") {
      if (quarter === "1") return "1ST HALF";
      if (quarter === "2") return "2ND HALF";
    } else if (gameInfo.game_type === "nhl") {
      const periodNum = parseInt(quarter);
      if (!isNaN(periodNum)) {
        const suffix = periodNum === 1 ? "ST" : periodNum === 2 ? "ND" : "RD";
        return `${periodNum}${suffix} PERIOD`;
      }
    } else if (gameInfo.game_type === "mlb") {
      const inningNum = parseInt(quarter);
      if (!isNaN(inningNum)) {
        const suffix =
          inningNum === 1 ? "ST" : inningNum === 2 ? "ND" : inningNum === 3 ? "RD" : "TH";
        return `${inningNum}${suffix} INNING`;
      }
    } else {
      if (quarter === "1") return "1ST QUARTER";
      if (quarter === "2") return "2ND QUARTER";
      if (quarter === "3") return "3RD QUARTER";
      if (quarter === "4") return "4TH QUARTER";
    }

    return "FULL GAME";
  };

  const getHeaderTitle = (quarter: string) => {
    if (gameInfo.status === "InProgress" && gameInfo.quarter === quarter) {
      const remainingMinutes = gameInfo.time_remaining_minutes || 0;
      const remainingSeconds = gameInfo.time_remaining_seconds || 0;
      return `${remainingMinutes}:${remainingSeconds
        .toString()
        .padStart(2, "0")}`;
    } else {
      return getTimeString(gameInfo.date_time);
    }
  };

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center overflow-y-auto">
        <div className="w-full h-fit p-4 flex flex-col items-center justify-center gap-4">
          <BingoLogo />
        </div>

        <div className="w-full h-fit flex flex-col items-center justify-center">
          <div className="w-full h-fit bg-indigo-500/50 rounded-t-md py-2 flex items-center justify-center gap-4 text-white font-medium">
            <span>Points</span>
            <span>-</span>
            <div className="w-fit h-fit flex items-center justify-center">
              <Logo size="h-5" isLight={true} />

              <span className="w-2" />
              <span>{sportsIQPoints}</span>
            </div>
            <span>|</span>
            <div className="w-fit h-fit flex items-center justify-center">
              <span>Bar</span>
              <span className="w-2" />
              <span>{barPoints}</span>
            </div>
          </div>
        </div>

        <div className="w-full h-fit">
          <Swiper
            spaceBetween={50}
            slidesPerView={1}
            onSlideChange={() => {}}
            onSwiper={() => {}}
            loop={false}
            initialSlide={0}
            className="w-full h-full flex flex-col items-center justify-center"
            onInit={() => {}}
            direction="horizontal"
            modules={[Pagination]}
            // navigation={true}
            pagination={{
              clickable: true,
              type: "bullets",
            }}
          >
            {bingoCards.map((bingoCard, index) => (
              <SwiperSlide key={index}>
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 pb-10">
                  <BingoCard
                    gameInfo={gameInfo}
                    headerTitle={getHeaderTitle(bingoCard.quarter)}
                    title={getQuarterText(bingoCard.quarter)}
                    squares={bingoCard.squares}
                    teamLogos={teamLogos}
                  />
                  <div className="w-full h-fit">
                    <CustomButton
                      disabled={!bingoCard.retryable}
                      onClick={() => handleGetAnotherCard(bingoCard.id)}
                      className={
                        "w-full " +
                        (bingoCard.retryable
                          ? ""
                          : "opacity-0 transition-opacity duration-300")
                      }
                    >
                      Get another card
                    </CustomButton>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        {/* <div className="w-full h-fit flex flex-col items-center justify-center gap-5">
          <div className="w-fit h-fit flex items-center justify-center gap-2">
            <span className="text-white/80 font-light">Powered by</span>
            <Logo size="h-6" />
          </div>
        </div> */}
      </div>
    </>
  );
};

const getTimeString = (date_time: string) => {
  const clientTimeString = convertToClientTimezone(date_time);
  const curDate = new Date(clientTimeString);
  return curDate.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};
