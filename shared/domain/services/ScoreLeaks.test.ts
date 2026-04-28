import { describe, it, expect } from 'vitest'
import { scoreLeaks } from './ScoreLeaks'
import type { MistakeRecord } from '../entities/MistakeRecord'
import { LeakType } from '../value-objects/LeakType'
import { Phase } from '../value-objects/Phase'
import {
  MIN_OCCURRENCES_FOR_LEAK,
  MAX_LEAKS_REPORTED,
  LEAK_WEIGHTS,
} from '../config/leakRules'

function makeMistake(overrides: Partial<MistakeRecord> = {}): MistakeRecord {
  return {
    gameId: 'g1',
    moveNumber: 15,
    phase: Phase.Middlegame,
    leakType: LeakType.Tactics,
    fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playedMove: 'e4',
    bestMove: 'd4',
    evalBefore: 200,
    evalAfter: 0,
    evalSwing: 200,
    timeRemainingSeconds: 120,
    theme: null,
    ...overrides,
  }
}

describe('scoreLeaks', () => {
  it('returns empty array when there are no mistakes', () => {
    expect(scoreLeaks([])).toEqual([])
  })

  it('does not report a leak below the minimum occurrence threshold', () => {
    const mistakes = Array.from({ length: MIN_OCCURRENCES_FOR_LEAK - 1 }, (_, i) =>
      makeMistake({ gameId: `g${i}` }),
    )
    expect(scoreLeaks(mistakes)).toHaveLength(0)
  })

  it('reports a leak when occurrences meet the minimum threshold', () => {
    const mistakes = Array.from({ length: MIN_OCCURRENCES_FOR_LEAK }, (_, i) =>
      makeMistake({ gameId: `g${i}` }),
    )
    const result = scoreLeaks(mistakes)
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe(LeakType.Tactics)
  })

  it('caps output at MAX_LEAKS_REPORTED even with many leak types', () => {
    const types = [LeakType.Tactics, LeakType.Time, LeakType.Opening, LeakType.Endgame]
    const mistakes = types.flatMap((leakType, ti) =>
      Array.from({ length: MIN_OCCURRENCES_FOR_LEAK + 1 }, (_, i) =>
        makeMistake({ leakType, gameId: `g${ti}${i}` }),
      ),
    )
    const result = scoreLeaks(mistakes)
    expect(result.length).toBeLessThanOrEqual(MAX_LEAKS_REPORTED)
  })

  it('returns leaks sorted by score descending', () => {
    // Tactics weight > Time weight — give tactics more occurrences so it scores highest
    const tacticsMistakes = Array.from({ length: 5 }, (_, i) =>
      makeMistake({ leakType: LeakType.Tactics, gameId: `gt${i}`, evalSwing: 300 }),
    )
    const timeMistakes = Array.from({ length: MIN_OCCURRENCES_FOR_LEAK }, (_, i) =>
      makeMistake({ leakType: LeakType.Time, gameId: `gm${i}`, evalSwing: null }),
    )
    const result = scoreLeaks([...timeMistakes, ...tacticsMistakes])
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score)
    }
  })

  it('populates evidenceGameIds with unique game ids for each leak', () => {
    const mistakes = [
      makeMistake({ gameId: 'g1' }),
      makeMistake({ gameId: 'g1' }),  // same game, should appear once
      makeMistake({ gameId: 'g2' }),
    ]
    const result = scoreLeaks(mistakes)
    expect(result[0].evidenceGameIds).toContain('g1')
    expect(result[0].evidenceGameIds).toContain('g2')
    expect(new Set(result[0].evidenceGameIds).size).toBe(result[0].evidenceGameIds.length)
  })

  it('applies LEAK_WEIGHTS to compute score', () => {
    const count = MIN_OCCURRENCES_FOR_LEAK + 1
    const tacticsMistakes = Array.from({ length: count }, (_, i) =>
      makeMistake({ leakType: LeakType.Tactics, gameId: `gt${i}`, evalSwing: 100 }),
    )
    const timeMistakes = Array.from({ length: count }, (_, i) =>
      makeMistake({ leakType: LeakType.Time, gameId: `gm${i}`, evalSwing: null }),
    )
    const result = scoreLeaks([...tacticsMistakes, ...timeMistakes])
    const tactics = result.find(l => l.type === LeakType.Tactics)!
    const time = result.find(l => l.type === LeakType.Time)!
    // Tactics weight (1.5) > Time weight (1.0) with same occurrence count
    expect(tactics.score).toBeGreaterThan(time.score)
    expect(tactics.score / time.score).toBeCloseTo(LEAK_WEIGHTS.tactics / LEAK_WEIGHTS.time, 1)
  })

  it('generates a non-empty title and description for each leak', () => {
    const mistakes = Array.from({ length: MIN_OCCURRENCES_FOR_LEAK }, (_, i) =>
      makeMistake({ gameId: `g${i}` }),
    )
    const result = scoreLeaks(mistakes)
    expect(result[0].title.length).toBeGreaterThan(0)
    expect(result[0].description.length).toBeGreaterThan(0)
  })

  it('handles multiple leak types independently', () => {
    const tactics = Array.from({ length: MIN_OCCURRENCES_FOR_LEAK }, (_, i) =>
      makeMistake({ leakType: LeakType.Tactics, gameId: `gt${i}` }),
    )
    const opening = Array.from({ length: MIN_OCCURRENCES_FOR_LEAK }, (_, i) =>
      makeMistake({ leakType: LeakType.Opening, gameId: `go${i}` }),
    )
    const result = scoreLeaks([...tactics, ...opening])
    const types = result.map(l => l.type)
    expect(types).toContain(LeakType.Tactics)
    expect(types).toContain(LeakType.Opening)
  })
})
