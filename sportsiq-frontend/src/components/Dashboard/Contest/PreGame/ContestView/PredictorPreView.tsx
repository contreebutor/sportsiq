import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { contestStore } from "../../../../../store";
import Logo from "../../../../Logo";
import Loading from "../../../../Loading";
import { QRCodeWithDescription } from "./QRCodeWithDescription";
import { fetchContestPredictorForPreGame } from "../../../../../services/contestService";
import { ContestPredictorForPreGame } from "../../../../../types/contests";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";

export const PredictorPreView = () => {
  const { contestForToday } = contestStore();
  const { id: profileID } = useParams<{ id: string }>();
  const [predictor, setPredictor] = useState<ContestPredictorForPreGame | null>(
    null
  );
  const swiperRef = useRef<SwiperRef | null>(null);

  const abstractContestID = contestForToday.abstract_contest_id;
  const dateTime = contestForToday.date_time;

  // Group settings by quarter
  const settingsByQuarter = predictor
    ? predictor.settings.reduce((acc, setting) => {
        const quarter = setting.quarter || "null";
        if (!acc[quarter]) {
          acc[quarter] = [];
        }
        acc[quarter].push(setting);
        return acc;
      }, {} as Record<string, ContestPredictorForPreGame["settings"]>)
    : {};

  // Get sorted unique quarter keys for both settings and prizes, as prizes may include extra entries like "1", "2", etc.
  const uniqueQuarterKeys = predictor
    ? Object.keys(settingsByQuarter)
        .concat(predictor.settings.map((setting) => setting.quarter))
        .filter(
          (v, i, arr) =>
            arr.indexOf(v) === i &&
            // Only include string keys likely to be quarters (1,2,3,4,HALF,OT,F,F/OT or null)
            (settingsByQuarter[v] || ["1", "2", "3", "4"].includes(v))
        )
        .sort((a, b) => {
          const order: Record<string, number> = {
            "1": 1,
            "2": 2,
            "3": 3,
            "4": 4,
          };
          return (order[a] || 99) - (order[b] || 99);
        })
    : [];

  // Fallback to quarters in settings if only settings exist
  const quarters = uniqueQuarterKeys;

  useEffect(() => {
    if (!abstractContestID || !profileID) {
      return;
    }

    fetchContestPredictor(abstractContestID, profileID);

    const interval = setInterval(() => {
      fetchContestPredictor(abstractContestID, profileID);
    }, 60000);

    return () => clearInterval(interval);
  }, [abstractContestID, profileID]);

  // Auto-swipe every 20 seconds
  useEffect(() => {
    if (quarters.length === 0) return;

    const interval = setInterval(() => {
      if (swiperRef.current?.swiper) {
        swiperRef.current.swiper.slideNext();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [quarters.length]);

  const fetchContestPredictor = async (
    abstractContestIDParam: string,
    profileIDParam: string
  ) => {
    const updatedPredictor = await fetchContestPredictorForPreGame(
      abstractContestIDParam,
      profileIDParam
    );
    setPredictor(updatedPredictor);
  };

  return (
    <>
      <div className="w-full h-full bg-[#0a0718] flex flex-col items-center justify-between px-3 gap-2.5">
        {predictor ? (
          <>
            <div className="w-full h-full flex flex-col items-center justify-center pt-12 pb-5 overflow-y-hidden">
              <PredictorLogo />
              <span className="h-10" />
              <div className="w-full max-w-5xl h-full flex flex-col items-center justify-start">
                {quarters.length > 0 && (
                  <Swiper
                    ref={swiperRef}
                    spaceBetween={40}
                    slidesPerView={1}
                    loop={true}
                    initialSlide={0}
                    className="w-full h-full"
                    onInit={() => {
                      // Swiper is now initialized
                    }}
                  >
                    {quarters.map((quarter) => (
                      <SwiperSlide key={`quarter-slide-${quarter}`}>
                        <div className="flex flex-col items-center w-full h-full">
                          {/* Prize Title for the quarter */}
                          <PredictorPrizeTitle
                            title={predictor.titles[quarter]}
                          />
                          {/* Predictor Categories for the quarter */}
                          <PredictorCategories
                            settings={settingsByQuarter[quarter] || []}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </div>
              <span className="h-12" />
              <div className="w-full h-fit px-7">
                <QRCodeWithDescription
                  qrcodeValue={`${window.location.origin}/submit-predictions/${predictor.contest_predictor_id}`}
                  description="Scan the code to submit your predictions"
                  dateTime={dateTime}
                />
              </div>
              <span className="h-10" />
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

interface PredictorPrizeTitleProps {
  title: { quarter: string; prize: string };
}

const PredictorPrizeTitle = ({ title }: PredictorPrizeTitleProps) => {
  return (
    <div className="w-full px-8">
      <div className="w-full bg-[#5545D3] rounded-t-md p-4 flex flex-col items-center justify-center gap-0.5">
        {/* Quarter label above everything */}
        <div className="w-full flex items-center justify-center">
          <span className="text-2xl font-medium text-gray-100 uppercase tracking-wider drop-shadow-sm">
            {title.quarter}
          </span>
        </div>
        <span className="text-4xl font-bold text-white text-center uppercase">
          {title.prize}
        </span>
      </div>
    </div>
  );
};

interface PredictorCategoriesProps {
  settings: ContestPredictorForPreGame["settings"];
}

const PredictorCategories = ({ settings }: PredictorCategoriesProps) => {
  // Up to 5 categories
  const displaySettings = settings.slice(0, 5);

  // Group out the relevant fields
  const categoryLabels = displaySettings.map(
    ({ team_key, category: { label } }) =>
      `${team_key === "TOTAL" ? "COMBINED" : team_key} ${label}`
  );
  const values = displaySettings.map(({ value }) => value);
  const pointsUnder = displaySettings.map(({ points }) => points.under);
  const pointsExact = displaySettings.map(({ points }) => points.exact);
  const pointsOver = displaySettings.map(({ points }) => points.over);

  return (
    <div className="w-full h-full bg-white rounded-md p-5 flex flex-col gap-2 pb-8">
      {/* Header: categories */}
      <div className="flex flex-row items-center gap-5 flex-1">
        {categoryLabels.map((label, idx) => (
          <div
            key={`predictor-category-label-${idx}`}
            className="flex-1 min-w-0 text-center text-lg font-semibold text-gray-700 uppercase tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>
      {/* Under */}
      <div className="flex flex-row gap-5 flex-1 pb-4">
        {values.map((optionValue, idx) => (
          <div
            key={`predictor-under-${idx}`}
            className="relative flex flex-col items-center justify-center border-2 rounded-md py-2 px-2 bg-gradient-to-b from-indigo-50 to-white border-indigo-600 flex-1 min-w-0"
            style={{ minHeight: 0 }}
          >
            <span className="text-lg font-semibold text-gray-900 pb-4">
              Under {optionValue}
            </span>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-fit min-w-18 px-4 py-0.5 bg-indigo-600 border-2 border-white rounded-full text-center">
              <span className="text-white font-medium text-base">
                +{pointsUnder[idx].toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Exactly */}
      <div className="flex flex-row gap-5 flex-1 pb-4">
        {values.map((optionValue, idx) => (
          <div
            key={`predictor-exact-${idx}`}
            className="relative flex flex-col items-center justify-center border-2 rounded-md py-2 px-2 bg-gradient-to-b from-yellow-50 to-white border-yellow-400 flex-1 min-w-0"
            style={{ minHeight: 0 }}
          >
            <span className="text-lg font-semibold text-gray-900 pb-4">
              Exactly {optionValue}
            </span>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-fit min-w-18 px-4 py-0.5 bg-yellow-400 border-2 border-white rounded-full text-center">
              <span className="text-black font-medium text-base">
                +{pointsExact[idx].toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
      {/* Over */}
      <div className="flex flex-row gap-5 flex-1">
        {values.map((optionValue, idx) => (
          <div
            key={`predictor-over-${idx}`}
            className="relative flex flex-col items-center justify-center border-2 rounded-md py-2 px-2 bg-gradient-to-b from-indigo-50 to-white border-indigo-600 flex-1 min-w-0"
            style={{ minHeight: 0 }}
          >
            <span className="text-lg font-semibold text-gray-900 pb-4">
              Over {optionValue}
            </span>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-fit min-w-18 px-4 py-0.5 bg-indigo-600 border-2 border-white rounded-full text-center">
              <span className="text-white font-medium text-base">
                +{pointsOver[idx].toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <>
      <div className="w-full h-fit px-5 py-4 flex items-center justify-between text-white/70">
        <div className="w-fit h-fit flex items-center justify-center gap-2">
          <span>Powered by</span>
          <Logo />
        </div>

        <span>Terms & Conditions apply</span>
      </div>
    </>
  );
};

const PredictorLogo = () => {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-center">
        <Logo size="h-8" isLight={true} />
      </div>

      <span className="text-5xl font-bold text-white flex items-center justify-center gap-1">
        {["P", "R", "E", "D", "I", "C", "T", "O", "R"].map((letter, index) => (
          <span key={index}>{letter}</span>
        ))}
      </span>
    </>
  );
};
