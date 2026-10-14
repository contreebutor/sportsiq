# SportsIQ Mockups

The SportsIQ design review site: static, high-fidelity HTML mockups of the mobile app, the bar TV
screen and the business/venue tools, plus a small feedback system so reviewers can comment on
each screen and submit ideas.

- **Live site:** <https://design.lumen-iq.com> (password protected, see [Access](#access))
- **Stack:** plain HTML/CSS/JS with no build step, an optional zero-dependency Node server for
  local editing, and Vercel serverless functions for the hosted feedback API
- **Hosting:** GitHub Pages (static) and Vercel (static + `/api/*`)

---

## What's in here

| Path | What it is |
|---|---|
| `index.html` | The main mockup app: a sidebar of 120+ screens grouped into **For Isaac** (dev handoff), **V1 Launch Spec**, **Mobile**, **Bar TV** and **Business**, plus an **Idea Inbox**. About 3.5 MB of inlined HTML/CSS/JS and images |
| `isaac-phase4.html` | Phase 4 developer handoff spec (served at `/isaac-phase4` on Vercel) |
| `demo-video.html` | 60-second distributor demo with voice-over (served at `/demo-video`) |
| `audio/` | `narration.mp3` and per-scene clips `vo_01…vo_21.mp3` for the demo video |
| `threads.json` | Per-screen comment threads, keyed by `data-screen` ID |
| `server.js` | Local companion server (Node, no dependencies) |
| `api/` | Vercel serverless functions for the hosted feedback API |
| `vercel.json` | Vercel routes: API functions, pretty URLs, no-cache headers on `index.html` |
| `.github/workflows/deploy.yml` | Publishes the folder to GitHub Pages on every push to `main` |
| `CNAME` | Custom domain for GitHub Pages (`design.lumen-iq.com`) |
| `SETUP.md` | DNS and access notes |

> **Working with `index.html`:** it is ~3.5 MB. Don't open it whole in an editor or AI tool.
> Search it (`grep -n 'data-screen="bar-idle-v4"' index.html`) and edit the section you need.
> Each mockup is a block tagged with a `data-screen="<id>"` attribute (e.g. `home-live-v4`,
> `bar-pred-q-v4`, `leaderboard-v4`), and the sidebar entries use `class="tab-label"`.

---

## Running locally

### Just viewing

Any static server works:

```bash
cd sportsiq-mockups
npx serve .            # or: python3 -m http.server 8000
```

### With the feedback features (recommended)

```bash
cd sportsiq-mockups
node server.js         # http://localhost:3456
```

`server.js` serves `index.html` and handles:

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | Lets the page detect that a server is available |
| `POST /api/reply` | `{ id, reply }`: saves a reply on an Idea Inbox item |
| `POST /api/new-idea` | `{ idea }`: adds a new Idea Inbox item |

Locally, ideas are written **straight into `index.html`**, inside the
`<script id="mark-ideas" type="application/json">` block, so commit the file afterwards. The
local server doesn't implement `/api/threads`, so per-screen comment threads only work on the
hosted (Vercel) site.

The page chooses its API base automatically: same origin when hosted, relative paths on
`localhost`.

---

## Hosted feedback API (Vercel)

The functions in `api/` do the same work as `server.js`, but through the **GitHub API**, so every
reply becomes a commit to the repo:

| Function | Route | Behavior |
|---|---|---|
| `health.js` | `GET /api/health` | `{ ok: true, mode: "vercel" }` |
| `new-idea.js` | `POST /api/new-idea` | Appends an idea to the `mark-ideas` block and commits `index.html` |
| `reply.js` | `POST /api/reply` | Sets `mark_reply` on an idea and commits |
| `threads.js` | `GET /api/threads?screen=<id>` · `POST /api/threads` | Reads or writes per-screen threads in `threads.json` |
| `_github.js` | (shared) | GitHub helpers. Because `index.html` is over the 1 MB Contents API limit, it reads by **blob SHA** through the Git Data API, which also avoids stale CDN reads |

Vercel environment variables:

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | Token with `contents: write` on the target repo |
| `GITHUB_OWNER` | Repo owner (default `LumenIQ25`) |
| `GITHUB_REPO` | Repo name (default `sportsiq-mockups`) |

Since the API commits to the repo, **pull before you edit `index.html`** to avoid overwriting
reviewer replies.

---

## Deployment

- **GitHub Pages:** `.github/workflows/deploy.yml` uploads the whole folder as the Pages artifact
  on every push to `main` (or a manual run). The custom domain comes from `CNAME`. DNS needs a
  `CNAME design → lumeniq25.github.io` record (see `SETUP.md`). Pages is static only, so
  `/api/*` isn't available there.
- **Vercel:** deploy this folder as a project. `vercel.json` maps the API routes,
  `/isaac-phase4`, `/demo-video` and `/audio/*`, and serves `index.html` for everything else with
  no-cache headers so reviewers always see the latest version.

---

## Access

`index.html` shows a password gate before anything renders. The gate compares the SHA-256 of the
entered password against the `TOKEN` constant at the top of the file and remembers success for
the browser session (`sessionStorage`). To change the password, replace `TOKEN` with the hex
SHA-256 of the new one:

```bash
printf '%s' 'new-password' | shasum -a 256
```

This gate only discourages casual visitors. The content is still public to anyone who reads the
page source, so don't put secrets in the mockups. Ask the project owner for the current password.

---

## Adding or updating a mockup

1. Find a similar screen: `grep -n 'data-screen="' index.html | less`.
2. Copy its block and give it a new unique `data-screen` ID (by convention a `-vN` suffix for
   iterations, e.g. `bar-idle-v5`).
3. Add a sidebar entry (`tab-label`) under the right nav group.
4. Check it locally with `node server.js`, then commit and push. GitHub Pages redeploys
   automatically.
