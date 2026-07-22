export interface SportsbookCardProps {
  logo: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeColor: string;
  awayColor: string;
  homeMoneyline?: string;
  awayMoneyline?: string;
  homePointSpread?: string;
  awayPointSpread?: string;
  homePointSpreadPayout?: string;
  awayPointSpreadPayout?: string;
  overUnder?: string;
  overPayout?: string;
  underPayout?: string;

  isHomeMoneylineHighlighted?: boolean;
  isAwayMoneylineHighlighted?: boolean;
  isHomePointSpreadHighlighted?: boolean;
  isAwayPointSpreadHighlighted?: boolean;
  isOverPayoutHighlighted?: boolean;
  isUnderPayoutHighlighted?: boolean;
}

// Utility to determine if a color is too light, and return a fallback if so
function getSafeColor(color: string, fallback: string = "#222222"): string {
  // Remove leading '#' if present
  let c = color.startsWith("#") ? color.slice(1) : color;
  if (c.length === 3) {
    c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  }
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);

  // Standard luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // If luminance is high, it's light -- use the fallback (dark color)
  return luminance > 0.85 ? fallback : color;
}

export default function SportsbookCard({
  isLarge,
  data,
}: {
  isLarge: boolean;
  data: SportsbookCardProps;
}) {
  // Choose safe colors to use for text/border/background
  const safeHomeColor = getSafeColor(data.homeColor, "#25375B");
  const safeAwayColor = getSafeColor(data.awayColor, "#3C2B58");

  const generateHighlightedStyle = (isHighlighted: boolean, color: string) => {
    return {
      backgroundColor: isHighlighted ? `${color}1A` : "transparent",
      border: isHighlighted ? `1px solid ${color}` : "none",
    };
  };

  const itemGroupStyle = `w-full h-full flex flex-col items-center gap-1 ${
    isLarge ? "p-2" : "p-1"
  }`;

  const itemStyle = `w-full h-full flex items-center justify-center ${
    isLarge
      ? "flex-row gap-2 rounded-sm"
      : "flex-col leading-none p-1 rounded-xs"
  }`;

  return (
    <>
      <div className="w-full h-full flex flex-col items-center justify-start rounded-sm overflow-hidden">
        {/* Sportsbook Logo */}
        <span
          className={`w-full shrink-0 flex items-center justify-center ${
            isLarge ? "h-9" : "h-7"
          }`}
        >
          <img
            src={data.logo}
            alt={data.name}
            className="w-full h-full object-cover"
          />
        </span>

        {/* Sportsbook Data */}
        <span
          className={`w-full h-full bg-white flex flex-col items-center justify-start ${
            isLarge ? "text-lg" : "text-sm"
          }`}
        >
          {/* Moneyline */}
          <span className={itemGroupStyle}>
            <span
              className={itemStyle}
              style={generateHighlightedStyle(
                data.isAwayMoneylineHighlighted,
                safeAwayColor
              )}
            >
              <span className="font-bold" style={{ color: safeAwayColor }}>
                {data.awayMoneyline || ""}
              </span>
              <span className="text-gray-500">{data.awayTeam}</span>
            </span>

            <span
              className={itemStyle}
              style={generateHighlightedStyle(
                data.isHomeMoneylineHighlighted,
                safeHomeColor
              )}
            >
              <span className="font-bold" style={{ color: safeHomeColor }}>
                {data.homeMoneyline || ""}
              </span>
              <span className="text-gray-500">{data.homeTeam}</span>
            </span>
          </span>

          {/* Spread */}
          <span
            className={`w-full h-full flex flex-col items-center bg-gray-200 gap-1 ${
              isLarge ? "p-2" : "p-1"
            }`}
          >
            <span
              className={itemStyle}
              style={generateHighlightedStyle(
                data.isAwayPointSpreadHighlighted,
                safeAwayColor
              )}
            >
              <span className="font-bold" style={{ color: safeAwayColor }}>
                {data.awayPointSpread || ""}
              </span>
              <span className="text-gray-500">
                {data.awayPointSpreadPayout || ""}
              </span>
            </span>

            <span
              className={itemStyle}
              style={generateHighlightedStyle(
                data.isHomePointSpreadHighlighted,
                safeHomeColor
              )}
            >
              <span className="font-bold" style={{ color: safeHomeColor }}>
                {data.homePointSpread || ""}
              </span>
              <span className="text-gray-500">
                {data.homePointSpreadPayout || ""}
              </span>
            </span>
          </span>

          {/* Over Under */}
          <span className={itemGroupStyle}>
            <span
              className={itemStyle}
              style={generateHighlightedStyle(
                data.isOverPayoutHighlighted,
                safeHomeColor
              )}
            >
              <span className="font-bold">
                {data.overUnder ? `O ${data.overUnder}` : ""}
              </span>
              <span className="text-gray-500">{data.overPayout || ""}</span>
            </span>

            <span
              className={itemStyle}
              style={generateHighlightedStyle(
                data.isUnderPayoutHighlighted,
                safeAwayColor
              )}
            >
              <span className="font-bold">
                {data.overUnder ? `U ${data.overUnder}` : ""}
              </span>
              <span className="text-gray-500">{data.underPayout || ""}</span>
            </span>
          </span>
        </span>
      </div>
    </>
  );
}
