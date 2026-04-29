import { describe, it, expect } from 'vitest'
import { buildPuzzles } from './BuildPuzzles'
import type { MistakeRecord } from '../entities/MistakeRecord'
import type { UserPuzzle } from '../entities/UserPuzzle'
import type { IPuzzleSourcePort } from '../ports/IPuzzleSourcePort'
import { LeakType } from '../value-objects/LeakType'
import { Phase } from '../value-objects/Phase'
import {
  MIN_PUZZLES,
  MAX_PUZZLES,
  MISTAKE_THRESHOLD_CP,
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
    evalAfter: -50,
    evalSwing: MISTAKE_THRESHOLD_CP + 50,
    timeRemainingSeconds: 120,
    theme: null,
    ...overrides,
  }
}

function makeExternalPuzzle(id: string): UserPuzzle {
  return {
    id,
    sourceGameId: 'external',
    sourceMoveNumber: 0,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    bestMove: 'e2e4',
    playedMove: 'd2d4',
    theme: 'fork',
    ratingHint: 1400,
  }
}

function makeSource(puzzles: UserPuzzle[] = []): IPuzzleSourcePort & { calls: Array<{ leakType: LeakType; count: number }> } {
  const calls: Array<{ leakType: LeakType; count: number }> = []
  return {
    calls,
    async fetch(leakType, count) {
      calls.push({ leakType, count })
      return puzzles.slice(0, count)
    },
  }
}

describe('buildPuzzles', () => {
  it('returns empty array when there are no mistakes', async () => {
    const result = await buildPuzzles([], makeSource())
    expect(result).toEqual([])
  })

  it('converts a tactical MistakeRecord into a UserPuzzle', async () => {
    const mistake = makeMistake({ gameId: 'g1', moveNumber: 10, fenBefore: 'someFen', playedMove: 'Nd2', bestMove: 'Nf3', theme: 'fork' })
    const result = await buildPuzzles([mistake], makeSource())
    const puzzle = result[0]
    expect(puzzle.sourceGameId).toBe('g1')
    expect(puzzle.sourceMoveNumber).toBe(10)
    expect(puzzle.fen).toBe('someFen')
    expect(puzzle.playedMove).toBe('Nd2')
    expect(puzzle.bestMove).toBe('Nf3')
    expect(puzzle.theme).toBe('fork')
    expect(puzzle.ratingHint).toBeNull()
    expect(puzzle.id).toBe('g1-10')
  })

  it('skips time-only mistakes (evalSwing is null) as they are not puzzle candidates', async () => {
    const timeMistake = makeMistake({ leakType: LeakType.Time, evalSwing: null, evalBefore: null, evalAfter: null })
    const result = await buildPuzzles([timeMistake], makeSource())
    expect(result).toHaveLength(0)
  })

  it('skips mistakes below the puzzle quality threshold', async () => {
    const weak = makeMistake({ evalSwing: MISTAKE_THRESHOLD_CP - 1 })
    const result = await buildPuzzles([weak], makeSource())
    expect(result).toHaveLength(0)
  })

  it('caps own-game puzzles at MAX_PUZZLES', async () => {
    const mistakes = Array.from({ length: MAX_PUZZLES + 5 }, (_, i) =>
      makeMistake({ gameId: `g${i}`, moveNumber: i + 1 }),
    )
    const result = await buildPuzzles(mistakes, makeSource())
    expect(result.length).toBeLessThanOrEqual(MAX_PUZZLES)
  })

  it('does not call puzzleSource when own-game puzzles meet MIN_PUZZLES', async () => {
    const source = makeSource()
    const mistakes = Array.from({ length: MIN_PUZZLES }, (_, i) =>
      makeMistake({ gameId: `g${i}`, moveNumber: i + 1 }),
    )
    await buildPuzzles(mistakes, source)
    expect(source.calls).toHaveLength(0)
  })

  it('supplements with external puzzles when own-game count is below MIN_PUZZLES', async () => {
    const external = Array.from({ length: MIN_PUZZLES }, (_, i) => makeExternalPuzzle(`ext-${i}`))
    const source = makeSource(external)
    const result = await buildPuzzles([], source)
    expect(source.calls).toHaveLength(1)
    expect(result.length).toBeGreaterThan(0)
  })

  it('requests only the number of external puzzles needed to reach MIN_PUZZLES', async () => {
    const ownCount = MIN_PUZZLES - 1
    const mistakes = Array.from({ length: ownCount }, (_, i) =>
      makeMistake({ gameId: `g${i}`, moveNumber: i + 1 }),
    )
    const source = makeSource(Array.from({ length: 5 }, (_, i) => makeExternalPuzzle(`ext-${i}`)))
    await buildPuzzles(mistakes, source)
    expect(source.calls[0].count).toBe(1)
  })

  it('passes the dominant leak type to the puzzle source', async () => {
    const mistakes = [
      makeMistake({ leakType: LeakType.Tactics, evalSwing: null }),  // time-only, excluded from own puzzles
      makeMistake({ leakType: LeakType.Opening, evalSwing: null }),
      makeMistake({ leakType: LeakType.Opening, evalSwing: null }),  // Opening is dominant
    ]
    const source = makeSource(Array.from({ length: MIN_PUZZLES }, (_, i) => makeExternalPuzzle(`ext-${i}`)))
    await buildPuzzles(mistakes, source)
    expect(source.calls[0].leakType).toBe(LeakType.Opening)
  })

  it('caps the combined total at MAX_PUZZLES', async () => {
    const ownMistakes = Array.from({ length: 5 }, (_, i) =>
      makeMistake({ gameId: `g${i}`, moveNumber: i + 1 }),
    )
    const external = Array.from({ length: MAX_PUZZLES }, (_, i) => makeExternalPuzzle(`ext-${i}`))
    const result = await buildPuzzles(ownMistakes, makeSource(external))
    expect(result.length).toBeLessThanOrEqual(MAX_PUZZLES)
  })
})
