interface LogoProps {
  size?: string;
  isLight?: boolean;
}

export default function Logo({ size = "h-5", isLight = true }: LogoProps) {
  return (
    <img
      src={
        isLight
          ? "/logos/brand/sports-iq-logo-light.svg"
          : "/logos/brand/sports-iq-logo-dark.svg"
      }
      alt="SportsIQ Logo"
      className={`w-auto ${size}`}
    />
  );
}
