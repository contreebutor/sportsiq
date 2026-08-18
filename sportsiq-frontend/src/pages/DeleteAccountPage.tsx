import { useState } from "react";
import { createOTP, verifyOTP } from "../services/phoneService";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type Step = "phone" | "otp" | "confirm" | "done" | "error";

export default function DeleteAccountPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const formattedPhone = `+1${phone.replace(/\D/g, "")}`;

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit US phone number.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    const ok = await createOTP(formattedPhone);
    setLoading(false);
    if (ok === false) {
      setErrorMsg("Failed to send verification code. Please try again.");
      return;
    }
    setStep("otp");
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 5) {
      setErrorMsg("Please enter the 5-digit code.");
      return;
    }
    setErrorMsg("");
    setLoading(true);
    const ok = await verifyOTP(formattedPhone, otp);
    if (!ok) {
      setLoading(false);
      setErrorMsg("Invalid code. Please try again.");
      return;
    }
    setLoading(false);
    setStep("confirm");
  };

  const handleDelete = async () => {
    setErrorMsg("");
    setLoading(true);

    try {
      // Look up the user by phone to get the user_id
      const fetchRes = await fetch(`${BACKEND_URL}/v1/mobile/user/fetch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: formattedPhone }),
      });

      if (!fetchRes.ok) {
        setLoading(false);
        setErrorMsg("No account found for this phone number.");
        return;
      }

      const fetchJson = await fetchRes.json();
      const userId = fetchJson.data?.id;
      if (!userId) {
        setLoading(false);
        setErrorMsg("No account found for this phone number.");
        return;
      }

      // Delete the account
      const deleteRes = await fetch(`${BACKEND_URL}/v1/mobile/user/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!deleteRes.ok) {
        setLoading(false);
        setErrorMsg("Failed to delete account. Please try again.");
        return;
      }

      setLoading(false);
      setStep("done");
    } catch {
      setLoading(false);
      setErrorMsg("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0718] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">
            Sports<span className="text-[#5545D3]">IQ</span>
          </h1>
          <p className="text-slate-400 text-sm">Account Deletion</p>
        </div>

        <div className="bg-[#110E2A] rounded-2xl border border-white/10 p-8">
          {step === "phone" && (
            <>
              <h2 className="text-white text-xl font-semibold mb-2">
                Delete your account
              </h2>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Enter the phone number associated with your SportsIQ account.
                We'll send a verification code to confirm your identity before
                deleting your account and all associated data.
              </p>

              <label className="block text-slate-300 text-sm font-medium mb-2">
                Phone number
              </label>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-slate-400 text-base">+1</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="1234567890"
                  className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-base placeholder-slate-500 outline-none focus:border-[#5545D3] transition-colors"
                />
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.replace(/\D/g, "").length !== 10}
                className="w-full bg-[#5545D3] hover:bg-[#6355E0] disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                {loading ? "Sending..." : "Send verification code"}
              </button>
            </>
          )}

          {step === "otp" && (
            <>
              <h2 className="text-white text-xl font-semibold mb-2">
                Enter verification code
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                We sent a 5-digit code to{" "}
                <span className="text-white">+1 {phone}</span>
              </p>

              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 5))
                }
                placeholder="00000"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-slate-500 outline-none focus:border-[#5545D3] transition-colors mb-4"
              />

              {errorMsg && (
                <p className="text-red-400 text-sm mb-4">{errorMsg}</p>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 5}
                className="w-full bg-[#5545D3] hover:bg-[#6355E0] disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setOtp("");
                  setErrorMsg("");
                }}
                className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
              >
                Use a different number
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-red-500/15 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-red-400 text-3xl">!</span>
                </div>
                <h2 className="text-white text-xl font-semibold mb-2">
                  Are you sure?
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed">
                  This will permanently delete your SportsIQ account, including
                  your IQ points, game history, and all associated data.
                  This action cannot be undone.
                </p>
              </div>

              {errorMsg && (
                <p className="text-red-400 text-sm mb-4 text-center">
                  {errorMsg}
                </p>
              )}

              <button
                onClick={handleDelete}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
              >
                {loading ? "Deleting..." : "Delete my account"}
              </button>

              <button
                onClick={() => {
                  setStep("phone");
                  setPhone("");
                  setOtp("");
                  setErrorMsg("");
                }}
                className="w-full text-slate-400 hover:text-white text-sm py-2 transition-colors"
              >
                Cancel
              </button>
            </>
          )}

          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-green-400 text-3xl">&#10003;</span>
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">
                Account deleted
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your SportsIQ account and all associated data have been
                permanently deleted. You can close this page.
              </p>
            </div>
          )}
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          If you need help, contact support at support@sportsiq.app
        </p>
      </div>
    </div>
  );
}
