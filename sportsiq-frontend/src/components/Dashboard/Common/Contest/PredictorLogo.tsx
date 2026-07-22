import Logo from "../../../Logo";

interface Props {
  logoSize?: string;
  charactersSize?: string;
}
const PredictorLogo = ({
  logoSize = "h-6",
  charactersSize = "text-4xl",
}: Props) => {
  const characters = "PREDICTOR";

  return (
    <>
      <div className="w-full h-fit flex flex-col items-center justify-center">
        <Logo size={logoSize} />
        <span
          className={`text-white font-bold flex items-center justify-center gap-1 ${charactersSize}`}
        >
          {characters.split("").map((character, index) => (
            <span key={index}>{character}</span>
          ))}
        </span>
      </div>
    </>
  );
};

export default PredictorLogo;
