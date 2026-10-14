# SportsIQ Mobile

The SportsIQ player app for iOS and Android. Patrons sign in with their phone number, play live
bar trivia, make picks on featured games, enter venue contests by scanning a QR code, and climb
global, bar and nightly leaderboards with their **IQ points**.

- **Store listings:** [App Store](https://apps.apple.com/us/app/sports-iq/id6759401599) ·
  [Google Play](https://play.google.com/store/apps/details?id=com.lumeniq.sportsiq)
- **Stack:** Expo SDK 54, React Native 0.81 (New Architecture), Expo Router 6 (file-based
  routing, typed routes), NativeWind 4 (Tailwind for RN), Zustand, Socket.IO client,
  `expo-secure-store`, `expo-camera`, `expo-image-picker`, React Compiler enabled
- **Identifiers:** iOS `com.lumeniq.sportsiqios` · Android `com.lumeniq.sportsiq` · URL scheme
  `sportsiqmobile://`

---

## Getting started

Requirements: Node.js 20+, npm, and either Xcode (iOS simulator), Android Studio (emulator) or
the Expo Go app on a device. You also need a running [backend](../sportsiq-backend) (REST API
and socket server), or you can point the app at a deployed one.

```bash
cd sportsiq-mobile
npm install
npx expo start          # then press i (iOS), a (Android), or scan the QR with Expo Go
```

Native builds (they generate the `ios/` and `android/` folders, which are not committed):

```bash
npm run ios             # expo run:ios
npm run android         # expo run:android
```

### Environment variables

Expo inlines any variable prefixed `EXPO_PUBLIC_` into the JS bundle at build time. **Never put a
secret in one.** Restart `expo start` (with `-c` to clear the cache) after you change them.

| Variable | File | Description |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `.env` / `.env.production` | Backend REST base **including** `/v1`, e.g. `http://localhost:8080/v1` |
| `EXPO_PUBLIC_SOCKET_URL` | `.env` / `.env.production` | Socket.IO server, e.g. `http://localhost:8082` |
| `EXPO_PUBLIC_REVIEW_PHONE` | `.env.local` | Optional. Phone number used by App Store / Play reviewers |
| `EXPO_PUBLIC_REVIEW_OTP` | `.env.local` | Optional. Fixed OTP accepted for the review and test phones |
| `EXPO_PUBLIC_TEST_PHONES` | `.env.local` | Optional. Comma-separated test phone numbers that skip real SMS |

`.env` and `.env.production` are committed and hold only public URLs. `.env*.local` is gitignored
and is where the review/test login values belong. Defaults live in `config.ts`.

> **Testing on a physical device:** `localhost` points at the phone, not your computer. Use your
> machine's LAN IP (e.g. `http://192.168.1.20:8080/v1`) or a deployed backend.
>
> **Port clash:** if `EXPO_PUBLIC_SOCKET_URL` is unset, `config.ts` falls back to port `8081`,
> which is also Metro's port. Always set it explicitly (the backend's `dev:socket` uses `8082`).

### Checks

```bash
npm run lint            # expo lint (ESLint)
npx tsc --noEmit        # type-check
```

There is no test suite.

---

## App flow

```
app/index.tsx ── waits for the secure-store user to load
     │
     ├─ no phone saved ──► enter-phone ──► verify-phone (Twilio OTP) ──► create-profile (new user)
     │
     └─ phone saved ─────► (app)/(tabs)  main screen
                              ├─ Play          live trivia (Socket.IO /trivia)
                              ├─ Predictions   featured-game picks
                              └─ Leaderboard   global · bar · today
                           (app)/scan                       QR scanner → contest entry
                           (app)/submit-predictions/[id]    predictor contest
                           (app)/submit-bingo-cards/[id]    bingo contest
                           (app)/edit-profile               name and avatar
                           (app)/transfer-points            send IQ points to another player
```

- **Auth** is phone-only. `lib/api.ts` → `needsOtp` / `createOtp` / `verifyOtp` call
  `/v1/phone/*`. The verified phone is saved in `expo-secure-store` (`store/user.ts`), and the
  user record is fetched from `/v1/mobile/user/fetch`.
- **Main screen** (`app/(app)/(tabs)/index.tsx`) is a three-page horizontal pager. Tapping the IQ
  chip in the header opens `SettingsModal` (edit profile, log out, delete account).
- **QR scanning** (`app/(app)/scan.tsx`) accepts either `sportsiqmobile://submit-predictions/{id}`
  or a web URL `https://…/submit-predictions/{id}` (and the same for `submit-bingo-cards`), then
  routes to the matching contest screen.
- **Contest user IDs** are cached per contest in secure storage (`lib/contestStorage.ts`), so a
  returning patron isn't asked to re-register.

### Live trivia

`components/TriviaGame/` connects to `${EXPO_PUBLIC_SOCKET_URL}/trivia` through `lib/socket.ts`
and drives the lobby → question → result → game-end screens with the `useTriviaSocket` hook.
Public games start automatically every 5 minutes on the server. Event payload types are in
`lib/triviaTypes.ts`. **Keep them in sync** with `sportsiq-backend/src/socket/` and the frontend's
`webPlay/types.ts`.

---

## Project structure

```
app/                         # Expo Router routes (file name = URL)
├── _layout.tsx              # root Stack, hydrates user store
├── index.tsx                # auth gate / redirect
├── enter-phone.tsx, verify-phone.tsx
└── (app)/                   # signed-in area
    ├── _layout.tsx          # Stack for signed-in screens
    ├── (tabs)/index.tsx     # main pager: Play · Predictions · Leaderboard
    ├── create-profile.tsx, edit-profile.tsx, transfer-points.tsx, scan.tsx
    ├── submit-predictions/[id].tsx
    └── submit-bingo-cards/[id].tsx
components/
├── TriviaGame/              # Lobby, Question, GameEnd, ObserverModal, useTriviaSocket
├── Predictions/             # featured-game picks UI
├── screens/                 # PlayScreen, LeaderboardScreen
├── SettingsModal.tsx, PreGameHeader.tsx, DualRadial.tsx, CustomImg.tsx
└── LiveNowScreen.tsx, PrivateChallenge.tsx   # built, not yet mounted in a route
lib/
├── api.ts                   # REST: auth/OTP, user, picks, leaderboards, avatars
├── contestApi.ts            # REST: predictor and bingo contests, points
├── contestStorage.ts        # per-contest user IDs in secure storage
├── socket.ts                # Socket.IO singleton for /trivia
└── triviaTypes.ts           # socket event payload types
store/user.ts                # Zustand user store backed by expo-secure-store
hooks/useAuthUser.ts         # loads/refreshes the current user
constants/colors.ts          # brand palette
config.ts                    # API and socket URLs from env
assets/                      # icons, splash, images
global.css, tailwind.config.js, metro.config.js, babel.config.js   # NativeWind setup
```

Path alias: `@/` maps to the project root (see `tsconfig.json`).

---

## Styling

NativeWind lets you use Tailwind classes via `className` on React Native components.
`global.css` is the Tailwind entry, `metro.config.js` wraps Metro with `withNativeWind`, and
`nativewind-env.d.ts` adds the types. Shared colors are in `constants/colors.ts` (dark slate
background `bgDark: #0f172a`, plus blue, yellow and muted greys).

---

## Releasing

There is no `eas.json` in the repo yet. Release builds are produced locally:

1. Bump `expo.version` in `app.json` (and the native build number when the store requires it).
2. Make sure `.env.production` points at the production backend.
3. `npx expo prebuild` and then build and archive in Xcode / Android Studio, or set up EAS
   (`npx eas build`).
4. For store review, put the reviewer phone and OTP in `.env.local`
   (`EXPO_PUBLIC_REVIEW_PHONE`, `EXPO_PUBLIC_REVIEW_OTP`). Never commit them.

Never commit signing material (`*.keystore`, `*.key`, `App Store Credentials/`).

---

## Troubleshooting

| Symptom | Check |
|---|---|
| Network request failed | `EXPO_PUBLIC_API_BASE_URL` reachable from the device (LAN IP, not `localhost`), and it includes `/v1` |
| Trivia stuck on "connecting" | Socket server running? `EXPO_PUBLIC_SOCKET_URL` set and not `:8081`? |
| Env change has no effect | Restart with `npx expo start -c` |
| Camera / QR scanner blank | Camera permission granted? It needs a real device or a simulator with camera support |
| Stuck on the spinner at launch | Secure-store hydration failed. Reinstall the app, or check `store/user.ts` |
