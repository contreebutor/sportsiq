# SportsIQ Backend

The server side of SportsIQ. One TypeScript codebase that builds into **several independent
processes**: a REST API, a Socket.IO game server, five sports data pollers and three background
workers. All of them share Supabase (Postgres) as the system of record.

- **Runtime:** Node.js 20, TypeScript compiled to CommonJS (`tsc` → `dist/`)
- **HTTP:** Express 5
- **Real-time:** Socket.IO 4
- **Data:** Supabase (`@supabase/supabase-js`, service-role key)
- **External services:** SportsData.io (live game data and odds), Twilio Verify (phone OTP and SMS),
  Anthropic Claude (trivia question generation)
- **Deploy:** Docker image → Google Cloud Run via Cloud Build (`cloudbuild.yaml`)

---

## Contents

1. [Processes](#processes)
2. [Getting started](#getting-started)
3. [Environment variables](#environment-variables)
4. [Project layout](#project-layout)
5. [REST API](#rest-api)
6. [Socket.IO game server](#socketio-game-server)
7. [Pollers and workers](#pollers-and-workers)
8. [Database](#database)
9. [Deployment](#deployment)
10. [Development notes](#development-notes)

---

## Processes

Every top-level file in `src/` is its own entry point and is deployed as a separate Cloud Run
service. They don't talk to each other directly; they coordinate through Supabase.

| Entry point | What it does | Dev script | Default dev port |
|---|---|---|---|
| `src/server.ts` | REST API, all routes under `/v1/*` | `npm run dev` | 8080 |
| `src/socketServer.ts` | Socket.IO server (`/trivia` namespace) and `GET /game/status` | `npm run dev:socket` | 8082 |
| `src/pollerNBA.ts` | Polls NBA data from SportsData.io | `npm run dev:poller:nba` | 8080 |
| `src/pollerNFL.ts` | Polls NFL data | `npm run dev:poller:nfl` | 8080 |
| `src/pollerNHL.ts` | Polls NHL data | `npm run dev:poller:nhl` | 8080 |
| `src/pollerCBB.ts` | Polls college basketball data | `npm run dev:poller:cbb` | 8080 |
| `src/pollerMLB.ts` | Polls MLB data | `npm run dev:poller:mlb` | 8080 |
| `src/contestWorker.ts` | Watches the active contest game and handles quarter end and start | `npm run dev:worker` | 8080 |
| `src/predictorWorker.ts` | Auto-resolves featured-game predictions every 5 s | `npm run dev:worker:predictor` | 8083 |
| `src/triviaWorker.ts` | Generates trivia questions with Claude once a day | `npm run dev:worker:trivia` | 8084 |

Pollers and workers each run a tiny Express server that only exposes `GET /healthz` (so Cloud
Run can health-check them), then start their loop.

> Pollers and the contest worker default to port 8080, the same as the API. To run one alongside
> the API locally, override the port, e.g. `PORT=8090 npm run dev:poller:nba`.

---

## Getting started

Requirements: Node.js 20+, npm, and access to a Supabase project. Twilio, SportsData.io and
Anthropic keys are only needed for the features that use them.

```bash
cd sportsiq-backend
npm install
cp /dev/null .env        # then fill in the variables below
npm run dev              # REST API on http://localhost:8080
npm run dev:socket       # Socket server on http://localhost:8082
```

Quick check that the API is up:

```bash
curl http://localhost:8080/v1/manage/get-today
```

Production build:

```bash
npm run build            # compiles src/ → dist/
npm start                # node dist/server.js
npm run start:socket     # node dist/socketServer.js (and start:poller:*, start:worker:*)
```

There is no test suite. Validate changes with `npm run build` (or `npx tsc --noEmit`).

---

## Environment variables

All configuration is read in `src/config.ts`, which loads `.env` via `dotenv`. Never commit
`.env`. Never hardcode secrets anywhere else in the code.

| Variable | Used by | Description |
|---|---|---|
| `URL` | all | Base URL, only used in startup log lines (default `http://localhost`) |
| `PORT` | all | Listen port (default `8080`) |
| `FRONTEND_URL` | API | Web dashboard URL, used in generated links (default `http://localhost:5173`) |
| `SPORTSDATA_API_URL` | pollers, API | SportsData.io base URL |
| `SPORTSDATA_API_VERSION` | pollers, API | API version segment (default `v3`) |
| `SPORTSDATA_API_KEY` | pollers, API | SportsData.io subscription key |
| `SUPABASE_URL` | all | Supabase project URL |
| `SUPABASE_API_SECRET_KEY` | all | Supabase **service-role** key (bypasses RLS, server-only) |
| `TWILIO_ACCOUNT_SID` | API | Twilio account |
| `TWILIO_AUTH_TOKEN` | API | Twilio auth token |
| `TWILIO_SERVICE_SID` | API | Twilio Verify service, used for OTP |
| `TWILIO_FROM_NUMBER` | API | Sender number for outbound SMS |
| `ANTHROPIC_AI_KEY` | trivia worker | Anthropic API key for question generation |
| `DEFAULT_PROFILE_PASSWORD` | API | Initial password for venue accounts created by an admin |

When you add a variable, add it to `config.ts` **and** to the `--set-env-vars` block of every
service in `cloudbuild.yaml` that needs it.

---

## Project layout

```
src/
├── server.ts, socketServer.ts,      # process entry points (see "Processes")
│   poller*.ts, *Worker.ts
├── app.ts                           # Express app: CORS, JSON body, mounts /v1/* routers
├── config.ts                        # env → typed config object
├── types.ts                         # shared types (SportsData payloads, Supabase rows)
├── routes/                          # Express routers: URL → controller
├── controllers/                     # parse request, call service, shape response
├── services/                        # business logic and all Supabase / third-party calls
│   ├── contestService.ts            # contests, predictors, bingo, prizes (~5k lines)
│   ├── {nba,nfl,nhl,cbb,mlb}Service.ts  # sport pollers (same structure each)
│   ├── generalService.ts            # shared upserts, points, trivia question lookup
│   ├── picksService.ts              # featured-game picks, leaderboards
│   ├── mobileService.ts             # mobile users, avatars (Supabase Storage)
│   ├── manageService.ts             # venue profiles and dashboard settings
│   ├── predictorWorkerService.ts    # auto-resolution loop
│   ├── triviaGenerationService.ts   # Claude question generation and rotation
│   ├── twilioService.ts, authService.ts
├── socket/
│   ├── index.ts                     # creates Socket.IO server, wires managers
│   ├── triviaGame.ts                # TriviaGameManager: scheduled public games
│   └── privateGame.ts               # PrivateGameManager: room-code games
└── utils/
    ├── supabase.ts                  # Supabase client singleton
    ├── probabilities.ts             # win-probability helpers
    └── webGameHTML.ts               # HTML templates for /v1/play pages
```

**Layering rule:** `routes/` → `controllers/` → `services/` → `utils/supabase.ts`. Business logic
belongs in services. Controllers only read the request and format the response.

`contestService.ts` is very large. Search it with grep instead of scrolling through it.

---

## REST API

All routes are mounted in `src/app.ts`. Most endpoints take a JSON body (POST) or query string
(GET) and return `{ data }` or `{ message }`.

| Prefix | Router | Purpose | Main consumers |
|---|---|---|---|
| `/v1/auth` | `authRoute.ts` | Venue account sign-up (`POST /signup`) | frontend |
| `/v1/manage` | `manageRoute.ts` | Venue profiles, dashboard settings, featured games, mobile game toggles, password reset | frontend `/manage` |
| `/v1/contest` | `contestRoute.ts` | Predictor and bingo contests: create, fetch pre-game/live, register predictions, bingo cards, winners and redemption, default prizes and points, SportsIQ/bar points | frontend, mobile |
| `/v1/phone` | `twilioRoute.ts` | `create-otp`, `verify-otp`, `needs-otp`, `send-sms` | frontend, mobile |
| `/v1/mobile` | `mobileRoute.ts` | Mobile users (create, fetch, update, delete, avatar upload, tier, stats, point transfer), picks (featured game, submit, resolve), leaderboards (`global`, `bar`, `today`) | mobile, frontend `/play` |
| `/v1/barscreen` | `barscreenRoute.ts` | Bar screen state, last-game leaderboard, featured predictions | bar screen (frontend copy) |
| `/v1/join` | `joinRoute.ts` | `GET /contest/:type/:id`: HTML page that deep-links into the app (`sportsiqmobile://…`) or falls back to the store listing | QR codes |
| `/v1/play` | `webGameRoute.ts` | `GET /predictor/:id`, `GET /bingo/:id`: server-rendered web game pages | browsers without the app |

For the exact request and response shapes, read the matching controller in `src/controllers/`.

---

## Socket.IO game server

`socketServer.ts` starts a plain HTTP server with a single REST endpoint,
`GET /game/status` (current trivia game state for "Live Now" UIs), and attaches Socket.IO.

All games share the **`/trivia`** namespace:

- **`TriviaGameManager`** (`socket/triviaGame.ts`) runs public games automatically on a fixed
  schedule. A game starts on every 5-minute wall-clock mark (`:00`, `:05`, …) and has 10
  questions. Each question is open for 15 s and its result shows for 7 s. A player who drops has
  a 30 s grace period to reconnect. Points are written back to Supabase when the game ends.
- **`PrivateGameManager`** (`socket/privateGame.ts`) runs host-created rooms, joined by room code.

| Direction | Event | Notes |
|---|---|---|
| client → server | `trivia:join-game`, `trivia:answer` | public game |
| client → server | `trivia:start_private`, `trivia:answer_private`, `trivia:leave_private` | private rooms |
| server → client | `trivia:lobby`, `trivia:loading`, `trivia:question`, `trivia:selections`, `trivia:answer_counts`, `trivia:result`, `trivia:game-end`, `trivia:game-status`, `trivia:playerCount` | game flow |
| server → client | `trivia:leaderboard`, `trivia:nightly_leaderboard`, `trivia:last-game-leaderboard`, `trivia:my_rank`, `trivia:ghost_rank`, `trivia:streak`, `trivia:comeback` | standings and engagement |
| server → client | `trivia:private_created`, `trivia:private_lobby`, `trivia:private_error` | private rooms |

Event payload types are duplicated in each client (`sportsiq-mobile/lib/triviaTypes.ts`,
`sportsiq-frontend/src/webPlay/types.ts`, bar screen `types.ts`). **When you change a payload,
update every copy.**

---

## Pollers and workers

### Sport pollers (`services/{nba,nfl,nhl,cbb,mlb}Service.ts`)

Each poller runs an endless loop that ticks once per second. A tick counter staggers the
SportsData.io calls: today's games, live odds and team game stats every second; pre-game odds every
minute; betting splits every 15 minutes; cleanup of old and canceled games hourly; and the season,
team profiles, season stats and upcoming week's schedule once a day. It keeps the previous snapshot in memory and **only upserts rows that changed**, into
`general_games`, `general_games_upcoming`, `general_pre_game_odds`, `general_live_game_odds`,
`general_betting_splits`, `general_probabilities`, `team_game_stats_<sport>` and similar tables.

All five pollers share the same structure. If you change one, check whether the others need the
same change.

### Contest worker (`contestWorker.ts`)

Runs `handleContestGameQuarterEndAndStart()` in `contestService.ts`. It watches the current
contest game and, when the quarter or period changes, processes the quarter that just ended
(`processBingoQuarterEnd` / `processPredictorQuarterEnd`) and then handles the start of the
next one.

### Predictor worker (`predictorWorker.ts`)

Every 5 seconds it looks for featured games that have gone final, reads the final team stats from
`team_game_stats_<sport>`, decides each prediction's answer, and calls `resolveGame()` in
`picksService.ts` to award points.

### Trivia worker (`triviaWorker.ts`)

Checks hourly. If questions haven't been generated today, it asks Claude for 50 new questions,
using a weighted category mix (Sports 40%, TV & Movies 30%, Music 10%, Pop Culture 10%, Food &
Brands 5%, Fun Facts 5%) and difficulty tiers 2–4. It then rotates them into `trivia_questions`,
capped at 750 questions. Questions with at least 20 plays are calibrated against a 65–75% correct
"sweet spot", and those outside it are rotated out first.

---

## Database

Supabase Postgres is the only shared state. The schema isn't kept in this repo, so look in the
Supabase dashboard for migrations. Main table groups:

| Group | Tables / views |
|---|---|
| Venue accounts | `profiles` |
| Sports data | `general_games`, `general_games_upcoming`, `general_team_profiles`, `general_team_season_stats`, `general_*_odds`, `general_betting_splits`, `general_probabilities`, `team_game_stats_{nba,nfl,nhl,cbb,mlb}` |
| Contests | `abstract_contests`, `contests`, `contest_predictors`, `contest_bingos`, `contest_bingo_cards`, `contest_predictions`, `contest_users`, `contest_winners`, `contest_prizes`, `default_contest_prizes`, many `view_contest_*` views |
| Mobile | `m_users`, `m_games`, `m_featured_games`, `m_user_picks` |
| Points | `points_sportsiq`, `points_bar`, `default_contest_points_sportsiq` |
| Trivia | `trivia_questions` |

Avatars are stored in the Supabase Storage bucket `sportsiq_mobile`.

---

## Deployment

`cloudbuild.yaml` builds a single Docker image (`Dockerfile`: multi-stage, `node:20-slim`,
runs as a non-root user under `dumb-init`) and deploys it to **Cloud Run in `us-east1`** once per
process. Each service overrides the container args (e.g. `--args dist/pollerNBA.js`).

- Service names are suffixed with the branch: `sportsiq-backend-$BRANCH_NAME`,
  `sportsiq-backend-poller-nba-$BRANCH_NAME`, and so on.
- The API is public (`--allow-unauthenticated`) and autoscales.
- Pollers and workers run with `min-instances=1`, `max-instances=1` and `--no-cpu-throttling`,
  because they are long-running loops and must never run twice at once.
- The socket server also runs as a single instance, since game state lives in memory.
- Secrets are passed as Cloud Build substitutions (`_SUPABASE_URL`, `_TWILIO_AUTH_TOKEN`, …).

---

## Development notes

- **CORS:** the API currently allows all origins (`app.use(cors())`). The `corsOptions`
  allow-list in `app.ts` is defined but not applied.
- **Time zones:** dates are handled with Luxon. "Today" for schedules comes from `getToday()` in
  `generalService.ts`.
- **Single-instance assumption:** trivia and private game state is in memory, so scaling the
  socket service horizontally would need a Socket.IO adapter (e.g. Redis) first.
