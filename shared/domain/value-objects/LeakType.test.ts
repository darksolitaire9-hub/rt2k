import { describe, it, expect } from 'vitest'
import { LeakType } from './LeakType'
import type { LeakType as LeakTypeType } from './LeakType'

describe('LeakType', () => {
  it('has exactly four values', () => {
    expect(Object.keys(LeakType)).toHaveLength(4)
  })

  it('exposes all four constants', () => {
    expect(LeakType.FlagRisk).toBe('FLAG_RISK')
    expect(LeakType.PreFlagBlunder).toBe('PRE_FLAG_BLUNDER')
    expect(LeakType.TacticalMiss).toBe('TACTICAL_MISS')
    expect(LeakType.EarlyResignation).toBe('EARLY_RESIGNATION')
  })

  it('values are strings', () => {
    for (const v of Object.values(LeakType)) {
      expect(typeof v).toBe('string')
    }
  })

  it('type is assignable from the constant values', () => {
    const t: LeakTypeType = LeakType.TacticalMiss
    expect(t).toBe('TACTICAL_MISS')
  })
})
