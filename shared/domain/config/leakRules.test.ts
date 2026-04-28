import { describe, it, expect } from 'vitest'
import {
  BLUNDER_THRESHOLD_CP,
  MISTAKE_THRESHOLD_CP,
  INACCURACY_THRESHOLD_CP,
  TIME_LOSS_THRESHOLD_SECONDS,
  LOW_TIME_THRESHOLD_SECONDS,
  MIN_OCCURRENCES_FOR_LEAK,
  MIN_GAMES_FOR_ANALYSIS,
  MAX_LEAKS_REPORTED,
  MIN_PUZZLES,
  MAX_PUZZLES,
  LEAK_WEIGHTS,
} from './leakRules'

describe('leakRules', () => {
  it('eval thresholds are positive and ordered inaccuracy < mistake < blunder', () => {
    expect(INACCURACY_THRESHOLD_CP).toBeGreaterThan(0)
    expect(MISTAKE_THRESHOLD_CP).toBeGreaterThan(INACCURACY_THRESHOLD_CP)
    expect(BLUNDER_THRESHOLD_CP).toBeGreaterThan(MISTAKE_THRESHOLD_CP)
  })

  it('time thresholds are positive and ordered low < loss', () => {
    expect(LOW_TIME_THRESHOLD_SECONDS).toBeGreaterThan(0)
    expect(TIME_LOSS_THRESHOLD_SECONDS).toBeGreaterThan(LOW_TIME_THRESHOLD_SECONDS)
  })

  it('occurrence and game minimums are at least 1', () => {
    expect(MIN_OCCURRENCES_FOR_LEAK).toBeGreaterThanOrEqual(1)
    expect(MIN_GAMES_FOR_ANALYSIS).toBeGreaterThanOrEqual(1)
  })

  it('puzzle count range is valid and matches requirements (3–10)', () => {
    expect(MIN_PUZZLES).toBe(3)
    expect(MAX_PUZZLES).toBe(10)
    expect(MAX_PUZZLES).toBeGreaterThan(MIN_PUZZLES)
  })

  it('max leaks reported matches requirements (up to 3)', () => {
    expect(MAX_LEAKS_REPORTED).toBe(3)
  })

  it('all leak weights are positive numbers', () => {
    for (const weight of Object.values(LEAK_WEIGHTS)) {
      expect(weight).toBeGreaterThan(0)
    }
  })

  it('leak weights cover all five leak types', () => {
    expect(LEAK_WEIGHTS).toHaveProperty('time')
    expect(LEAK_WEIGHTS).toHaveProperty('tactics')
    expect(LEAK_WEIGHTS).toHaveProperty('opening')
    expect(LEAK_WEIGHTS).toHaveProperty('structure')
    expect(LEAK_WEIGHTS).toHaveProperty('endgame')
  })
})
