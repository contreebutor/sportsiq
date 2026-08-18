import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createOtp, fetchUser, needsOtp } from "./api";
import { BRAND } from "./constants";
import { useWebPlayUser } from "./store";

function formatPhone(digits: string): string {
  // Very light US-style formatter: (xxx) xxx-xxxx
  const d = digits.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length < 4) return `(${d}`;
  if (d.length < 7) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export default function SignInPage() {
  const navigate = useNavigate();
  const { user, setPhone, setUser } = useWebPlayUser();
  const [digits, setDigits] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) navigate("/play/trivia", { replace: true });
  }, [user, navigate]);

  const submit = async () => {
    setError(null);
    if (digits.length !== 10) {
      setError("Please enter a 10-digit US phone number.");
      return;
    }
    const phone = `+1${digits}`;
    setLoading(true);
    try {
      const needs = await needsOtp(phone);
      if (!needs) {
        // Server says no OTP needed — try to fetch existing user.
        const existing = await fetchUser(phone);
        setPhone(phone);
        if (existing) {
          setUser(existing);
          navigate("/play/trivia", { replace: true });
        } else {
          navigate("/play/profile", { replace: true });
        }
        return;
      }
      await createOtp(phone);
      setPhone(phone);
      navigate(`/play/verify?phone=${encodeURIComponent(phone)}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not send code. Try again."
      );
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
        <button
          onClick={() => navigate("/play")}
          className="self-start text-sm mb-6"
          style={{ color: BRAND.muted }}
        >
          ← Back
        </button>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: BRAND.text }}
        >
          What's your number?
        </h1>
        <p className="text-sm mb-8" style={{ color: BRAND.muted }}>
          We'll text you a code to sign in.
        </p>

        <div
          className="flex items-center rounded-xl mb-4 px-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${BRAND.cardBorder}`,
          }}
        >
          <span
            className="text-base font-semibold pr-3"
            style={{ color: BRAND.muted }}
          >
            +1
          </span>
          <input
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="(555) 123-4567"
            className="flex-1 py-4 bg-transparent text-base outline-none"
            style={{ color: BRAND.text }}
            value={formatPhone(digits)}
            onChange={(e) => {
              const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
              setDigits(onlyDigits);
            }}
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
          disabled={loading || digits.length !== 10}
          className="w-full rounded-xl py-4 px-6 font-semibold text-base wp-press-scale"
          style={{
            backgroundColor: BRAND.purple,
            color: BRAND.text,
            opacity: loading || digits.length !== 10 ? 0.5 : 1,
          }}
        >
          {loading ? "Sending..." : "Send Code"}
        </button>

        <p
          className="text-xs text-center mt-8"
          style={{ color: BRAND.faint }}
        >
          Standard message &amp; data rates may apply.
        </p>
      </div>
    </div>
  );
}
