# SportsIQ Bar Screen

A standalone, full-screen TV display for venues running SportsIQ. It sits on a bar's TV (for
example through a Yodeck player) and shows, in real time:

- a **QR code and room code** inviting patrons to join from their phones
- **live trivia** questions with a countdown, live answer counts and the answer reveal
- **More/Less predictions** on live game stats (crowd split, live stat tracking, result)
- **leaderboards**, plus occasional **"intelligence" alerts** overlaid on any screen

It only listens: the screen receives game events over Socket.IO and sends nothing except a
`barscreen:join` on connect.

- **Stack:** React 18, TypeScript, Vite 5, Tailwind CSS 3, Socket.IO client, `qrcode`
- **Canvas:** authored at **1920×1080**. This copy has no scaling code (despite the comment in
  `App.tsx`), so run the browser at 1920×1080 or use the frontend copy, which scales to the window.

> **Status:** the dashboard app ships a newer copy of this screen at
> [`sportsiq-frontend/src/components/Dashboard/Barscreen/`](../sportsiq-frontend/src/components/Dashboard/Barscreen),
> served at `/dashboard/:profileId` when the venue's `contest_dashboard_type` is `2`. **That copy
> is what runs in production.** It uses the backend's real `/trivia` events and `/v1/barscreen/*`
> REST endpoints, and has two extra screens (Intermission, Prediction Leaderboard). This folder
> still targets the original socket spec described [below](#socket-contract), which the backend
> doesn't fully implement yet. Keep the two in sync when you change a shared screen.

---

## Getting started

Requirements: Node.js 20+.

```bash
cd sportsiq-barscreen
npm install
# optional: create .env (see below)
npm run dev                         # http://localhost:5174
```

Open it with a bar ID (and optionally a token):

```
http://localhost:5174/?bar=kincades-001&token=<token>
```

### Previewing without a backend

`src/components/BarScreenDemo.tsx` is a self-contained demo driver with realistic mock data. It
cycles through every state (idle 8 s → trivia question 12 s → reveal 8 s → predictor question 10 s
→ waiting 10 s → result 8 s → idle). To use it, render `<BarScreenDemo />` instead of
`<BarScreen … />` in `src/App.tsx`. The file also documents every payload, so it doubles as the
event spec.

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server on port **5174**. `/socket.io` is proxied to `VITE_BACKEND_URL` |
| `npm run build` | `tsc` type-check, then production build to `dist/` (with sourcemaps) |
| `npm run preview` | Serve the build locally |

### Configuration

| Source | Key | Default | Description |
|---|---|---|---|
| URL query | `bar` | `default` | Bar / venue ID. Used for the join URL `https://lumen-iq.com/join/<bar>` and the room code lookup |
| URL query | `token` | `VITE_BAR_TOKEN` | Auth token sent in the socket handshake |
| `.env` | `VITE_BACKEND_URL` | `http://localhost:8080` | Backend REST base; also the dev proxy target |
| `.env` | `VITE_SOCKET_URL` | `http://localhost:8081` | Socket.IO server (the backend's `dev:socket` runs on `8082`) |
| `.env` | `VITE_BAR_TOKEN` | empty | Fallback token when the URL has none |

`.env`, `.env.local` and `*.local` are gitignored.

---

## Screens

`src/components/BarScreen.tsx` owns the layout and switches screens based on `state.screen`,
which comes from the `useBarSockets` hook:

| `screen` | Component | Triggered by |
|---|---|---|
| `idle` | `screens/IdleScreen` | default / after a result. QR, room code, leaderboard, call to action |
| `trivia-q` | `screens/TriviaQuestionScreen` | `trivia:question` |
| `trivia-rev` | `screens/TriviaRevealScreen` | `trivia:reveal` |
| `predictor-q` | `screens/PredictorQuestionScreen` | `moreless:question` |
| `predictor-w` | `screens/PredictorWaitingScreen` | `moreless:locked` (tug-of-war stat tracker) |
| `predictor-r` | `screens/PredictorResultScreen` | `moreless:resolved` |
| overlay | `ui/IntelAlertOverlay` | `intelligence:alert` (shows for 15 s over any screen) |

Shared UI lives in `src/components/ui/` (`LiveBadge`, `LeaderboardRow`, `MiniQrBadge`,
`InjectStyles` for fonts and keyframes). Design tokens (brand purple `#5545D3`, teal, dark
panels, Lexend font) are in `src/theme.ts`.

---

## Socket contract

`src/lib/socket.ts` opens three connections to `VITE_SOCKET_URL`, each with
`auth: { token, role: "barscreen", barId }` and the websocket transport only:

| Namespace | Listens for | Payload type (`src/types.ts`) |
|---|---|---|
| `/trivia` | `trivia:question` | `TriviaQuestion` |
| | `trivia:answer_counts` | `AnswerCounts` (`{ A, B, C, D }`) |
| | `trivia:reveal` | `TriviaReveal` |
| | `trivia:leaderboard` | `LeaderboardEntry[]` |
| `/moreless` | `moreless:question` | `PredictorQuestion` |
| | `moreless:crowd_update` | `PredictorCrowdSplit` |
| | `moreless:stat_update` | `{ currentStat, probability }` |
| | `moreless:locked` | `{ crowdSplit }` |
| | `moreless:resolved` | `PredictorResolved` |
| `/` (root) | `intelligence:alert` | `IntelligenceAlert` |

On connect, it emits `barscreen:join { barId }` on `/trivia` and `/moreless`. The room code comes
from `GET ${VITE_BACKEND_URL}/bar/:barId/room-code` (if that fails, the screen shows `-----`).

**Gap with the current backend:** the backend's `/trivia` namespace emits `trivia:result` (not
`trivia:reveal`) and has no `/moreless` namespace, root-namespace alerts or
`/bar/:id/room-code` route. Until those exist, use the demo driver here, or use the frontend
copy, which is already wired to the real events.

---

## Project structure

```
src/
├── main.tsx              # React root
├── App.tsx               # reads ?bar & ?token, fetches room code, renders <BarScreen>
├── components/
│   ├── BarScreen.tsx     # layout + screen switcher
│   ├── BarScreenDemo.tsx # mock-data demo driver and event spec
│   ├── screens/          # Idle, TriviaQuestion, TriviaReveal, Predictor{Question,Waiting,Result}
│   └── ui/               # LiveBadge, LeaderboardRow, MiniQrBadge, IntelAlertOverlay, InjectStyles
├── hooks/useBarSockets.ts# socket listeners → screen state, countdown, alert timer
├── lib/socket.ts         # socket singletons per namespace
├── types.ts              # ScreenState and event payload types
├── theme.ts              # colors, fonts
├── utils.ts              # helpers (e.g. secondsUntil)
└── index.css             # Tailwind entry
```

---

## Deploying to a TV

1. `npm run build` and host `dist/` on any static host.
2. Point the TV player or kiosk browser at `https://<host>/?bar=<barId>&token=<token>`.
3. Use a Chromium-based player with a 1920×1080 viewport. On a 4K panel, set the device scale
   factor to 2 so the layout fills the screen.

Alternatively, point the TV at the frontend's `/dashboard/<profileId>` with the venue set to
dashboard type 2. That is the currently supported path.
