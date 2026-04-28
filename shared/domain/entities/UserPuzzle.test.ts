import { describe, it, expect } from 'vitest'
import type { UserPuzzle } from './UserPuzzle'

function makeUserPuzzle(overrides: Partial<UserPuzzle> = {}): UserPuzzle {
  return {
    id: 'puzzle-1',
    sourceGameId: 'game-abc',
    sourceMoveNumber: 22,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    bestMove: 'e2e4',
    playedMove: 'd2d3',
    theme: 'fork',
    ratingHint: 1400,
    ...overrides,
  }
}

describe('UserPuzzle', () => {
  it('accepts a valid puzzle', () => {
    const p = makeUserPuzzle()
    expect(p.id).toBe('puzzle-1')
    expect(p.sourceGameId).toBe('game-abc')
    expect(p.sourceMoveNumber).toBe(22)
  })

  it('allows null theme when unclassified', () => {
    const p = makeUserPuzzle({ theme: null })
    expect(p.theme).toBeNull()
  })

  it('allows null ratingHint when unknown', () => {
    const p = makeUserPuzzle({ ratingHint: null })
    expect(p.ratingHint).toBeNull()
  })

  it('stores sourceMoveNumber as a positive integer', () => {
    const p = makeUserPuzzle({ sourceMoveNumber: 15 })
    expect(typeof p.sourceMoveNumber).toBe('number')
    expect(p.sourceMoveNumber).toBeGreaterThan(0)
  })

  it('stores fen, bestMove, and playedMove as strings', () => {
    const p = makeUserPuzzle()
    expect(typeof p.fen).toBe('string')
    expect(typeof p.bestMove).toBe('string')
    expect(typeof p.playedMove).toBe('string')
  })
})
