import { useState } from "react";
import Logo from "../Logo";

interface Props {
  handleSubmit: () => void;
  nickname: string;
  mobile: string;
  setNickname: (nickname: string) => void;
  setMobile: (mobile: string) => void;
}
export default function JoinTheGame({
  handleSubmit,
  nickname,
  mobile,
  setNickname,
  setMobile,
}: Props) {
  const [agreed, setAgreed] = useState<boolean>(false);

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-start">
        <div className="w-full h-fit flex flex-col items-center bg-[#1D1A35] px-4 pt-20 pb-7 gap-7">
          <div className="w-full h-fit flex flex-col items-center">
            <span className="text-white text-2xl font-bold">JOIN THE GAME</span>
            <span className="text-white text-base font-medium text-center">
              Just a few details to get you on the leaderboard
            </span>
          </div>

          <div className="w-full h-fit flex flex-col items-center gap-5">
            <CustomInputForm
              label="Name"
              placeholder="Enter your name"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <CustomInputForm
              label="Mobile number"
              placeholder="Enter your mobile number (10 digits)"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
            />

            <div className="w-full flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="w-7 h-7 border border-gray-500 appearance-none rounded-sm transition-colors cursor-pointer text-white checked:bg-indigo-600 checked:border-indigo-600 checked:accent-indigo-600 checked:appearance-auto"
                style={{ accentColor: "#5545d3" }}
              />
              <span className="text-white text-base">
                {"I have read and agree to the "}
                <a
                  href="https://www.lumen-iq.com/sportsiq/terms.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-semibold text-indigo-400 hover:text-indigo-300"
                >
                  Terms and Conditions
                </a>
              </span>
            </div>
          </div>
        </div>

        <div className="w-full h-fit px-4 py-6 flex flex-col items-center">
          <button
            onClick={handleSubmit}
            disabled={!nickname || !mobile || !agreed}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-sm text-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
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

interface CustomInputFormProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CustomInputForm = ({
  label,
  placeholder,
  value,
  onChange,
}: CustomInputFormProps) => {
  return (
    <>
      <div className="w-full h-fit flex flex-col items-start gap-3">
        <span className="text-white text-lg font-semibold">{label}</span>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full text-white placeholder-gray-500 px-4 py-2 rounded-sm text-base font-medium transition-colors cursor-pointer border border-gray-500 focus:outline-none focus:ring-0 focus:border-indigo-600"
        />
      </div>
    </>
  );
};
