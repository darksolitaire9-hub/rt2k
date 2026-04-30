import { describe, it, expect } from 'vitest'
import { buildPuzzles } from './BuildPuzzles'
import type { MistakeRecord } from '../entities/MistakeRecord'
import { LeakType } from '../value-objects/LeakType'
import { MAX_PUZZLES } from '../config/leakRules'

function makeMistake(overrides: Partial<MistakeRecord> = {}): MistakeRecord {
  return {
    gameId: 'g1',
    moveNumber: 15,
    leakType: LeakType.TacticalMiss,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    bestMove: 'd2d4',
    clockAtMoment: 120,
    heuristicReason: 'material_swing',
    engineEval: -150,
    ...overrides,
  }
}

describe('buildPuzzles', () => {
  it('returns empty array when there are no mistakes', () => {
    const result = buildPuzzles([])
    expect(result).toEqual([])
  })

  it('converts a confirmed MistakeRecord into a UserPuzzle', () => {
    const mistake = makeMistake({
      gameId: 'g1',
      moveNumber: 10,
      fen: 'someFen',
      bestMove: 'Nf3',
      leakType: LeakType.TacticalMiss,
    })
    const result = buildPuzzles([mistake])
    const puzzle = result[0]
    expect(puzzle.sourceGameId).toBe('g1')
    expect(puzzle.sourceMoveNumber).toBe(10)
    expect(puzzle.fen).toBe('someFen')
    expect(puzzle.solution).toBe('Nf3')
    expect(puzzle.leakType).toBe(LeakType.TacticalMiss)
    expect(puzzle.id).toBe('g1-10')
  })

  it('skips mistakes without a bestMove (not yet confirmed by engine)', () => {
    const unconfirmed = makeMistake({ bestMove: null })
    const result = buildPuzzles([unconfirmed])
    expect(result).toHaveLength(0)
  })

  it('caps puzzles at MAX_PUZZLES', () => {
    const mistakes = Array.from({ length: MAX_PUZZLES + 5 }, (_, i) =>
      makeMistake({ gameId: `g${i}`, moveNumber: i + 1 }),
    )
    const result = buildPuzzles(mistakes)
    expect(result.length).toBe(MAX_PUZZLES)
  })
})
