interface SportsbookIcon {
  logo_url_full: string;
  logo_url_symbol: string;
}

export const sportsbooksIcons: Record<string, SportsbookIcon> = {
  DraftKings: {
    logo_url_full: "/logos/sportsbooks/draftkings_full.svg",
    logo_url_symbol: "/logos/sportsbooks/draftkings_symbol.svg",
  },
  FanDuel: {
    logo_url_full: "/logos/sportsbooks/fanduel_full.svg",
    logo_url_symbol: "/logos/sportsbooks/fanduel_symbol.svg",
  },
  BetMGM: {
    logo_url_full: "/logos/sportsbooks/betmgm_full.svg",
    logo_url_symbol: "/logos/sportsbooks/betmgm_symbol.svg",
  },
  Caesars: {
    logo_url_full: "/logos/sportsbooks/caesars_full.svg",
    logo_url_symbol: "/logos/sportsbooks/caesars_symbol.svg",
  },
};
