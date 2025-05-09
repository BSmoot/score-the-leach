// Type definitions for the Hockey Scoreboard application

// Team type definition
export interface Team {
  id: number;
  name: string;
  logo: string;
  score: number;
  onIce: boolean;
  isChallenger: boolean;
  isGoalie?: boolean;
}

// History state for undo functionality
export interface HistoryState {
  teams: Team[];
  period: number;
}

// Default icons with proper type definition
export const DEFAULT_ICONS = {
  rats: "/rats-jersey.png",
  ginkos: "/ginkos-jersey.png",
  sweetNLow: "/sweet-jersey.png",
  goalies: "/goalies-mask.png"
} as const;

// Props for TeamLogo component
export interface TeamLogoProps {
  team: Team;
  updateTeamLogo: (id: number, file: File) => void;
}
