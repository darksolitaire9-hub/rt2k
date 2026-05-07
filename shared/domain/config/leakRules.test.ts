import { describe, it, expect } from 'vitest'
import {
  BLUNDER_THRESHOLD_CP,
  MIN_CLOCK_FLAG_THRESHOLD_SECONDS,
  PRE_FLAG_LOOKBACK_MOVES,
  MATERIAL_SWING_PAWN_UNITS,
  EARLY_RESIGNATION_MAX_MOVES,
  MAX_CANDIDATES_PER_GAME,
  MAX_GAMES_PER_ANALYSIS_RUN,
  MIN_GAMES_FOR_LEAK_PATTERN,
  TREND_WINDOW_GAMES,
  MAX_LEAKS_REPORTED,
  MAX_PUZZLES,
  LEAK_WEIGHTS,
  OPENING_PHASE_UNTIL_MOVE,
  MIDDLEGAME_PHASE_UNTIL_MOVE,
  ENGINE_SEARCH_DEPTH,
} from './leakRules'

describe('leakRules', () => {
  it('thresholds are positive', () => {
    expect(BLUNDER_THRESHOLD_CP).toBeGreaterThan(0)
    expect(MIN_CLOCK_FLAG_THRESHOLD_SECONDS).toBeGreaterThan(0)
    expect(PRE_FLAG_LOOKBACK_MOVES).toBeGreaterThan(0)
    expect(MATERIAL_SWING_PAWN_UNITS).toBeGreaterThan(0)
    expect(EARLY_RESIGNATION_MAX_MOVES).toBeGreaterThan(0)
  })

  it('limits are at least 1', () => {
    expect(MAX_CANDIDATES_PER_GAME).toBeGreaterThanOrEqual(1)
    expect(MAX_GAMES_PER_ANALYSIS_RUN).toBeGreaterThanOrEqual(1)
    expect(MIN_GAMES_FOR_LEAK_PATTERN).toBeGreaterThanOrEqual(1)
    expect(TREND_WINDOW_GAMES).toBeGreaterThanOrEqual(1)
  })

  it('puzzle count limit is valid', () => {
    expect(MAX_PUZZLES).toBe(100)
  })

  it('max leaks reported matches requirements (up to 3)', () => {
    expect(MAX_LEAKS_REPORTED).toBe(3)
  })

  it('all leak weights are positive numbers', () => {
    for (const weight of Object.values(LEAK_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0)
    }
  })

  it('leak weights cover all current leak types', () => {
    expect(LEAK_WEIGHTS).toHaveProperty('FLAG_RISK')
    expect(LEAK_WEIGHTS).toHaveProperty('PRE_FLAG_BLUNDER')
    expect(LEAK_WEIGHTS).toHaveProperty('TACTICAL_MISS')
    expect(LEAK_WEIGHTS).toHaveProperty('EARLY_RESIGNATION')
  })

  it('phase boundaries are positive and ordered opening < middlegame', () => {
    expect(OPENING_PHASE_UNTIL_MOVE).toBeGreaterThan(0)
    expect(MIDDLEGAME_PHASE_UNTIL_MOVE).toBeGreaterThan(OPENING_PHASE_UNTIL_MOVE)
  })

  it('engine search depth is a positive integer', () => {
    expect(ENGINE_SEARCH_DEPTH).toBeGreaterThan(0)
    expect(Number.isInteger(ENGINE_SEARCH_DEPTH)).toBe(true)
  })
})
