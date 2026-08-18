import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UserInfo } from "./types";

interface WebPlayUserStore {
  phone: string | null;
  user: UserInfo | null;
  setPhone: (phone: string | null) => void;
  setUser: (user: UserInfo | null) => void;
  signOut: () => void;
}

export const useWebPlayUser = create<WebPlayUserStore>()(
  persist(
    (set) => ({
      phone: null,
      user: null,
      setPhone: (phone) => set({ phone }),
      setUser: (user) => set({ user }),
      signOut: () => set({ phone: null, user: null }),
    }),
    {
      name: "webplay-user",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
