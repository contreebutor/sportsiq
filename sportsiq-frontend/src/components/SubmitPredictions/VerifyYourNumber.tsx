import { useState } from "react";
import Logo from "../Logo";

interface Props {
  handleVerify: (otp: string) => void;
}

export default function VerifyYourNumber({ handleVerify }: Props) {
  const [otp, setOtp] = useState<string>("");

  return (
    <>
      <div className="w-full h-full bg-[#110E2A] flex flex-col items-center justify-start">
        <div className="w-full h-fit flex flex-col items-center bg-[#1D1A35] px-4 pt-20 pb-7 gap-7">
          <div className="w-full h-fit flex flex-col items-center gap-3">
            <span className="text-white text-2xl font-bold">
              VERIFY YOUR NUMBER
            </span>
            <span className="text-white text-sm font-medium text-center px-8">
              We just sent a 5-digit code to your mobile number. Enter it below
              to lock in your prediction
            </span>
          </div>

          <div className="w-full h-fit flex flex-col items-center gap-5">
            <input
              type="text"
              placeholder="Enter the code (5 digits)"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full text-white placeholder-gray-500 px-4 py-2 rounded-sm text-base font-medium transition-colors cursor-pointer border border-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="w-full h-fit px-4 py-6 flex flex-col items-center">
          <button
            onClick={() => handleVerify(otp)}
            disabled={otp.length !== 5}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-sm text-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Verify
          </button>
        </div>

        <div className="w-full h-fit p-4 flex flex-col items-center">
          <div className="w-fit h-fit flex items-center justify-center gap-2">
            <span className="text-white/80 font-light">Powered by</span>
            <Logo size="h-6" />
          </div>
        </div>
      </div>
    </>
  );
}
