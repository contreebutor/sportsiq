# SportsIQ Frontend

The SportsIQ web app. One Vite + React single-page app that serves several kinds of users:

| Audience | Where | What they get |
|---|---|---|
| **Venue TVs** | `/dashboard/:profileId` | Full-screen 1920×1080 sports dashboard, contest dashboard or bar screen |
| **Venue staff and admins** | `/signin` → `/manage` | Management panel for profiles, contests, prizes, points, games |
| **Patrons on their phone** (contest QR codes) | `/submit-predictions/:id`, `/submit-bingo-cards/:id`, `/contest-winner/:id` | Enter a contest, verify by SMS, redeem a prize |
| **Players without the app** | `/play/*` | Browser version of live trivia |

**Stack:** React 19, TypeScript, Vite 7, Tailwind CSS 4 (`@tailwindcss/vite`), React Router 7,
Zustand, Supabase JS (auth), Socket.IO client, Luxon, react-toastify. Deployed on Vercel.

---

## Getting started

Requirements: Node.js 20+ and a running [backend](../sportsiq-backend) (REST API and, for live
games, the socket server).

```bash
cd sportsiq-frontend
npm install
# create .env (see below)
npm run dev            # http://localhost:5173
```

### Environment variables

Create `.env` (or `.env.local`) in this folder. It is gitignored. All variables must start with
`VITE_`, and the dev server must be restarted after you change them.

| Variable | Description | Local example |
|---|---|---|
| `VITE_BACKEND_URL` | Backend REST base URL (no `/v1` suffix, the services add it) | `http://localhost:8080` |
| `VITE_SOCKET_URL` | Backend Socket.IO server | `http://localhost:8082` |
| `VITE_SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon / publishable key (safe for browsers) | `eyJ…` |

### Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |

There is no test suite. Run `npm run build` and `npm run lint` before you push.

---

## Routes

Defined in `src/App.tsx`.

| Path | Page | Auth | Notes |
|---|---|---|---|
| `/signin` | `SignInPage` | public | Supabase email/password sign-in |
| `/manage` | `ManagementPage` | **protected** | Redirects to `/signin` when there's no session |
| `/dashboard/:id` | `DashboardPage` | public | `:id` = venue profile ID. Rendered on a fixed 1920×1080 canvas |
| `/submit-predictions/:id` | `SubmitPredictionsPage` | public | Predictor contest entry (mobile layout) |
| `/submit-bingo-cards/:id` | `SubmitBingoCardsPage` | public | Bingo contest entry |
| `/contest-winner/:id` | `ContestWinnerPage` | public | Winner prize redemption |
| `/team-game-stats` | `TeamGameStatsPage` | public | Internal view of live team stats for all five sports |
| `/delete-account` | `DeleteAccountPage` | public | Account deletion page (needed for app store listings) |
| `/play` | `webPlay/LandingPage` | public | Web trivia landing page |
| `/play/signin` → `/play/verify` | phone + OTP | public | Sign in by SMS code |
| `/play/profile` | `webPlay/ProfilePage` | player | Set name and avatar |
| `/play/trivia` | `webPlay/TriviaPage` | player | Live trivia over Socket.IO |
| `*` | → `/not-found` | | |

`vercel.json` rewrites every path to `/` so client-side routing works on deep links.

---

## Key features

### Venue dashboard (`/dashboard/:id`)

`DashboardPage` polls the venue's dashboard settings every 10 s and today's contest every 10 s
while a contest is active (60 s otherwise), then picks what to show:

1. **`contest_dashboard_type === 2`** and contest enabled → the **Bar Screen**
   (`components/Dashboard/Barscreen/`): live trivia, predictions and leaderboards over Socket.IO.
2. Contest enabled and the contest game is `Scheduled` or `InProgress` → the **contest
   dashboard** (`components/Dashboard/Contest/`) with pre-game and live views.
3. Otherwise → the **general dashboard** (`components/Dashboard/General/`): rotating game cards
   with scores, odds, betting splits and probabilities.

The page is laid out at 1920×1080 and scaled to fit the window (CSS `zoom` on Chromium/WebKit,
`transform: scale` on Firefox). See the effect in `App.tsx`.

> `components/Dashboard/Barscreen/` is a copy of the standalone
> [`sportsiq-barscreen`](../sportsiq-barscreen) app and is currently the **more up-to-date** of
> the two: it uses the real `/trivia` events and the `/v1/barscreen/*` endpoints. When you change
> a shared screen, update both copies.

### Management panel (`/manage`)

`components/Management/ManagePanel.tsx` renders a sidebar of tabs. Which tabs appear depends on
`profile.isAdmin`:

| Tab | Who | Component | Purpose |
|---|---|---|---|
| Users / Profile | all | `Profile/AdminPanel` or `Profile/UserPanel` | Admins manage all venue profiles (create, roles, dashboard type, rotation). Venues edit their own view settings |
| Contests | admin | `Contest/ContestManagePanel` | Calendar of upcoming games; enable a game as a predictor or bingo contest; configure categories |
| Prizes | all | `PrizeManagePanel` | Default prizes per contest type |
| Points | admin | `SportsIQPointsManagePanel` | Default SportsIQ points awarded |
| Games | admin | `GameManagePanel` | Featured games for the general dashboard |
| Mobile Games | admin | `Mobile/MobileGameManagePanel` | Which games and predictors appear in the mobile app |
| Bar Screen | admin | link | Opens the design mockups site |

### Contest entry (patron phones)

Patrons scan a QR code on the venue TV and land on `/submit-predictions/:id` or
`/submit-bingo-cards/:id`. The flow is: make picks → enter nickname and phone →
`POST /v1/phone/create-otp` → verify code → `POST /v1/contest/register-predictions` (or fetch
bingo cards). Winners get an SMS link to `/contest-winner/:id`, which calls
`POST /v1/contest/redeem-winner`.

### Web Play (`/play`)

`src/webPlay/` is a self-contained mini app that mirrors the mobile trivia experience in the
browser: phone + OTP sign-in, profile setup, and the live `/trivia` Socket.IO game. Its state
lives in a persisted Zustand store (`webPlay/store.ts`, `localStorage`). Socket event types are
in `webPlay/types.ts` and must stay in sync with the backend and mobile app.

---

## Project structure

```
src/
├── App.tsx                 # routes + 1920×1080 dashboard scaling
├── main.tsx                # React root, BrowserRouter
├── index.css               # Tailwind entry + global styles
├── pages/                  # route-level pages (see table above)
│   └── contest/            # bingo entry page and header
├── components/
│   ├── Dashboard/
│   │   ├── General/        # non-contest rotating dashboard
│   │   ├── Contest/        # PreGame / LiveGame / FinalGame contest views
│   │   ├── Common/         # cards shared between dashboards
│   │   └── Barscreen/      # bar screen (mirror of sportsiq-barscreen/src)
│   ├── Management/         # /manage panels (Profile, Contest, Mobile, prizes, points, games)
│   ├── SubmitPredictions/  # predictor entry steps
│   ├── ProtectedRoute.tsx  # Supabase session guard
│   └── StyledDefault/, Wrapper/  # shared UI primitives
├── webPlay/                # /play browser trivia app (pages, socket, store, types)
├── services/               # REST clients: contest, game, manage, phone, teamGameStats
├── store/                  # Zustand: userStore, contestStore
├── hooks/useAuth.tsx       # Supabase auth session + profile
├── lib/                    # supabase client, cn() class helper, utils
├── types/                  # contests.ts, general.ts
└── data/data.ts            # static data and fixtures
```

### Talking to the backend

- **REST:** every call lives in `src/services/*.ts` (and `webPlay/api.ts`) and uses
  `fetch(`${import.meta.env.VITE_BACKEND_URL}/v1/...`)`. Add new endpoints there rather than
  calling `fetch` from components.
- **Socket.IO:** `webPlay/socket.ts` and `components/Dashboard/Barscreen/lib/socket.ts` connect
  to `${VITE_SOCKET_URL}/trivia`.
- **Supabase:** used directly only for authentication (`lib/supabase.ts`, `hooks/useAuth.tsx`).
  Data reads and writes go through the backend.

---

## Deployment

Hosted on **Vercel**. The build command is `npm run build` and the output directory is `dist/`.
Set the four `VITE_*` variables in the Vercel project for each environment. Vite inlines them at
build time, so you must redeploy after changing them.

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Env values are `undefined` | Name starts with `VITE_`? Dev server restarted? |
| `/manage` keeps bouncing to `/signin` | Supabase URL/key correct, and the user has a row in `profiles` |
| Dashboard is blank or stuck | Is `:id` a valid profile ID? Is the API reachable at `VITE_BACKEND_URL`? |
| Bar screen or trivia never updates | Socket server running at `VITE_SOCKET_URL`? Look for the `/trivia` websocket in the Network tab |
| Deep link 404 on Vercel | `vercel.json` rewrite still present? |
