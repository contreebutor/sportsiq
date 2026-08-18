import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser, fetchUser } from "./api";
import { BRAND } from "./constants";
import { useWebPlayUser } from "./store";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { phone, user, setUser } = useWebPlayUser();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!phone) {
      navigate("/play/signin", { replace: true });
    } else if (user) {
      navigate("/play/trivia", { replace: true });
    }
  }, [phone, user, navigate]);

  const submit = async () => {
    setError(null);
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError("Please enter a nickname.");
      return;
    }
    if (!phone) return;
    setLoading(true);
    try {
      await createUser(phone, trimmed, null);
      const created = await fetchUser(phone);
      if (!created) {
        setError("Could not load your profile. Try again.");
        return;
      }
      setUser(created);
      navigate("/play/trivia", { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-6 py-10"
      style={{ backgroundColor: BRAND.bg }}
    >
      <div className="w-full max-w-sm flex flex-col">
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: BRAND.text }}
        >
          Pick a nickname
        </h1>
        <p className="text-sm mb-8" style={{ color: BRAND.muted }}>
          This is what the bar will see on the leaderboard.
        </p>

        <div
          className="rounded-xl mb-4 px-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${BRAND.cardBorder}`,
          }}
        >
          <input
            autoFocus
            maxLength={20}
            placeholder="e.g. Don"
            className="w-full py-4 bg-transparent text-base outline-none"
            style={{ color: BRAND.text }}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
          />
        </div>

        {error && (
          <p className="text-sm mb-3" style={{ color: BRAND.red }}>
            {error}
          </p>
        )}

        <button
          onClick={submit}
          disabled={loading || nickname.trim().length === 0}
          className="w-full rounded-xl py-4 px-6 font-semibold text-base wp-press-scale"
          style={{
            backgroundColor: BRAND.purple,
            color: BRAND.text,
            opacity:
              loading || nickname.trim().length === 0 ? 0.5 : 1,
          }}
        >
          {loading ? "Creating..." : "Start Playing"}
        </button>
      </div>
    </div>
  );
}
