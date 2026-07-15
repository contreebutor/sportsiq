import { create } from "zustand";
import { ContestForToday } from "../types/general";

interface ContestStore {
  contestForToday: ContestForToday | null;
  setContestForToday: (contestForToday: ContestForToday | null) => void;
}
const contestStore = create<ContestStore>((set) => ({
  contestForToday: null,
  setContestForToday: (contestForToday: ContestForToday | null) =>
    set({ contestForToday: contestForToday }),
}));

export { contestStore };
