import { describe, it, expect } from 'vitest'
import { LeakType } from './LeakType'
import type { LeakType as LeakTypeType } from './LeakType'

describe('LeakType', () => {
  it('has exactly five values', () => {
    expect(Object.keys(LeakType)).toHaveLength(5)
  })

  it('exposes all five constants', () => {
    expect(LeakType.Time).toBe('time')
    expect(LeakType.Tactics).toBe('tactics')
    expect(LeakType.Opening).toBe('opening')
    expect(LeakType.Structure).toBe('structure')
    expect(LeakType.Endgame).toBe('endgame')
  })

  it('values are strings', () => {
    for (const v of Object.values(LeakType)) {
      expect(typeof v).toBe('string')
    }
  })

  it('type is assignable from the constant values', () => {
    const t: LeakTypeType = LeakType.Tactics
    expect(t).toBe('tactics')
  })
})
