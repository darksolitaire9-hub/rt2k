import { describe, it, expect } from 'vitest'
import type { MistakeRecord } from './MistakeRecord'

function makeMistakeRecord(overrides: Partial<MistakeRecord> = {}): MistakeRecord {
  return {
    gameId: 'abc123',
    moveNumber: 20,
    phase: 'middlegame',
    leakType: 'tactics',
    fenBefore: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    playedMove: 'e2e4',
    bestMove: 'd2d4',
    evalBefore: 15,
    evalAfter: -120,
    evalSwing: -135,
    timeRemainingSeconds: 180,
    theme: 'fork',
    ...overrides,
  }
}

describe('MistakeRecord', () => {
  it('accepts a valid record', () => {
    const r = makeMistakeRecord()
    expect(r.gameId).toBe('abc123')
    expect(r.moveNumber).toBe(20)
    expect(r.phase).toBe('middlegame')
    expect(r.leakType).toBe('tactics')
  })

  it('accepts all phase values', () => {
    const phases = ['opening', 'middlegame', 'endgame'] as const
    for (const p of phases) {
      expect(makeMistakeRecord({ phase: p }).phase).toBe(p)
    }
  })

  it('accepts all leakType values', () => {
    const types = ['time', 'tactics', 'opening', 'structure', 'endgame'] as const
    for (const t of types) {
      expect(makeMistakeRecord({ leakType: t }).leakType).toBe(t)
    }
  })

  it('allows null eval fields for partial analysis', () => {
    const r = makeMistakeRecord({ evalBefore: null, evalAfter: null, evalSwing: null })
    expect(r.evalBefore).toBeNull()
    expect(r.evalAfter).toBeNull()
    expect(r.evalSwing).toBeNull()
  })

  it('allows null time and theme for partial analysis', () => {
    const r = makeMistakeRecord({ timeRemainingSeconds: null, theme: null })
    expect(r.timeRemainingSeconds).toBeNull()
    expect(r.theme).toBeNull()
  })

  it('stores move number as a positive integer', () => {
    const r = makeMistakeRecord({ moveNumber: 1 })
    expect(typeof r.moveNumber).toBe('number')
    expect(r.moveNumber).toBeGreaterThan(0)
  })
})
