import { create } from "zustand";
import { DashboardSettings, UserProfile } from "../types/general";

interface UserStore {
  profileID: string | null;
  dashboardSettings: DashboardSettings | null;
  profile: UserProfile | null;
  profiles: UserProfile[] | null;
  setProfileID: (profileID: string | null) => void;
  setDashboardSettings: (dashboardSettings: DashboardSettings | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setProfiles: (profiles: UserProfile[] | null) => void;
}

const userStore = create<UserStore>((set) => ({
  profileID: null,
  dashboardSettings: null,
  profile: null,
  profiles: null,
  setProfileID: (profileID) => set({ profileID: profileID }),
  setDashboardSettings: (dashboardSettings) =>
    set({ dashboardSettings: dashboardSettings }),
  setProfile: (profile) => set({ profile: profile }),
  setProfiles: (profiles) => set({ profiles: profiles }),
}));

export { userStore };
