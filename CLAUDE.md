# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Overview

A monorepo with five independent npm projects. There is no root `package.json` or workspace
tooling, so always `cd` into a project before running npm commands.

- `sportsiq-backend/`: Express 5 + Socket.IO + Supabase, written in TypeScript (CommonJS, `tsc` → `dist/`)
- `sportsiq-frontend/`: React 19 + Vite + Tailwind 4 + Zustand
- `sportsiq-mobile/`: Expo 54 / React Native, Expo Router (file-based routes in `app/`), NativeWind
- `sportsiq-barscreen/`: React 18 + Vite TV display, authored at 1920×1080
- `sportsiq-mockups/`: static HTML mockups. `index.html` is about 3.5 MB, so never read it whole

## Commands

| Project | Dev | Build / check |
|---|---|---|
| backend | `npm run dev` (API), `npm run dev:socket`, `npm run dev:poller:<sport>`, `npm run dev:worker[:predictor\|:trivia]` | `npm run build` |
| frontend | `npm run dev` | `npm run build`, `npm run lint` |
| mobile | `npx expo start` | `npm run lint`, `npx tsc --noEmit` |
| barscreen | `npm run dev` | `npm run build` |

There is no test suite. Check changes by type-checking (`npx tsc --noEmit`) or building.

## Backend structure

- Layering: `routes/` → `controllers/` → `services/` → `utils/supabase.ts`. Put business logic in
  services. Controllers only parse the request and shape the response.
- All REST routes are mounted under `/v1/<area>` in `src/app.ts` (`manage`, `auth`, `contest`,
  `phone`, `mobile`, `barscreen`, `join`, `play`).
- Each top-level `src/*.ts` file is a separate deployable process (API, socket server, pollers,
  workers). Each worker exposes `/healthz` and starts its loop from a service function.
- Real-time games live in `src/socket/`. `triviaGame.ts` (`TriviaGameManager`) and
  `privateGame.ts` share the `/trivia` namespace.
- Sport pollers (`services/{nba,nfl,nhl,cbb,mlb}Service.ts`) follow the same pattern. When you
  change one, check whether the others need the same change.
- `services/contestService.ts` is very large (~5k lines). Search it with grep; don't read it whole.
- Config comes from `src/config.ts`, which reads env vars. When you add an env var, also add it
  to `cloudbuild.yaml` for every service that needs it.

## Clients

- Clients reach the backend through `VITE_BACKEND_URL` / `EXPO_PUBLIC_API_BASE_URL` (REST, `/v1`)
  and `VITE_SOCKET_URL` / `EXPO_PUBLIC_SOCKET_URL` (Socket.IO).
- The frontend has a copy of the bar screen in `src/components/Dashboard/Barscreen/`, mirroring
  `sportsiq-barscreen/src/`. Keep the two in sync when you change shared screens.
- Shared socket event shapes are duplicated in each client's `types.ts` / `triviaTypes.ts`. Update
  every copy when an event payload changes.

## Conventions

- TypeScript everywhere, with 2-space indentation and double quotes in backend, frontend and mobile.
- Commit messages use a conventional-commit style: `feat:`, `fix:`, `refactor:`, `chore:`,
  `docs:`, with an optional scope such as `feat(backend): ...`.
- Never hardcode passwords, OTP codes or tokens. Read them from env (`config.ts` /
  `EXPO_PUBLIC_*` in `.env.local`).
- Never commit `.env*` files containing secrets, `App Store Credentials/`, `*.keystore`,
  `*.key`, or `.claude/settings.local.json`.
