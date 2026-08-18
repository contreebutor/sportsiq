import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  createContestUserByPredictorID,
  fetchPredictorInfoByID,
  registerPredictions,
  retrievePredictions,
  fetchSportsIQPoints,
  fetchBarPoints,
} from "../services/contestService";
import { FetchPredictorInfoResponse } from "../types/contests";
import Logo from "../components/Logo";
import DualRadial from "../components/Wrapper/DualRadial";
import PreBingoCardHeader from "./contest/PreBingoCardHeader";
import Loading from "../components/Loading";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import JoinTheGame from "../components/SubmitPredictions/JoinTheGame";
import VerifyYourNumber from "../components/SubmitPredictions/VerifyYourNumber";
import { toast } from "react-toastify";
import { MdCheck } from "react-icons/md";
import {
  convertToClientTimezone,
  getStoredContestUserID,
  storeContestUserID,
} from "../lib/utils";
import { createOTP, verifyOTP } from "../services/phoneService";

type PredictionSelection = {
  [categoryId: number]: "under" | "exact" | "over";
};

type ViewState = "predictions" | "join" | "verify" | "success";

export default function SubmitPredictionsPage() {
  const { id: predictorID } = useParams();

  const [predictorInfo, setPredictorInfo] =
    useState<FetchPredictorInfoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState<ViewState>("predictions");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [predictions, setPredictions] = useState<PredictionSelection[]>([]);
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");
  const [contestUserID, setContestUserID] = useState<string | null>(null);
  const [sportsIQPoints, setSportsIQPoints] = useState<number>(0);
  const [barPoints, setBarPoints] = useState<number>(0);

  const swiperRef = useRef<SwiperRef | null>(null);
  const getUniqueQuarters = useCallback(
    (settings: FetchPredictorInfoResponse["settings"]) => {
      const quarters = new Set(settings.map((s) => s.quarter));
      return Array.from(quarters).sort();
    },
    []
  );

  const fetchContestPredictorByID = useCallback(
    async (id: string) => {
      setLoading(true);
      const updatedPredictorInfo = await fetchPredictorInfoByID(id);
      setPredictorInfo(updatedPredictorInfo);
      if (updatedPredictorInfo) {
        // Initialize predictions array for each quarter
        const quarters = getUniqueQuarters(updatedPredictorInfo.settings);
        const initialPredictions: PredictionSelection[] = quarters.map(
          () => ({})
        );
        setPredictions(initialPredictions);
      }
      setLoading(false);
    },
    [getUniqueQuarters]
  );

  useEffect(() => {
    if (!predictorID) {
      return;
    }

    // Check for stored contestUserID
    const storedContestUserID = getStoredContestUserID(predictorID);
    if (storedContestUserID) {
      setContestUserID(storedContestUserID);
    }

    fetchContestPredictorByID(predictorID);
  }, [predictorID, fetchContestPredictorByID]);

  // Fetch and pre-populate predictions if contestUserID exists
  useEffect(() => {
    if (!predictorID || !contestUserID || !predictorInfo) {
      return;
    }

    loadExistingPredictions(
      predictorID,
      contestUserID,
      predictorInfo,
      getUniqueQuarters
    );
  }, [predictorID, contestUserID, predictorInfo, getUniqueQuarters]);

  useEffect(() => {
    if (contestUserID && predictorID) {
      fetchPoints(contestUserID, predictorID as string);

      const interval = setInterval(() => {
        fetchPoints(contestUserID, predictorID as string);
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [contestUserID, predictorID]);

  const loadExistingPredictions = async (
    id: string,
    contestUserID: string,
    predictorInfo: FetchPredictorInfoResponse,
    getUniqueQuarters: (
      settings: FetchPredictorInfoResponse["settings"]
    ) => string[]
  ) => {
    const retrievedPredictions = await retrievePredictions(id, contestUserID);
    if (retrievedPredictions && retrievedPredictions.length > 0) {
      const quarters = getUniqueQuarters(predictorInfo.settings);
      const updatedPredictions: PredictionSelection[] = quarters.map(
        (quarter) => {
          const quarterData = retrievedPredictions.find(
            (p) => p.quarter === quarter
          );
          if (!quarterData) {
            return {};
          }

          // Parse predictions from "628:exact" format to {628: "exact"}
          const parsed: PredictionSelection = {};
          quarterData.predictions.forEach((pred) => {
            const [categoryId, option] = pred.split(":");
            parsed[Number(categoryId)] = option as "under" | "exact" | "over";
          });
          return parsed;
        }
      );

      setPredictions(updatedPredictions);
    }
  };

  const groupSettingsByQuarter = (
    settings: FetchPredictorInfoResponse["settings"]
  ) => {
    const grouped: { [quarter: string]: typeof settings } = {};
    settings.forEach((setting) => {
      if (!grouped[setting.quarter]) {
        grouped[setting.quarter] = [];
      }
      grouped[setting.quarter].push(setting);
    });
    return grouped;
  };

  const handleSelection = (
    quarterIndex: number,
    categoryId: number,
    option: "under" | "exact" | "over"
  ) => {
    setPredictions((prev) => {
      const newPredictions = [...prev];
      newPredictions[quarterIndex] = {
        ...newPredictions[quarterIndex],
        [categoryId]: option,
      };
      return newPredictions;
    });
  };

  const handleSubmit = async () => {
    if (contestUserID) {
      await submitPredictions(contestUserID);
      setViewState("success");
    } else {
      setViewState("join");
    }
  };

  const handleJoinSubmit = async () => {
    const isTenDigitNumber =
      phone.trim().length === 10 &&
      [...phone.trim()].every((char) => char >= "0" && char <= "9");

    if (!isTenDigitNumber) {
      toast.error(
        "Invalid phone number: must be exactly 10 digits (numbers only). Please try again."
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

    setViewState("verify");
  };

  const handleVerify = async (otp: string) => {
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
    if (newContestUserID === null) {
      toast.error("Failed to register user");
      return;
    }

    // Store contestUserID in local storage
    storeContestUserID(predictorID, newContestUserID);
    setContestUserID(newContestUserID);

    await submitPredictions(newContestUserID);
    setViewState("success");
  };

  const registerUser = async () => {
    const contestUserID = await createContestUserByPredictorID(
      predictorID as string,
      `+1${phone}`,
      nickname
    );
    return contestUserID;
  };

  const submitPredictions = async (contestUserID: string) => {
    const quarters = getUniqueQuarters(predictorInfo.settings);
    const predictionsData = quarters.map((quarter, quarterIndex) => {
      const quarterPredictions = predictions[quarterIndex];
      const predictionsArray = Object.entries(quarterPredictions).map(
        ([categoryId, option]) => `${categoryId}:${option}`
      );
      return {
        quarter: quarter,
        predictions: predictionsArray,
      };
    });

    await registerPredictions(predictorID, contestUserID, predictionsData);
  };

  const fetchPoints = async (contestUserID: string, predictorID: string) => {
    const sportsIQPoints = await fetchSportsIQPoints(contestUserID);
    setSportsIQPoints(sportsIQPoints);
    const barPoints = await fetchBarPoints(
      contestUserID,
      predictorID,
      "predictor"
    );
    setBarPoints(barPoints);
  };

  if (loading || !predictorInfo) {
    return (
      <>
        <div
          className="w-full h-full bg-[#110E2A] flex flex-col items-center justify-center"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Loading />
        </div>
      </>
    );
  }

  const awayTeam = predictorInfo.game.away_team;
  const homeTeam = predictorInfo.game.home_team;
  const quarters = getUniqueQuarters(predictorInfo.settings);
  const groupedSettings = groupSettingsByQuarter(predictorInfo.settings);

  const isAllSelected = (): boolean => {
    const quarters = getUniqueQuarters(predictorInfo.settings);
    return quarters.every((quarter, quarterIndex) => {
      const quarterSettings = groupedSettings[quarter] || [];
      const quarterPredictions = predictions[quarterIndex] || {};
      return (
        quarterSettings.length > 0 &&
        quarterSettings.every((setting) => quarterPredictions[setting.id])
      );
    });
  };

  const title = getTimeString(predictorInfo.game.date_time);

  return (
    <div className="w-full h-full bg-[#110E2A] flex flex-col items-center justify-start fixed overflow-y-auto">
      {viewState === "predictions" ? (
        <>
          <PredictorLogo />

          {contestUserID && (
            <div className="w-full h-fit flex flex-col items-center justify-center px-4">
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
          )}

          <DualRadial
            left={awayTeam.primary_color}
            right={homeTeam.primary_color}
            className="w-full h-fit flex flex-col items-center justify-center"
          >
            <PreBingoCardHeader
              title={title}
              away_team_primary_color={awayTeam.primary_color}
              home_team_primary_color={homeTeam.primary_color}
              away_team_logo_url={awayTeam.logo_url}
              home_team_logo_url={homeTeam.logo_url}
              away_team_key={awayTeam.key}
              home_team_key={homeTeam.key}
              away_team_wins={awayTeam.wins}
              home_team_wins={homeTeam.wins}
              away_team_losses={awayTeam.losses}
              home_team_losses={homeTeam.losses}
            />

            <div className="w-full flex flex-col items-center pt-4 px-4 max-h-[75vh] overflow-hidden">
              <Swiper
                ref={swiperRef}
                spaceBetween={50}
                slidesPerView={1}
                onSlideChange={(swiper) => setCurrentSlide(swiper.activeIndex)}
                loop={false}
                initialSlide={0}
                className="w-full flex-1"
                allowTouchMove={true}
              >
                {quarters.map((quarter, quarterIndex) => {
                  const quarterSettings = groupedSettings[quarter] || [];
                  const quarterPredictions = predictions[quarterIndex] || {};

                  return (
                    <SwiperSlide key={quarter}>
                      <QuarterSlide
                        title={predictorInfo.titles[quarter]}
                        settings={quarterSettings}
                        predictions={quarterPredictions}
                        onSelection={(categoryId, option) =>
                          handleSelection(quarterIndex, categoryId, option)
                        }
                      />
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              <div className="w-full py-2">
                <button
                  onClick={handleSubmit}
                  disabled={!isAllSelected()}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg text-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit
                </button>
              </div>

              <div className="w-full flex items-center justify-center gap-2 pb-4">
                {quarters.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentSlide ? "bg-teal-500" : "bg-indigo-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          </DualRadial>
        </>
      ) : viewState === "join" ? (
        <>
          <JoinTheGame
            handleSubmit={handleJoinSubmit}
            nickname={nickname}
            mobile={phone}
            setNickname={setNickname}
            setMobile={setPhone}
          />
        </>
      ) : viewState === "verify" ? (
        <>
          <VerifyYourNumber handleVerify={handleVerify} />
        </>
      ) : viewState === "success" ? (
        <>
          <Success onComplete={() => window.location.reload()} />
        </>
      ) : null}
    </div>
  );
}

interface QuarterSlideProps {
  title: {
    quarter: string;
    prize: string;
  };
  settings: FetchPredictorInfoResponse["settings"];
  predictions: PredictionSelection;
  onSelection: (categoryId: number, option: "under" | "exact" | "over") => void;
}

const QuarterSlide = ({
  title,
  settings,
  predictions,
  onSelection,
}: QuarterSlideProps) => {
  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="w-full px-2 flex flex-col items-center">
        <div className="w-full bg-[#5545D3] rounded-t-lg flex flex-col items-center text-center py-3">
          <span className="text-white/80 text-base font-semibold">
            {title.quarter}
          </span>
          <span className="text-white text-xl font-bold">{title.prize}</span>
        </div>
      </div>

      <div className="w-full bg-white rounded-lg flex flex-col items-center gap-3 overflow-y-auto p-3">
        <div className="w-full flex flex-col items-center gap-2">
          <span className="h-1" />
          <div className="flex flex-col items-center text-3xl font-extrabold leading-none gap-1">
            <span className="text-black">PREDICT</span>
            <span className="text-indigo-500">{settings.length} OUTCOMES</span>
          </div>
          <span className="text-gray-600 text-base text-center leading-tight">
            The more outcomes you get right,
            <br />
            the more IQ Points you earn.
          </span>
        </div>

        <div className="w-full flex flex-col items-center gap-1">
          {settings.map((setting) => {
            const selected = predictions[setting.id];
            return (
              <CategoryCard
                key={setting.id}
                setting={setting}
                selected={selected}
                onSelect={(option) => onSelection(setting.id, option)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface CategoryCardProps {
  setting: FetchPredictorInfoResponse["settings"][0];
  selected?: "under" | "exact" | "over";
  onSelect: (option: "under" | "exact" | "over") => void;
}

const CategoryCard = ({ setting, selected, onSelect }: CategoryCardProps) => {
  let teamKey: string = setting.team_key;
  teamKey = teamKey === "TOTAL" ? "COMBINED" : teamKey;

  return (
    <div className="w-full bg-[#1D1A35] rounded-sm px-3 pt-3 pb-6 flex flex-col gap-2">
      <span className="text-white text-center text-lg font-medium leading-none">
        {`${teamKey} ${setting.category.label}`}
      </span>
      <div className="w-full flex flex-row gap-2">
        <PredictionButton
          leadingLabel="Under"
          value={setting.value}
          points={setting.points.under}
          option="under"
          isSelected={selected === "under"}
          onClick={() => onSelect("under")}
        />
        <PredictionButton
          leadingLabel="Exactly"
          value={setting.value}
          points={setting.points.exact}
          option="exact"
          isSelected={selected === "exact"}
          onClick={() => onSelect("exact")}
          isExact
        />
        <PredictionButton
          leadingLabel="Over"
          value={setting.value}
          points={setting.points.over}
          option="over"
          isSelected={selected === "over"}
          onClick={() => onSelect("over")}
        />
      </div>
    </div>
  );
};

interface PredictionButtonProps {
  leadingLabel: string;
  value: number;
  points: number;
  option: "under" | "exact" | "over";
  isSelected: boolean;
  onClick: () => void;
  isExact?: boolean;
}

const PredictionButton = ({
  leadingLabel,
  value,
  points,
  isSelected,
  onClick,
  isExact = false,
}: PredictionButtonProps) => {
  const formatPoints = (pts: number) => {
    return `+${pts.toLocaleString()}`;
  };

  return (
    <button
      onClick={onClick}
      className={`flex-1 relative rounded-md px-2 pt-3 pb-4 transition-colors duration-200 min-h-[60px] bg-gradient-to-b border-2 border-b-transparent ${
        isSelected
          ? isExact
            ? "from-yellow-500/25 to-yellow-500/10 text-yellow-400 border-yellow-500/50"
            : "from-green-500/25 to-green-500/10 text-green-400 border-green-500/50"
          : "from-white/10 to-transparent text-white/60 border-transparent"
      }`}
    >
      <div className="flex flex-col items-center justify-center h-full leading-none">
        <span className="text-sm">{leadingLabel}</span>
        <span className="text-base font-semibold">{value}</span>
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
    </button>
  );
};

const PredictorLogo = () => {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-center py-4">
        <Logo size="12" />
        <div className="w-fit flex flex-row items-center justify-center gap-1 text-white text-2xl font-bold">
          {["P", "R", "E", "D", "I", "C", "T", "O", "R"].map(
            (letter, index) => (
              <span key={index}>{letter}</span>
            )
          )}
        </div>
      </div>
    </>
  );
};

interface SuccessProps {
  onComplete: () => void;
}

const Success = ({ onComplete }: SuccessProps) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 5000; // 5 seconds
    const interval = 50; // Update every 50ms for smooth animation
    const increment = (100 / duration) * interval;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    const timeout = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
        <span className="w-24 h-24 flex items-center justify-center border-4 border-indigo-600 rounded-full">
          <MdCheck className="text-indigo-600 w-16 h-16" />
        </span>
        <span className="text-white text-2xl font-bold">YOU'RE IN!</span>
        <span className="h-2" />
        <span className="text-white text-lg font-medium text-center px-8">
          Your predictions have been locked in.
        </span>
        <span className="h-2" />
        <span className="text-white text-lg font-medium text-center px-8">
          Good luck! Watch the live leaderboard on screen to see if you win!
        </span>
        <span className="h-6" />
        <div className="w-full max-w-md px-8">
          <div className="w-full h-2 bg-indigo-900/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-75 ease-linear rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
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
