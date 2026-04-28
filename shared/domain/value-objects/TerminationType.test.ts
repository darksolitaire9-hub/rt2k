import { describe, it, expect } from 'vitest'
import { TerminationType } from './TerminationType'
import type { TerminationType as TerminationTypeType } from './TerminationType'

describe('TerminationType', () => {
  it('has exactly five values', () => {
    expect(Object.keys(TerminationType)).toHaveLength(5)
  })

  it('exposes all five constants', () => {
    expect(TerminationType.Normal).toBe('normal')
    expect(TerminationType.Time).toBe('time')
    expect(TerminationType.Resign).toBe('resign')
    expect(TerminationType.Abandoned).toBe('abandoned')
    expect(TerminationType.Other).toBe('other')
  })

  it('values are strings', () => {
    for (const v of Object.values(TerminationType)) {
      expect(typeof v).toBe('string')
    }
  })

  it('type is assignable from the constant values', () => {
    const t: TerminationTypeType = TerminationType.Resign
    expect(t).toBe('resign')
  })
})
