import type { FeaturedPredictionGame } from "@/lib/api";

export type FeaturedGameItem = FeaturedPredictionGame;
export type TeamStatic = FeaturedPredictionGame["sports_game"]["teams"]["home"];
export type FeaturedPickItem = FeaturedPredictionGame["picks"][number];
