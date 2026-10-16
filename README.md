# SportsIQ

SportsIQ is a live sports engagement platform for bars and venues. Patrons join in-venue games
(trivia, live predictions, bingo) from their phones while a bar TV screen shows questions,
results and leaderboards in real time. Venue staff manage games, contests and prizes from a web
dashboard.

## Repository layout

| Directory | What it is | Stack |
|---|---|---|
| [`sportsiq-backend/`](sportsiq-backend) | REST API, Socket.IO game server, sports data pollers and background workers | Node 20, Express 5, Socket.IO, Supabase, Twilio, Anthropic SDK |
| [`sportsiq-frontend/`](sportsiq-frontend) | Web dashboard: venue management, contest dashboards, embedded bar screen, browser play (`/play`) | React 19, Vite, Tailwind 4, Zustand |
| [`sportsiq-mobile/`](sportsiq-mobile) | Player app: phone sign-in, trivia, predictions, leaderboards, QR join | Expo 54, React Native, Expo Router, NativeWind |
| [`sportsiq-barscreen/`](sportsiq-barscreen) | Standalone 1920×1080 TV display for venues | React 18, Vite, Tailwind 3 |
| [`sportsiq-mockups/`](sportsiq-mockups) | Static product mockups / design review site (GitHub Pages + Vercel API) | HTML, Node |

## Architecture

```
            ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
            │  mobile app  │   │   frontend   │   │  barscreen   │
            └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
         REST /v1  │  Socket.IO/trivia│                  │
                   ▼                  ▼                  ▼
   ┌───────────────────────┐   ┌──────────────────────────────┐
   │ API  (src/server.ts)  │   │ Socket server (socketServer) │
   └───────────┬───────────┘   └──────────────┬───────────────┘
               │                              │
               ▼                              ▼
        ┌─────────────┐   ◄── pollers (NBA/NFL/NHL/CBB/MLB, SportsData.io)
        │  Supabase   │   ◄── contest worker, predictor worker
        │ (Postgres)  │   ◄── trivia worker (question generation via Claude)
        └─────────────┘
```

The backend is a single codebase with several entry points. Each one is deployed as its own
Cloud Run service by `sportsiq-backend/cloudbuild.yaml`:

| Entry point | Purpose | Dev script |
|---|---|---|
| `src/server.ts` | REST API under `/v1/*` | `npm run dev` |
| `src/socketServer.ts` | Socket.IO trivia and private game rooms | `npm run dev:socket` |
| `src/poller{NBA,NFL,NHL,CBB,MLB}.ts` | Poll live game data from SportsData.io | `npm run dev:poller:nba` … |
| `src/contestWorker.ts` | Advances contests on quarter end and start | `npm run dev:worker` |
| `src/predictorWorker.ts` | Generates and resolves prediction questions | `npm run dev:worker:predictor` |
| `src/triviaWorker.ts` | Generates trivia questions | `npm run dev:worker:trivia` |

## Getting started

Requirements: Node.js 20+, npm, and a Supabase project. You also need Twilio, SportsData.io and
Anthropic API keys for the related features.

### Backend

```bash
cd sportsiq-backend
npm install
# create .env (see below)
npm run dev          # API on :8080
npm run dev:socket   # Socket server on :8082
```

`.env` keys: `URL`, `PORT`, `FRONTEND_URL`, `SPORTSDATA_API_URL`, `SPORTSDATA_API_VERSION`,
`SPORTSDATA_API_KEY`, `SUPABASE_URL`, `SUPABASE_API_SECRET_KEY`, `TWILIO_ACCOUNT_SID`,
`TWILIO_AUTH_TOKEN`, `TWILIO_SERVICE_SID`, `TWILIO_FROM_NUMBER`, `ANTHROPIC_AI_KEY`,
`DEFAULT_PROFILE_PASSWORD` (initial password for admin-created venue accounts).

### Frontend

```bash
cd sportsiq-frontend
npm install
# .env: VITE_BACKEND_URL, VITE_SOCKET_URL, VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev          # http://localhost:5173
```

### Mobile

```bash
cd sportsiq-mobile
npm install
# .env: EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_SOCKET_URL
# .env.local (gitignored, optional): EXPO_PUBLIC_REVIEW_PHONE, EXPO_PUBLIC_REVIEW_OTP,
#   EXPO_PUBLIC_TEST_PHONES (comma-separated) for the App Store review / test login
npx expo start
```

### Bar screen

```bash
cd sportsiq-barscreen
npm install
# .env: VITE_BACKEND_URL, VITE_SOCKET_URL, VITE_BAR_TOKEN (optional)
npm run dev          # open with ?bar=<barId>&token=<token>
```

### Mockups

```bash
cd sportsiq-mockups
node server.js       # http://localhost:3456
```

## Deployment

- **Backend:** Google Cloud Build → Cloud Run (`cloudbuild.yaml`). Each service is suffixed with
  the branch name.
- **Frontend:** Vercel (`vercel.json`).
- **Mobile:** EAS / Xcode release builds.
- **Mockups:** GitHub Pages via `.github/workflows/deploy.yml`.

## Secrets

Never commit `.env` files with real keys, App Store credentials, keystores or signing
certificates. They are excluded by the root and per-project `.gitignore` files.
