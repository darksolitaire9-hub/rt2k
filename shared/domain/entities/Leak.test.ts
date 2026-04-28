import { describe, it, expect } from 'vitest'
import type { Leak } from './Leak'

function makeLeak(overrides: Partial<Leak> = {}): Leak {
  return {
    type: 'tactics',
    score: 0.8,
    title: 'Tactical blunders',
    description: 'Recurring missed tactics in the middlegame.',
    evidenceGameIds: ['game1', 'game2'],
    ...overrides,
  }
}

describe('Leak', () => {
  it('accepts a valid leak', () => {
    const l = makeLeak()
    expect(l.type).toBe('tactics')
    expect(l.score).toBe(0.8)
    expect(l.evidenceGameIds).toHaveLength(2)
  })

  it('accepts all type values', () => {
    const types = ['time', 'tactics', 'opening', 'structure', 'endgame'] as const
    for (const t of types) {
      expect(makeLeak({ type: t }).type).toBe(t)
    }
  })

  it('score is a number', () => {
    expect(typeof makeLeak().score).toBe('number')
  })

  it('evidenceGameIds is an array of strings', () => {
    const l = makeLeak({ evidenceGameIds: ['a', 'b', 'c'] })
    expect(Array.isArray(l.evidenceGameIds)).toBe(true)
    for (const id of l.evidenceGameIds) {
      expect(typeof id).toBe('string')
    }
  })

  it('requires at least one evidence game (by convention)', () => {
    const l = makeLeak({ evidenceGameIds: ['only-one'] })
    expect(l.evidenceGameIds.length).toBeGreaterThanOrEqual(1)
  })
})
