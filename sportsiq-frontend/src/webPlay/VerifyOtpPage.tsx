import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createOtp, fetchUser, verifyOtp } from "./api";
import { BRAND } from "./constants";
import { useWebPlayUser } from "./store";

const CODE_LENGTH = 5;
const RESEND_COOLDOWN_SEC = 60;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setPhone, setUser } = useWebPlayUser();
  const phone = searchParams.get("phone") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SEC);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!phone) {
      navigate("/play/signin", { replace: true });
    }
    inputRef.current?.focus();
  }, [phone, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const submit = async (value: string) => {
    if (value.length !== CODE_LENGTH) return;
    setError(null);
    setLoading(true);
    try {
      const ok = await verifyOtp(phone, parseInt(value, 10));
      if (!ok) {
        setError("Invalid or expired code. Try again.");
        setCode("");
        return;
      }
      setPhone(phone);
      const existing = await fetchUser(phone);
      if (existing) {
        setUser(existing);
        navigate("/play/trivia", { replace: true });
      } else {
        navigate("/play/profile", { replace: true });
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) submit(digits);
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setError(null);
    try {
      await createOtp(phone);
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch {
      setError("Could not send a new code. Try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center px-6 py-10"
      style={{ backgroundColor: BRAND.bg }}
    >
      <div className="w-full max-w-sm flex flex-col">
        <button
          onClick={() => navigate("/play/signin")}
          className="self-start text-sm mb-6"
          style={{ color: BRAND.muted }}
        >
          ← Back
        </button>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: BRAND.text }}
        >
          Enter your code
        </h1>
        <p className="text-sm mb-8" style={{ color: BRAND.muted }}>
          We sent a 5-digit code to {phone}.
        </p>

        <div
          className="rounded-xl px-4 py-1 mb-4"
          style={{
            backgroundColor: "rgba(255,255,255,0.04)",
            border: `1px solid ${BRAND.cardBorder}`,
          }}
        >
          <input
            ref={inputRef}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="12345"
            maxLength={CODE_LENGTH}
            className="w-full py-3 bg-transparent text-2xl font-bold tracking-[0.5em] text-center outline-none"
            style={{ color: BRAND.text }}
            value={code}
            onChange={(e) => handleChange(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <p className="text-sm mb-3" style={{ color: BRAND.red }}>
            {error}
          </p>
        )}

        <button
          onClick={() => submit(code)}
          disabled={loading || code.length !== CODE_LENGTH}
          className="w-full rounded-xl py-4 px-6 font-semibold text-base wp-press-scale"
          style={{
            backgroundColor: BRAND.purple,
            color: BRAND.text,
            opacity: loading || code.length !== CODE_LENGTH ? 0.5 : 1,
          }}
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button
          onClick={handleResend}
          disabled={resendCooldown > 0 || resendLoading}
          className="text-sm mt-6 self-center"
          style={{
            color: resendCooldown > 0 ? BRAND.faint : BRAND.purpleLight,
          }}
        >
          {resendLoading
            ? "Sending..."
            : resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : "Resend code"}
        </button>
      </div>
    </div>
  );
}
