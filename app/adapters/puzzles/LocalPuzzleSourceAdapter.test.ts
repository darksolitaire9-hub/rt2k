import { describe, it, expect } from 'vitest'
import { LocalPuzzleSourceAdapter } from './LocalPuzzleSourceAdapter'
import { LeakType } from '../../../shared/domain/value-objects/LeakType'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'

function makePuzzle(id: string, theme: string | null): UserPuzzle {
  return {
    id,
    sourceGameId: 'external',
    sourceMoveNumber: 0,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    bestMove: 'e2e4',
    playedMove: 'd2d4',
    theme,
    ratingHint: 1200,
  }
}

const CATALOG: UserPuzzle[] = [
  makePuzzle('t1', 'fork'),
  makePuzzle('t2', 'fork'),
  makePuzzle('t3', 'pin'),
  makePuzzle('t4', 'mateIn1'),
  makePuzzle('t5', 'opening'),
  makePuzzle('t6', 'opening'),
  makePuzzle('t7', 'promotion'),
  makePuzzle('t8', 'rookEndgame'),
  makePuzzle('t9', 'backRankMate'),
  makePuzzle('t10', null), // no theme
]

describe('LocalPuzzleSourceAdapter', () => {
  it('returns tactical puzzles for LeakType.Tactics', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Tactics, 10)
    expect(result.every(p => p.theme !== null && ['fork', 'pin', 'skewer', 'discoveredAttack', 'deflection', 'mateIn1', 'mateIn2'].includes(p.theme))).toBe(true)
  })

  it('returns opening puzzles for LeakType.Opening', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Opening, 10)
    expect(result.every(p => p.theme === 'opening' || p.theme === 'advantage')).toBe(true)
  })

  it('returns endgame puzzles for LeakType.Endgame', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Endgame, 10)
    const endgameThemes = new Set(['endgame', 'promotion', 'rookEndgame', 'pawnEndgame'])
    expect(result.every(p => p.theme != null && endgameThemes.has(p.theme))).toBe(true)
  })

  it('returns structure puzzles for LeakType.Structure', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Structure, 10)
    const structureThemes = new Set(['backRankMate', 'promotion', 'pawnStructure'])
    expect(result.every(p => p.theme != null && structureThemes.has(p.theme))).toBe(true)
  })

  it('caps results at the requested count', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Tactics, 2)
    expect(result.length).toBeLessThanOrEqual(2)
  })

  it('returns all matching puzzles when count exceeds catalog size', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Opening, 100)
    // Only 2 opening puzzles in the test catalog
    expect(result.length).toBe(2)
  })

  it('returns empty array when no puzzles match the leak type', async () => {
    const adapter = new LocalPuzzleSourceAdapter([makePuzzle('x', 'opening')])
    const result = await adapter.fetch(LeakType.Endgame, 5)
    expect(result).toHaveLength(0)
  })

  it('excludes puzzles with null theme', async () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    const result = await adapter.fetch(LeakType.Tactics, 100)
    expect(result.every(p => p.theme !== null)).toBe(true)
  })

  it('returns a Promise', () => {
    const adapter = new LocalPuzzleSourceAdapter(CATALOG)
    expect(adapter.fetch(LeakType.Tactics, 1)).toBeInstanceOf(Promise)
  })

  it('uses DEFAULT_CATALOG when no catalog is injected', async () => {
    const adapter = new LocalPuzzleSourceAdapter()
    const result = await adapter.fetch(LeakType.Tactics, 3)
    expect(result.length).toBeGreaterThan(0)
  })
})
