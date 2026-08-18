import { useNavigate } from "react-router-dom";
import { APP_STORE_URL, BRAND, MOBILE_APP_SCHEME } from "./constants";

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  // iPad on iOS 13+ reports Mac UA but has touch events
  if (/Macintosh/.test(ua) && "ontouchend" in document) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

function openIosApp(): void {
  let opened = false;
  const onVisibility = () => {
    if (document.hidden) opened = true;
  };
  document.addEventListener("visibilitychange", onVisibility);

  window.location.href = MOBILE_APP_SCHEME;

  window.setTimeout(() => {
    document.removeEventListener("visibilitychange", onVisibility);
    if (!opened && !document.hidden) {
      window.location.href = APP_STORE_URL;
    }
  }, 1500);
}

export default function LandingPage() {
  const navigate = useNavigate();
  const platform = detectPlatform();

  const handlePlayViaApp = () => {
    if (platform === "ios") {
      openIosApp();
      return;
    }
    if (platform === "android") {
      // No Play Store link yet — fall through to web trivia.
      navigate("/play/signin");
      return;
    }
    // Desktop — nothing reasonable to do, push them to web play.
    navigate("/play/signin");
  };

  const handlePlayViaWeb = () => {
    navigate("/play/signin");
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-12"
      style={{ backgroundColor: BRAND.bg }}
    >
      <div className="w-full max-w-sm flex flex-col items-center">
        <div
          className="mb-8 w-20 h-20 rounded-2xl flex items-center justify-center"
          style={{
            backgroundColor: BRAND.purpleFaint,
            border: `1px solid ${BRAND.purpleBorder}`,
          }}
        >
          <span style={{ fontSize: 40 }}>🧠</span>
        </div>

        <h1
          className="text-3xl font-bold mb-2 text-center"
          style={{ color: BRAND.text }}
        >
          SportsIQ Trivia
        </h1>
        <p
          className="text-sm text-center mb-10"
          style={{ color: BRAND.muted }}
        >
          Play live trivia with the bar. Pick how you want to play.
        </p>

        <button
          onClick={handlePlayViaApp}
          className="w-full rounded-xl py-4 px-6 mb-3 font-semibold text-base wp-press-scale"
          style={{
            backgroundColor: BRAND.purple,
            color: BRAND.text,
          }}
        >
          {platform === "ios"
            ? "Play via App"
            : platform === "android"
              ? "Play via App (Web for now)"
              : "Play via App"}
        </button>

        <button
          onClick={handlePlayViaWeb}
          className="w-full rounded-xl py-4 px-6 font-semibold text-base wp-press-scale"
          style={{
            backgroundColor: "transparent",
            border: `1px solid ${BRAND.purpleBorder}`,
            color: BRAND.text,
          }}
        >
          Play via Web
        </button>

        {platform === "android" && (
          <p
            className="text-xs text-center mt-6"
            style={{ color: BRAND.faint }}
          >
            Our Android app isn't in the Play Store yet — you can still play
            right here in your browser.
          </p>
        )}
        {platform === "desktop" && (
          <p
            className="text-xs text-center mt-6"
            style={{ color: BRAND.faint }}
          >
            For the best experience, open this page on your phone.
          </p>
        )}
      </div>
    </div>
  );
}
