export const MIN_POINTS_TO_PLAY = 50;
export const MAX_POINTS = 150;
export const TOTAL_TIME_S = 15;

export const APP_STORE_URL =
  "https://apps.apple.com/us/app/sports-iq/id6759401599";

export const MOBILE_APP_SCHEME = "sportsiqmobile://";

export const BRAND = {
  bg: "#050912",
  card: "rgba(255,255,255,0.04)",
  cardBorder: "rgba(255,255,255,0.08)",
  purple: "#5545D3",
  purpleLight: "#7C6EF5",
  purpleFaint: "rgba(85,69,211,0.18)",
  purpleBorder: "rgba(85,69,211,0.45)",
  gold: "#F59E0B",
  goldFaint: "rgba(245,158,11,0.12)",
  green: "#22C55E",
  red: "#EF4444",
  text: "#F8FAFC",
  muted: "#94A3B8",
  faint: "#475569",
} as const;

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:8080";

export const API_BASE = `${BACKEND_URL}/v1`;

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ?? BACKEND_URL ?? "http://localhost:8081";
