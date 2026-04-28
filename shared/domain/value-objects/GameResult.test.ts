import { describe, it, expect } from 'vitest'
import { GameResult } from './GameResult'
import type { GameResult as GameResultType } from './GameResult'

describe('GameResult', () => {
  it('has exactly three values', () => {
    expect(Object.keys(GameResult)).toHaveLength(3)
  })

  it('exposes Win, Loss, Draw constants', () => {
    expect(GameResult.Win).toBe('win')
    expect(GameResult.Loss).toBe('loss')
    expect(GameResult.Draw).toBe('draw')
  })

  it('values are strings', () => {
    for (const v of Object.values(GameResult)) {
      expect(typeof v).toBe('string')
    }
  })

  it('type is assignable from the constant values', () => {
    const r: GameResultType = GameResult.Win
    expect(r).toBe('win')
  })
})
