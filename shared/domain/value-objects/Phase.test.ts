import { describe, it, expect } from 'vitest'
import { Phase } from './Phase'
import type { Phase as PhaseType } from './Phase'

describe('Phase', () => {
  it('has exactly three values', () => {
    expect(Object.keys(Phase)).toHaveLength(3)
  })

  it('exposes all three constants', () => {
    expect(Phase.Opening).toBe('opening')
    expect(Phase.Middlegame).toBe('middlegame')
    expect(Phase.Endgame).toBe('endgame')
  })

  it('values are strings', () => {
    for (const v of Object.values(Phase)) {
      expect(typeof v).toBe('string')
    }
  })

  it('type is assignable from the constant values', () => {
    const p: PhaseType = Phase.Middlegame
    expect(p).toBe('middlegame')
  })
})
