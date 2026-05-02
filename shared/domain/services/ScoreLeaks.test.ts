import { describe, it, expect } from 'vitest'
import { scoreLeaks } from './ScoreLeaks'
import type { MistakeRecord } from '../entities/MistakeRecord'
import type { TrendReport } from '../entities/TrendReport'
import { LeakType } from '../value-objects/LeakType'
import {
  MIN_GAMES_FOR_LEAK_PATTERN,
  MAX_LEAKS_REPORTED,
  LEAK_WEIGHTS,
} from '../config/leakRules'

const DEFAULT_TREND: TrendReport = {
  recentRatingDelta: 0,
  recentWinRate: 0.5,
  flagRate: 0.1,
  dominantTermination: 'Normal',
}

function makeMistake(overrides: Partial<MistakeRecord> = {}): MistakeRecord {
  return {
    gameId: 'g1',
    moveNumber: 15,
    leakType: LeakType.TacticalMiss,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    bestMove: 'd4',
    clockAtMoment: 120,
    heuristicReason: 'material_swing',
    engineEval: -200,
    ...overrides,
  }
}

describe('scoreLeaks', () => {
  it('returns empty array when there are no mistakes', () => {
    expect(scoreLeaks([], DEFAULT_TREND)).toEqual([])
  })

  it('does not report a leak below the minimum occurrence threshold', () => {
    const count = MIN_GAMES_FOR_LEAK_PATTERN - 1
    const mistakes = Array.from({ length: count }, (_, i) =>
      makeMistake({ gameId: `g${i}` }),
    )
    // Pass count to be explicit, though it would fallback to mistakes count
    expect(scoreLeaks(mistakes, DEFAULT_TREND, count)).toHaveLength(0)
  })

  it('reports a leak when occurrences meet the minimum threshold', () => {
    const count = MIN_GAMES_FOR_LEAK_PATTERN
    const mistakes = Array.from({ length: count }, (_, i) =>
      makeMistake({ gameId: `g${i}` }),
    )
    const result = scoreLeaks(mistakes, DEFAULT_TREND, count)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(LeakType.TacticalMiss)
  })

  it('caps output at MAX_LEAKS_REPORTED', () => {
    const types = [LeakType.TacticalMiss, LeakType.FlagRisk, LeakType.PreFlagBlunder, LeakType.EarlyResignation]
    const mistakes = types.flatMap((leakType, ti) =>
      Array.from({ length: MIN_GAMES_FOR_LEAK_PATTERN + 1 }, (_, i) =>
        makeMistake({ leakType, gameId: `g${ti}${i}` }),
      ),
    )
    const totalGames = mistakes.length // Each mistake in unique game
    const result = scoreLeaks(mistakes, DEFAULT_TREND, totalGames)
    expect(result.length).toBeLessThanOrEqual(MAX_LEAKS_REPORTED)
  })

  it('boosts time-based leaks when flagRate is high', () => {
    const count = MIN_GAMES_FOR_LEAK_PATTERN + 1
    const mistakes = Array.from({ length: count }, (_, i) =>
      makeMistake({ leakType: LeakType.FlagRisk, gameId: `g${i}` }),
    )

    const lowFlagTrend: TrendReport = { ...DEFAULT_TREND, flagRate: 0.05 }
    const highFlagTrend: TrendReport = { ...DEFAULT_TREND, flagRate: 0.4 }

    const lowScore = scoreLeaks(mistakes, lowFlagTrend, count)[0].score
    const highScore = scoreLeaks(mistakes, highFlagTrend, count)[0].score

    expect(highScore).toBeGreaterThan(lowScore)
  })

  it('populates evidenceGameIds with unique game ids', () => {
    const mistakes = [
      makeMistake({ gameId: 'g1' }),
      makeMistake({ gameId: 'g1' }),
      makeMistake({ gameId: 'g2' }),
    ]
    // Force it to meet threshold for testing
    const fillerCount = MIN_GAMES_FOR_LEAK_PATTERN
    const filler = Array.from({ length: fillerCount }, (_, i) => makeMistake({ gameId: `f${i}` }))
    const allMistakes = [...mistakes, ...filler]
    const totalGames = [...new Set(allMistakes.map(m => m.gameId))].length
    
    const result = scoreLeaks(allMistakes, DEFAULT_TREND, totalGames)
    const leak = result[0]
    expect(leak.evidenceGameIds).toContain('g1')
    expect(leak.evidenceGameIds).toContain('g2')
    expect(new Set(leak.evidenceGameIds).size).toBe(leak.evidenceGameIds.length)
  })

  it('generates a non-empty title and description', () => {
    const count = MIN_GAMES_FOR_LEAK_PATTERN
    const mistakes = Array.from({ length: count }, (_, i) =>
      makeMistake({ gameId: `g${i}` }),
    )
    const result = scoreLeaks(mistakes, DEFAULT_TREND, count)
    expect(result[0].title.length).toBeGreaterThan(0)
    expect(result[0].description.length).toBeGreaterThan(0)
  })
})
