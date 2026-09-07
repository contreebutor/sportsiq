import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const PHONE_STORAGE_KEY = "siq_phone";

export interface UserInfo {
  id: string;
  phone: string;
  name: string;
  avatar_url: string | null;
  points: number;
}

interface UserState {
  phone: string | null;
  user: UserInfo | null;
  hydrated: boolean;
  setPhone: (phone: string | null) => void;
  setUser: (user: UserInfo | null) => void;
  hydrate: () => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  phone: null,
  user: null,
  hydrated: false,
  setPhone: (phone) => {
    if (phone) {
      SecureStore.setItemAsync(PHONE_STORAGE_KEY, phone);
    } else {
      SecureStore.deleteItemAsync(PHONE_STORAGE_KEY);
    }
    set({ phone });
  },
  setUser: (user) => set({ user }),
  hydrate: async () => {
    const stored = await SecureStore.getItemAsync(PHONE_STORAGE_KEY);
    set({ phone: stored ?? null, hydrated: true });
  },
}));
