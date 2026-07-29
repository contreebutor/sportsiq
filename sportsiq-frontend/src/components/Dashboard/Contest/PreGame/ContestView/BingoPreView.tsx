import { fetchContestBingoForPreGame } from "../../../../../services/contestService";
import { useEffect, useState } from "react";
import { ContestBingoForPreGame } from "../../../../../types/contests";
import { contestStore } from "../../../../../store";
import Logo from "../../../../Logo";
import { QRCodeWithDescription } from "./QRCodeWithDescription";
import Loading from "../../../../Loading";
import { useParams } from "react-router-dom";

interface Props {
  teamLogos: {
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  };
}

export const BingoPreView = ({ teamLogos }: Props) => {
  const { id: profileID } = useParams<{ id: string }>();
  const { contestForToday } = contestStore();

  const abstractContestID = contestForToday.abstract_contest_id;
  const dateTime = contestForToday.date_time;

  const [contestBingo, setContestBingo] =
    useState<ContestBingoForPreGame | null>(null);

  useEffect(() => {
    fetchBingo(abstractContestID, profileID);

    const interval = setInterval(() => {
      if (abstractContestID && profileID) {
        fetchBingo(abstractContestID, profileID);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [abstractContestID, profileID]);

  const fetchBingo = async (abstractContestID: string, profileID: string) => {
    const data = await fetchContestBingoForPreGame(
      abstractContestID,
      profileID
    );
    setContestBingo(data);
  };

  return (
    <>
      <div className="w-full h-full bg-[#0a0718] flex flex-col items-center justify-between px-3 gap-2.5">
        {contestBingo ? (
          <>
            <div className="w-full h-full flex flex-col items-center justify-center pt-12 px-15 pb-5 overflow-y-hidden">
              <BingoLogo />
              <span className="h-10" />
              <div className="w-full h-full flex flex-col items-center justify-start">
                <BingoPrizeTitle prizes={contestBingo.prizes} />
                <BingoCategories
                  teamLogos={teamLogos}
                  categories={contestBingo.categories}
                />
              </div>
              <span className="h-12" />
              <QRCodeWithDescription
                qrcodeValue={`${window.location.origin}/submit-bingo-cards/${contestBingo.contest_bingo_id}`}
                description="Scan the code to claim your FREE Bingo Card"
                dateTime={dateTime}
              />
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

interface BingoPrizeTitleProps {
  prizes: {
    [key: string]: string | null;
  };
}

const BingoPrizeTitle = ({ prizes }: BingoPrizeTitleProps) => {
  return (
    <>
      <div className="w-full px-8">
        <div className="w-full bg-[#5545D3] rounded-md p-5 flex flex-col items-center justify-center gap-2">
          <span className="text-4xl font-bold text-white text-center">
            {prizes[1]}
          </span>

          <span className="text-2xl font-medium text-white">
            The more squares you tick off, the more IQ Points you earn.
          </span>
        </div>
      </div>
    </>
  );
};

interface BingoCategoryProps {
  teamLogos: {
    [key: string]: {
      logo_url: string;
      type: "home" | "away";
    };
  };
  categories: { team_key: string; description: string; points: number }[];
}

const BingoCategories = ({ teamLogos, categories }: BingoCategoryProps) => {
  // Display 15 items in a 3x5 grid (3 rows, 5 columns)
  const displayCategories = categories.slice(0, 15);

  // Utility to find team keys for BOTH teams
  const getBothTeams = () => {
    // get all distinct teams that are NOT "TOTAL"
    const teamKeys = Object.keys(teamLogos).filter((k) => k !== "TOTAL");
    // team_key may be 'home', 'away' or keys like "ATL", "CHI", etc.
    // We'll display the first two that are not "TOTAL"
    // Optionally, look for 'home' and 'away' by their type property
    let homeKey: string | undefined, awayKey: string | undefined;
    for (const key of teamKeys) {
      if (teamLogos[key]?.type === "home") homeKey = key;
      else if (teamLogos[key]?.type === "away") awayKey = key;
    }
    // fallback: use teamKeys[0] and teamKeys[1] if home/away are not found
    if (!homeKey) homeKey = teamKeys[0];
    if (!awayKey) awayKey = teamKeys[1] || teamKeys[0];
    return { homeKey, awayKey };
  };

  return (
    <>
      <div className="w-full h-full bg-white rounded-md p-4 grid grid-cols-5 gap-5 pb-8">
        {displayCategories.map((category, index) => {
          const isTotal = category.team_key === "TOTAL";
          let homeKey: string | undefined, awayKey: string | undefined;
          if (isTotal) {
            const keys = getBothTeams();
            homeKey = keys.homeKey;
            awayKey = keys.awayKey;
          }
          return (
            <div
              key={`item-${index}`}
              className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-600/10 to-white border-2 border-indigo-600 rounded-md pt-1 px-4 pb-4"
            >
              {/* Render logos */}
              {isTotal ? (
                <>
                  <span className="absolute top-0.5 left-0.5 text-sm font-bold text-white/70">
                    {homeKey && teamLogos[homeKey]?.logo_url ? (
                      <img
                        src={teamLogos[homeKey].logo_url}
                        alt={homeKey}
                        className="w-6 h-6"
                      />
                    ) : (
                      <Loading size="w-4 h-4" isLight={false} />
                    )}
                  </span>
                  <span className="absolute top-0.5 right-0.5 text-sm font-bold text-white/70">
                    {awayKey && teamLogos[awayKey]?.logo_url ? (
                      <img
                        src={teamLogos[awayKey].logo_url}
                        alt={awayKey}
                        className="w-6 h-6"
                      />
                    ) : (
                      <Loading size="w-4 h-4" isLight={false} />
                    )}
                  </span>
                </>
              ) : (
                <span
                  className={`absolute top-0.5 ${
                    teamLogos[category.team_key]?.type === "home"
                      ? "right-0.5"
                      : "left-0.5"
                  } text-sm font-bold text-white/70`}
                >
                  {teamLogos[category.team_key]?.logo_url ? (
                    <img
                      src={teamLogos[category.team_key]?.logo_url}
                      alt={category.team_key}
                      className="w-6 h-6"
                    />
                  ) : (
                    <Loading size="w-4 h-4" isLight={false} />
                  )}
                </span>
              )}

              <div className="w-full h-fit flex flex-col items-center justify-center gap-0.5">
                <span className="text-lg font-bold text-black text-center">
                  {category.team_key}
                </span>
                <span className="text-lg font-medium text-black text-center leading-tight">
                  {category.description}
                </span>
              </div>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-fit min-w-14 px-4 py-0.5 bg-indigo-600 border-2 border-white rounded-full text-center">
                <span className="text-white font-medium text-base">
                  +{category.points.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </>
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

const BingoLogo = () => {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-center">
        <Logo size="h-7" isLight={true} />
      </div>
      <div className="w-fit h-22 flex gap-1.5 text-white font-bold text-5xl">
        <span className="self-start">B</span>
        <span className="self-end">I</span>
        <span className="self-start">N</span>
        <span className="self-end">G</span>
        <span className="self-start">O</span>
      </div>
    </>
  );
};
