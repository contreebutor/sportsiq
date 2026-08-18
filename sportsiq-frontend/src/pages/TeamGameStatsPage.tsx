import { useEffect, useState } from "react";
import {
  fetchNFLTeamGameStats,
  fetchNBATeamGameStats,
  fetchCBBTeamGameStats,
  fetchNHLTeamGameStats,
  fetchMLBTeamGameStats,
  NFLTeamGameStats,
  NBATeamGameStats,
  CBBTeamGameStats,
  NHLTeamGameStats,
  MLBTeamGameStats,
} from "../services/teamGameStatsService";
import Loading from "../components/Loading";

type StatRow = {
  field: string;
  values: (number | null)[];
};

type SportType = "NFL" | "NBA" | "CBB" | "NHL" | "MLB";

const MLB_FIELDS = [
  "runs",
  "hits",
  "at_bats",
  "singles",
  "doubles",
  "triples",
  "home_runs",
  "rbi",
  "strikeouts",
  "walks",
  "hit_by_pitch",
  "stolen_bases",
  "caught_stealing",
  "errors",
  "pitching_hits",
  "pitching_runs",
  "pitching_earned_runs",
  "pitching_walks",
  "pitching_strikeouts",
  "pitching_home_runs",
  "double_plays",
  "left_on_base",
];

const MLB_INNING_PREFIXES = [
  "first",
  "second",
  "third",
  "fourth",
  "fifth",
  "sixth",
  "seventh",
  "eighth",
  "ninth",
];

const BASKETBALL_FIELDS = [
  "three_pointers_made",
  "three_pointers_missed",
  "steals",
  "turnovers",
  "personal_fouls",
  "points",
  "offensive_rebounds",
  "defensive_rebounds",
  "rebounds",
  "blocked_shots",
  "field_goals_attempted",
  "field_goals_made",
  "field_goals_missed",
  "free_throws_attempted",
  "free_throws_made",
  "free_throws_missed",
  "assists",
];

const NHL_FIELDS = [
  "goals",
  "assists",
  "shots_on_goal",
  "power_play_goals",
  "short_handed_goals",
  "empty_net_goals",
  "power_play_assists",
  "short_handed_assists",
  "hat_tricks",
  "shootout_goals",
  "plus_minus",
  "penalty_minutes",
  "blocks",
  "hits",
  "takeaways",
  "giveaways",
  "faceoffs_won",
  "faceoffs_lost",
  "shifts",
  "goaltending_shots_against",
  "goaltending_goals_against",
  "goaltending_saves",
  "goaltending_shutouts",
  "bench_penalty_minutes",
];

const formatFieldName = (field: string): string => {
  return field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const transformNFLData = (data: NFLTeamGameStats[]): Map<string, StatRow[]> => {
  const teamDataMap = new Map<string, StatRow[]>();

  data.forEach((row) => {
    const teamKey = row.team_key;
    if (!teamDataMap.has(teamKey)) {
      teamDataMap.set(teamKey, []);
    }

    const stats = teamDataMap.get(teamKey)!;

    const nflFields = [
      "touchdowns",
      "field_goals_made",
      "field_goals_missed",
      "sacks",
      "safeties",
      "passing_interceptions",
      "fumbles",
      "punts",
      "extra_point_made",
      "extra_point_missed",
      "two_pt_conversion_made",
      "two_pt_conversion_missed",
      "penalties",
      "first_downs",
      "points",
      "first_downs_by_rushing",
      "offensive_yards",
      "offensive_plays",
      "rushing_yards",
      "passing_yards",
      "passing_attempts",
      "passing_completions",
      "third_down_conversions",
      "fourth_down_conversions",
      "passing_touchdowns",
      "rushing_touchdowns",
    ];

    nflFields.forEach((field) => {
      stats.push({
        field,
        values: [
          row[`first_quarter_${field}` as keyof NFLTeamGameStats] as number,
          row[`second_quarter_${field}` as keyof NFLTeamGameStats] as number,
          row[`third_quarter_${field}` as keyof NFLTeamGameStats] as number,
          row[`fourth_quarter_${field}` as keyof NFLTeamGameStats] as number,
        ],
      });
    });
  });

  return teamDataMap;
};

const transformNBAData = (data: NBATeamGameStats[]): Map<string, StatRow[]> => {
  const teamDataMap = new Map<string, StatRow[]>();

  data.forEach((row) => {
    const teamKey = row.team_key;
    if (!teamDataMap.has(teamKey)) {
      teamDataMap.set(teamKey, []);
    }

    const stats = teamDataMap.get(teamKey)!;

    BASKETBALL_FIELDS.forEach((field) => {
      stats.push({
        field,
        values: [
          row[`first_quarter_${field}` as keyof NBATeamGameStats] as number,
          row[`second_quarter_${field}` as keyof NBATeamGameStats] as number,
          row[`third_quarter_${field}` as keyof NBATeamGameStats] as number,
          row[`fourth_quarter_${field}` as keyof NBATeamGameStats] as number,
        ],
      });
    });
  });

  return teamDataMap;
};

const transformCBBData = (data: CBBTeamGameStats[]): Map<string, StatRow[]> => {
  const teamDataMap = new Map<string, StatRow[]>();

  data.forEach((row) => {
    const teamKey = row.team_key;
    if (!teamDataMap.has(teamKey)) {
      teamDataMap.set(teamKey, []);
    }

    const stats = teamDataMap.get(teamKey)!;

    BASKETBALL_FIELDS.forEach((field) => {
      stats.push({
        field,
        values: [
          row[`first_quarter_${field}` as keyof CBBTeamGameStats] as number,
          row[`second_quarter_${field}` as keyof CBBTeamGameStats] as number,
        ],
      });
    });
  });

  return teamDataMap;
};

const transformNHLData = (data: NHLTeamGameStats[]): Map<string, StatRow[]> => {
  const teamDataMap = new Map<string, StatRow[]>();

  data.forEach((row) => {
    const teamKey = row.team_key;
    if (!teamDataMap.has(teamKey)) {
      teamDataMap.set(teamKey, []);
    }

    const stats = teamDataMap.get(teamKey)!;

    NHL_FIELDS.forEach((field) => {
      stats.push({
        field,
        values: [
          row[`first_period_${field}` as keyof NHLTeamGameStats] as number,
          row[`second_period_${field}` as keyof NHLTeamGameStats] as number,
          row[`third_period_${field}` as keyof NHLTeamGameStats] as number,
        ],
      });
    });
  });

  return teamDataMap;
};

const transformMLBData = (data: MLBTeamGameStats[]): Map<string, StatRow[]> => {
  const teamDataMap = new Map<string, StatRow[]>();

  data.forEach((row) => {
    const teamKey = row.team_key;
    if (!teamDataMap.has(teamKey)) {
      teamDataMap.set(teamKey, []);
    }

    const stats = teamDataMap.get(teamKey)!;

    MLB_FIELDS.forEach((field) => {
      stats.push({
        field,
        values: MLB_INNING_PREFIXES.map(
          (prefix) =>
            (row[`${prefix}_inning_${field}` as keyof MLBTeamGameStats] as number) ??
            null
        ),
      });
    });
  });

  return teamDataMap;
};

type TeamStatsTableProps = {
  stats: StatRow[];
  periodCount: number;
  periodLabel: string;
};

const TeamStatsTable = ({
  stats,
  periodCount,
  periodLabel,
}: TeamStatsTableProps) => {
  const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 uppercase tracking-wider border border-gray-300">
              Field
            </th>
            {Array.from({ length: periodCount }, (_, i) => (
              <th
                key={i}
                className="px-4 py-3 text-center text-sm font-medium text-gray-700 uppercase tracking-wider border border-gray-300"
              >
                {ordinals[i]} {periodLabel}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.map((stat, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900 border border-gray-300 font-medium">
                {formatFieldName(stat.field)}
              </td>
              {stat.values.slice(0, periodCount).map((val, i) => (
                <td
                  key={i}
                  className="px-4 py-3 text-sm text-gray-700 text-center border border-gray-300"
                >
                  {val !== null ? val : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

type TabBarProps = {
  teamKeys: string[];
  activeTab: string | null;
  onTabClick: (teamKey: string) => void;
};

const TabBar = ({ teamKeys, activeTab, onTabClick }: TabBarProps) => {
  if (teamKeys.length === 0) return null;

  return (
    <div className="">
      <div className="flex overflow-x-auto border-b border-gray-300 bg-gray-200">
        {teamKeys.map((teamKey) => {
          const isActive = activeTab === teamKey;
          return (
            <button
              key={teamKey}
              onClick={() => onTabClick(teamKey)}
              className={`
                relative px-6 py-2 text-sm font-medium whitespace-nowrap
                transition-colors duration-150
                ${
                  isActive
                    ? "bg-white text-gray-900 border-t border-l border-r border-gray-300 rounded-t-lg"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }
              `}
              style={{
                marginRight: "-1px",
                zIndex: isActive ? 10 : 1,
              }}
            >
              {teamKey}
            </button>
          );
        })}
      </div>
    </div>
  );
};

type StatsSectionProps = {
  title: string;
  data: Map<string, StatRow[]>;
  activeTab: string | null;
  onTabClick: (teamKey: string) => void;
  periodCount: number;
  periodLabel: string;
};

const StatsSection = ({
  title,
  data,
  activeTab,
  onTabClick,
  periodCount,
  periodLabel,
}: StatsSectionProps) => {
  const teamKeys = Array.from(data.keys()).sort();

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-semibold mb-4">{title}</h2>
      <TabBar
        teamKeys={teamKeys}
        activeTab={activeTab}
        onTabClick={onTabClick}
      />
      {activeTab && data.has(activeTab) && (
        <div className="bg-white p-4 border border-gray-300 border-t-0 rounded-b-lg">
          <TeamStatsTable
            stats={data.get(activeTab)!}
            periodCount={periodCount}
            periodLabel={periodLabel}
          />
        </div>
      )}
      {data.size === 0 && (
        <div className="text-gray-500">No {title} data available</div>
      )}
    </div>
  );
};

const ALL_SPORTS: SportType[] = ["NFL", "NBA", "CBB", "NHL", "MLB"];

export const TeamGameStatsPage = () => {
  const [nflData, setNflData] = useState<Map<string, StatRow[]>>(new Map());
  const [nbaData, setNbaData] = useState<Map<string, StatRow[]>>(new Map());
  const [cbbData, setCbbData] = useState<Map<string, StatRow[]>>(new Map());
  const [nhlData, setNhlData] = useState<Map<string, StatRow[]>>(new Map());
  const [mlbData, setMlbData] = useState<Map<string, StatRow[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeNFLTab, setActiveNFLTab] = useState<string | null>(null);
  const [activeNBATab, setActiveNBATab] = useState<string | null>(null);
  const [activeCBBTab, setActiveCBBTab] = useState<string | null>(null);
  const [activeNHLTab, setActiveNHLTab] = useState<string | null>(null);
  const [activeMLBTab, setActiveMLBTab] = useState<string | null>(null);
  const [selectedSports, setSelectedSports] = useState<SportType[]>([
    ...ALL_SPORTS,
  ]);

  const toggleSport = (sport: SportType) => {
    setSelectedSports((prev) =>
      prev.includes(sport)
        ? prev.filter((s) => s !== sport)
        : [...prev, sport]
    );
  };

  useEffect(() => {
    const fetchData = async (isInitial: boolean) => {
      try {
        if (isInitial) {
          setLoading(true);
        }
        const [nflStats, nbaStats, cbbStats, nhlStats, mlbStats] = await Promise.all([
          fetchNFLTeamGameStats(),
          fetchNBATeamGameStats(),
          fetchCBBTeamGameStats(),
          fetchNHLTeamGameStats(),
          fetchMLBTeamGameStats(),
        ]);

        const transformedNFL = transformNFLData(nflStats);
        const transformedNBA = transformNBAData(nbaStats);
        const transformedCBB = transformCBBData(cbbStats);
        const transformedNHL = transformNHLData(nhlStats);
        const transformedMLB = transformMLBData(mlbStats);

        setNflData(transformedNFL);
        setNbaData(transformedNBA);
        setCbbData(transformedCBB);
        setNhlData(transformedNHL);
        setMlbData(transformedMLB);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        if (isInitial) {
          setLoading(false);
        }
      }
    };

    // Fetch immediately
    fetchData(true);

    // Set up interval to fetch every 2 seconds
    const interval = setInterval(() => {
      fetchData(false);
    }, 2000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  // Set initial active tabs when data first loads
  useEffect(() => {
    if (activeNFLTab === null && nflData.size > 0) {
      const sortedKeys = Array.from(nflData.keys()).sort();
      setActiveNFLTab(sortedKeys[0]);
    }
    if (activeNBATab === null && nbaData.size > 0) {
      const sortedKeys = Array.from(nbaData.keys()).sort();
      setActiveNBATab(sortedKeys[0]);
    }
    if (activeCBBTab === null && cbbData.size > 0) {
      const sortedKeys = Array.from(cbbData.keys()).sort();
      setActiveCBBTab(sortedKeys[0]);
    }
    if (activeNHLTab === null && nhlData.size > 0) {
      const sortedKeys = Array.from(nhlData.keys()).sort();
      setActiveNHLTab(sortedKeys[0]);
    }
    if (activeMLBTab === null && mlbData.size > 0) {
      const sortedKeys = Array.from(mlbData.keys()).sort();
      setActiveMLBTab(sortedKeys[0]);
    }
  }, [
    nflData,
    nbaData,
    cbbData,
    nhlData,
    mlbData,
    activeNFLTab,
    activeNBATab,
    activeCBBTab,
    activeNHLTab,
    activeMLBTab,
  ]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="h-full w-full overflow-y-auto p-8">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto p-8 bg-gray-100">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Team Game Stats</h1>
        <div className="flex items-center gap-2">
          {ALL_SPORTS.map((sport) => {
            const isSelected = selectedSports.includes(sport);
            return (
              <button
                key={sport}
                onClick={() => toggleSport(sport)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                }`}
              >
                {sport}
              </button>
            );
          })}
        </div>
      </div>

      {/* NFL Section */}
      {selectedSports.includes("NFL") && (
        <StatsSection
          title="NFL Stats"
          data={nflData}
          activeTab={activeNFLTab}
          onTabClick={setActiveNFLTab}
          periodCount={4}
          periodLabel="Quarter"
        />
      )}

      {/* NBA Section */}
      {selectedSports.includes("NBA") && (
        <StatsSection
          title="NBA Stats"
          data={nbaData}
          activeTab={activeNBATab}
          onTabClick={setActiveNBATab}
          periodCount={4}
          periodLabel="Quarter"
        />
      )}

      {/* CBB Section */}
      {selectedSports.includes("CBB") && (
        <StatsSection
          title="CBB Stats"
          data={cbbData}
          activeTab={activeCBBTab}
          onTabClick={setActiveCBBTab}
          periodCount={2}
          periodLabel="Quarter"
        />
      )}

      {/* NHL Section */}
      {selectedSports.includes("NHL") && (
        <StatsSection
          title="NHL Stats"
          data={nhlData}
          activeTab={activeNHLTab}
          onTabClick={setActiveNHLTab}
          periodCount={3}
          periodLabel="Period"
        />
      )}

      {/* MLB Section */}
      {selectedSports.includes("MLB") && (
        <StatsSection
          title="MLB Stats"
          data={mlbData}
          activeTab={activeMLBTab}
          onTabClick={setActiveMLBTab}
          periodCount={9}
          periodLabel="Inning"
        />
      )}
    </div>
  );
};
