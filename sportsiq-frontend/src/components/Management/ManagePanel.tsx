import { useEffect, useState } from "react";
import AdminPanel from "./Profile/AdminPanel";
import UserPanel from "./Profile/UserPanel";
import Loading from "../Loading";
import { ContestManagePanel } from "./Contest/ContestManagePanel";
import { fetchProfilesByProfileID } from "../../services/manageService";
import { userStore } from "../../store";
import { useAuth } from "../../hooks/useAuth";
import {
  MdEvent,
  MdKeyboardArrowLeft,
  MdKeyboardArrowRight,
  MdLogout,
  MdMonetizationOn,
  MdPerson,
  MdToken,
  MdSports,
  MdPhoneIphone,
  MdTv,
} from "react-icons/md";
import { PrizeManagePanel } from "./PrizeManagePanel";
import { PointsManagePanel } from "./SportsIQPointsManagePanel";
import { GameManagePanel } from "./GameManagePanel";
import { MobileGameManagePanel } from "./Mobile/MobileGameManagePanel";

export default function ManagementPanel() {
  const { profileID, profile, setProfile, setProfiles } = userStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "profile" | "contest" | "prize" | "points" | "games" | "mobile"
  >("profile");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setLoading(true);
    const { profiles, profile } = await fetchProfilesByProfileID(profileID);

    setProfiles(profiles);
    setProfile(profile);
    setLoading(false);
  };

  if (loading) return <Loading />;

  const isAdmin = profile?.isAdmin;

  return (
    <>
      <div className="w-full h-full bg-white flex items-start divide-x divide-gray-300">
        <LeftSideBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isAdmin={isAdmin}
        />

        {activeTab === "profile" ? (
          <>{isAdmin ? <AdminPanel /> : <UserPanel />}</>
        ) : activeTab === "contest" ? (
          <ContestManagePanel />
        ) : activeTab === "prize" ? (
          <PrizeManagePanel />
        ) : activeTab === "points" ? (
          <PointsManagePanel />
        ) : activeTab === "games" ? (
          <GameManagePanel />
        ) : activeTab === "mobile" ? (
          <MobileGameManagePanel />
        ) : null}
      </div>
    </>
  );
}

interface ButtonProps {
  key: string;
  leadingIcon: React.ReactNode;
  label: string;
  onClick: () => void;
}

interface LeftSideBarProps {
  activeTab: "profile" | "contest" | "prize" | "points" | "games" | "mobile";
  setActiveTab: (
    tab: "profile" | "contest" | "prize" | "points" | "games" | "mobile"
  ) => void;
  isAdmin: boolean;
}

const LeftSideBar = ({
  activeTab,
  setActiveTab,
  isAdmin,
}: LeftSideBarProps) => {
  const { signOut } = useAuth();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const profileButton: ButtonProps = {
    key: "profile",
    leadingIcon: <MdPerson size={20} />,
    label: isAdmin ? "Users" : "Profile",
    onClick: () => setActiveTab("profile"),
  };
  const prizeButton: ButtonProps = {
    key: "prize",
    leadingIcon: <MdToken size={20} />,
    label: "Prizes",
    onClick: () => setActiveTab("prize"),
  };
  const contestButton: ButtonProps = {
    key: "contest",
    leadingIcon: <MdEvent size={20} />,
    label: "Contests",
    onClick: () => setActiveTab("contest"),
  };
  const pointsButton: ButtonProps = {
    key: "points",
    leadingIcon: <MdMonetizationOn size={20} />,
    label: "Points",
    onClick: () => setActiveTab("points"),
  };
  const gamesButton: ButtonProps = {
    key: "games",
    leadingIcon: <MdSports size={20} />,
    label: "Games",
    onClick: () => setActiveTab("games"),
  };
  const mobileButton: ButtonProps = {
    key: "mobile",
    leadingIcon: <MdPhoneIphone size={20} />,
    label: "Mobile Games",
    onClick: () => setActiveTab("mobile"),
  };
  const barScreenButton: ButtonProps = {
    key: "barscreen",
    leadingIcon: <MdTv size={20} />,
    label: "Bar Screen",
    onClick: () =>
      window.open("https://design.lumen-iq.com", "_blank"),
  };

  const buttons: ButtonProps[] = [profileButton];

  if (isAdmin) {
    buttons.push(contestButton);
  }

  buttons.push(prizeButton);

  if (isAdmin) {
    buttons.push(pointsButton);
    buttons.push(gamesButton);
    buttons.push(mobileButton);
    buttons.push(barScreenButton);
  }

  return (
    <div
      className={`h-full flex flex-col justify-between transition-all duration-200 ${
        isExpanded ? "w-60" : "w-14"
      }`}
    >
      <div className="flex flex-col divide-y divide-gray-300">
        <div className="w-full h-fit flex items-center justify-center p-1">
          <img
            src="/icon.png"
            alt="SportsIQ Logo"
            className={`${
              isExpanded ? "w-24 h-24" : "w-12 h-12"
            } object-contain`}
          />
        </div>
        {buttons.map((button) => (
          <SidebarButton key={button.key} onClick={button.onClick}>
            <div
              className={`w-full h-12 flex items-center justify-start gap-4 p-4 transition-colors duration-200 ${
                activeTab === button.key
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-gray-100 hover:bg-gray-300 text-gray-900"
              }`}
            >
              {button.leadingIcon}
              {isExpanded && (
                <span className="text-base font-medium">{button.label}</span>
              )}
            </div>
          </SidebarButton>
        ))}
      </div>

      <div className="w-full h-fit flex flex-col gap-4">
        <div className="w-full h-fit flex items-center justify-center">
          <SidebarButton onClick={() => setIsExpanded(!isExpanded)}>
            <div className="w-fit h-fit flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center hover:bg-gray-300 transition-colors duration-200">
                {isExpanded ? (
                  <MdKeyboardArrowLeft size={20} />
                ) : (
                  <MdKeyboardArrowRight size={20} />
                )}
              </div>
            </div>
          </SidebarButton>
        </div>
        <SidebarButton onClick={signOut}>
          <div className="w-full h-12 flex items-center justify-start gap-4 p-4 text-red-500 border-2 border-red-500 transition-colors duration-200 hover:bg-red-500 hover:text-white">
            <MdLogout size={20} />
            {isExpanded && (
              <span className="text-base font-medium">Sign Out</span>
            )}
          </div>
        </SidebarButton>
      </div>
    </div>
  );
};

interface SidebarButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const SidebarButton = ({ onClick, children }: SidebarButtonProps) => {
  return (
    <>
      <button onClick={onClick}>{children}</button>
    </>
  );
};
