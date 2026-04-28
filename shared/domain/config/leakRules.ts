// Eval swing thresholds (centipawns)
export const BLUNDER_THRESHOLD_CP = 200
export const MISTAKE_THRESHOLD_CP = 100
export const INACCURACY_THRESHOLD_CP = 50

// Time thresholds (seconds)
export const TIME_LOSS_THRESHOLD_SECONDS = 30
export const LOW_TIME_THRESHOLD_SECONDS = 10

// Minimum occurrences before a pattern is reported as a Leak
export const MIN_OCCURRENCES_FOR_LEAK = 2
export const MIN_GAMES_FOR_ANALYSIS = 3

// Output limits (from requirements AC3 and AC4)
export const MAX_LEAKS_REPORTED = 3
export const MIN_PUZZLES = 3
export const MAX_PUZZLES = 10

// Relative weights used by ScoreLeaks service
export const LEAK_WEIGHTS = {
  time: 1.0,
  tactics: 1.5,
  opening: 0.8,
  structure: 0.7,
  endgame: 1.2,
} as const
