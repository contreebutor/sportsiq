import { Router, Request, Response } from "express";

const router = Router();

const APP_STORE_URL =
  "https://apps.apple.com/us/app/sports-iq/id6759401599";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.lumeniq.sportsiq";

/**
 * GET /v1/join/contest/:type/:id
 *
 * Serves a small HTML page that:
 * 1. Attempts to open the mobile app via deep link
 * 2. Falls back to a web landing page with contest info + download link
 *    (instead of blindly redirecting to the App Store)
 */
router.get("/contest/:type/:id", (req: Request, res: Response) => {
  const { type, id } = req.params;
  const deepLink = `sportsiqmobile://contest/${type}/${id}`;
  const typeLabel =
    type === "predictor"
      ? "Predictor"
      : type === "bingo"
      ? "Bingo"
      : type === "trivia"
      ? "Trivia"
      : "Game";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SportsIQ — Join ${typeLabel}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #050912; color: #f8fafc;
      min-height: 100vh;
    }
    .container {
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      min-height: 100vh; padding: 24px; text-align: center;
    }
    .logo { font-size: 36px; font-weight: 900; margin-bottom: 8px; }
    .logo span { color: #5545D3; }
    .badge {
      display: inline-block; background: rgba(85,69,211,0.15);
      color: #7C6EF5; border: 1px solid rgba(85,69,211,0.3);
      border-radius: 20px; padding: 6px 16px; font-size: 13px;
      font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
      margin-bottom: 24px;
    }
    .card {
      background: #0D1420; border: 1px solid rgba(85,69,211,0.25);
      border-radius: 20px; padding: 32px 28px; max-width: 380px; width: 100%;
    }
    .card h2 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    .card p { color: #94a3b8; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
    .btn {
      display: block; width: 100%; padding: 14px;
      border-radius: 12px; font-size: 16px; font-weight: 700;
      text-decoration: none; text-align: center; cursor: pointer; border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #5545D3, #3D31B0); color: #fff;
      margin-bottom: 12px;
    }
    .btn-secondary {
      background: rgba(85,69,211,0.1); color: #7C6EF5;
      border: 1px solid rgba(85,69,211,0.3);
    }
    .opening { font-size: 14px; color: #64748b; margin-top: 20px; }
    .opening.hidden { display: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">Sports<span>IQ</span></div>
    <div class="badge">${typeLabel}</div>
    <div class="card">
      <h2>You&rsquo;re invited to play!</h2>
      <p>Join the live ${typeLabel.toLowerCase()} game. Make your picks, compete for SportsIQ points, and show off on the big screen.</p>
      <a id="open-btn" class="btn btn-primary" href="${deepLink}">Open in App</a>
      ${type === "predictor" || type === "bingo" ? `<a class="btn btn-secondary" href="/v1/play/${type}/${id}" style="margin-bottom:12px;">Play in Browser</a>` : ""}
      <a id="download-btn" class="btn btn-secondary" href="${APP_STORE_URL}">Download SportsIQ</a>
    </div>
  </div>
  <script>
    var isAndroid = /android/i.test(navigator.userAgent);
    var storeUrl = isAndroid ? "${PLAY_STORE_URL}" : "${APP_STORE_URL}";
    document.getElementById("download-btn").href = storeUrl;
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.send(html);
});

export default router;
