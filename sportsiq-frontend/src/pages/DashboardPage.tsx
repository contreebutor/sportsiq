import { useEffect } from "react";
import GeneralDashboard from "../components/Dashboard/General/GeneralDashboard";
import ContestDashboard from "../components/Dashboard/Contest/ContestDashboard";
import { BarScreen } from "../components/Dashboard/Barscreen/BarScreen";
import { useParams } from "react-router-dom";
import { contestStore } from "../store/contestStore";
import { fetchUpcomingContestForToday } from "../services/contestService";
import { fetchDashboardSettingsByProfileID } from "../services/manageService";
import { userStore } from "../store/userStore";

export default function DashboardPage() {
  const { id } = useParams<{ id: string }>();
  const { contestForToday, setContestForToday } = contestStore();
  const { dashboardSettings, setDashboardSettings } = userStore();

  // Poll dashboard settings so admin changes apply in real time
  useEffect(() => {
    if (!id) return;
    const fetchSettings = async () => {
      const data = await fetchDashboardSettingsByProfileID(id);
      if (data) setDashboardSettings(data);
    };
    fetchSettings();
    const interval = setInterval(fetchSettings, 10_000);
    return () => clearInterval(interval);
  }, [id]);

  // Poll contest status — faster when a contest is active, slower when idle
  useEffect(() => {
    if (!id) return;
    fetchContestForToday();
    const pollMs = contestForToday ? 10_000 : 60_000;
    const interval = setInterval(fetchContestForToday, pollMs);
    return () => clearInterval(interval);
  }, [id, !!contestForToday]);

  const fetchContestForToday = async () => {
    const contestForTodayData = await fetchUpcomingContestForToday();
    setContestForToday(contestForTodayData);
  };

  const isType2 = dashboardSettings?.contest_dashboard_type === 2;

  // Type 2 = always-on bar screen, but only when contest is enabled for this profile
  if (isType2 && dashboardSettings?.contest_enabled) {
    return <BarScreen />;
  }

  // Type 1 = contest dashboard when contest is active, otherwise general
  const contestGameStatus = contestForToday?.game_status;
  const isPregame = contestGameStatus === "Scheduled";
  const isLivegame = contestGameStatus === "InProgress";
  const contestEnabled =
    dashboardSettings?.contest_enabled && (isPregame || isLivegame);

  return (
    <>
      {contestEnabled && contestForToday ? (
        <ContestDashboard />
      ) : (
        <GeneralDashboard />
      )}
    </>
  );
}
