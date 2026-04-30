// Eval swing thresholds (centipawns) — used by PGN parser for openingFail/conversionFail
export const BLUNDER_THRESHOLD_CP = 200

// Phase boundaries (full move numbers, inclusive) — used by PGN parser
export const OPENING_PHASE_UNTIL_MOVE = 10
export const MIDDLEGAME_PHASE_UNTIL_MOVE = 30

// Engine search depth for per-FEN candidate confirmation
export const ENGINE_SEARCH_DEPTH = 18

// Heuristic thresholds
export const MIN_CLOCK_FLAG_THRESHOLD_SECONDS = 10
export const PRE_FLAG_LOOKBACK_MOVES = 7
export const MATERIAL_SWING_PAWN_UNITS = 1.5
export const EARLY_RESIGNATION_MAX_MOVES = 30
export const MAX_CANDIDATES_PER_GAME = 15
export const MAX_GAMES_PER_ANALYSIS_RUN = 100
export const MIN_GAMES_FOR_LEAK_PATTERN = 5
export const TREND_WINDOW_GAMES = 50

// Output limits
export const MAX_LEAKS_REPORTED = 3
export const MAX_PUZZLES = 10

// Relative weights used by ScoreLeaks
export const LEAK_WEIGHTS = {
  FLAG_RISK: 1.5,
  PRE_FLAG_BLUNDER: 1.3,
  TACTICAL_MISS: 1.5,
  EARLY_RESIGNATION: 1.0,
} as const
