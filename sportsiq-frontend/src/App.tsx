import { useEffect, useRef } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import SignIn from "./pages/SignInPage";
import Dashboard from "./pages/DashboardPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { Bounce, ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";
import SubmitPredictionsPage from "./pages/SubmitPredictionsPage";
import ContestWinnerPage from "./pages/ContestWinnerPage";
import ManagementPage from "./pages/ManagementPage";
import { TeamGameStatsPage } from "./pages/TeamGameStatsPage";
import SubmitBingoCardsPage from "./pages/contest/SubmitBingoCardsPage";
import DeleteAccountPage from "./pages/DeleteAccountPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import WebPlayLanding from "./webPlay/LandingPage";
import WebPlaySignIn from "./webPlay/SignInPage";
import WebPlayVerify from "./webPlay/VerifyOtpPage";
import WebPlayProfile from "./webPlay/ProfilePage";
import WebPlayTrivia from "./webPlay/TriviaPage";

export default function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const isDashboardPage = /^\/dashboard\/[^/]+$/.test(location.pathname);

  useEffect(() => {
    if (!isDashboardPage) return;

    // Set the "base" width/height depending on /contest/:id
    const baseW = 1920;
    const baseH = 1080;
    const el = canvasRef.current;
    if (!el) return;

    const updateScale = () => {
      // For contest page, take full width/height, no scaling
      const raw = Math.min(
        window.innerWidth / baseW,
        window.innerHeight / baseH
      );
      const scale = raw;

      // Align to whole pixels to avoid subpixel blur
      const scaledW = baseW * scale;
      const scaledH = baseH * scale;
      const offsetX = Math.floor((window.innerWidth - scaledW) / 2);
      const offsetY = Math.floor((window.innerHeight - scaledH) / 2);

      el.style.position = "absolute";
      el.style.left = `${offsetX}px`;
      el.style.top = `${offsetY}px`;
      el.style.transformOrigin = "top left";

      // Prefer CSS zoom for sharp text on Chromium/WebKit; fallback to transform for Firefox
      const ua = navigator.userAgent.toLowerCase();
      const isFirefox = ua.includes("firefox");
      if (isFirefox) {
        el.style.zoom = "1";
        el.style.transform = `scale(${scale})`;
      } else {
        el.style.transform = "none";
        el.style.zoom = String(scale);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
    // Only re-run when pathname changes
  }, [location.pathname, isDashboardPage]);

  return (
    <div className={isDashboardPage ? "display-viewport" : "w-full h-full"}>
      <div
        ref={canvasRef}
        className={isDashboardPage ? "display-canvas" : "w-full h-full"}
      >
        <div
          className={`${
            isDashboardPage ? "w-[1920px] h-[1080px]" : "w-full h-full"
          }`}
        >
          <Routes>
            <Route path="/team-game-stats" element={<TeamGameStatsPage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/dashboard/:id" element={<Dashboard />} />
            <Route
              path="/manage"
              element={
                <ProtectedRoute>
                  <ManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/submit-predictions/:id"
              element={<SubmitPredictionsPage />}
            />
            <Route path="/contest-winner/:id" element={<ContestWinnerPage />} />
            <Route
              path="/submit-bingo-cards/:id"
              element={<SubmitBingoCardsPage />}
            />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route path="/play" element={<WebPlayLanding />} />
            <Route path="/play/signin" element={<WebPlaySignIn />} />
            <Route path="/play/verify" element={<WebPlayVerify />} />
            <Route path="/play/profile" element={<WebPlayProfile />} />
            <Route path="/play/trivia" element={<WebPlayTrivia />} />
            <Route path="*" element={<Navigate to="/not-found" replace />} />
            <Route path="/not-found" element={<NotFoundPage />} />
          </Routes>

          <ToastContainer
            position="top-center"
            autoClose={1500}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            transition={Bounce}
          />
        </div>
      </div>
    </div>
  );
}
