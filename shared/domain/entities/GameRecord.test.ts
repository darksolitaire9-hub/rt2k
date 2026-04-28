import { describe, it, expect } from 'vitest'
import type { GameRecord } from './GameRecord'

function makeGameRecord(overrides: Partial<GameRecord> = {}): GameRecord {
  return {
    gameId: 'abc123',
    date: '2024-01-01',
    color: 'white',
    result: 'win',
    termination: 'normal',
    openingName: 'Sicilian Defense',
    eco: 'B20',
    myElo: 1500,
    oppElo: 1520,
    timeControl: '600+0',
    moveCount: 40,
    timeLoss: false,
    openingFail: false,
    conversionFail: false,
    ...overrides,
  }
}

describe('GameRecord', () => {
  it('accepts a valid record', () => {
    const r = makeGameRecord()
    expect(r.gameId).toBe('abc123')
    expect(r.color).toBe('white')
    expect(r.result).toBe('win')
    expect(r.termination).toBe('normal')
  })

  it('accepts all color values', () => {
    expect(makeGameRecord({ color: 'white' }).color).toBe('white')
    expect(makeGameRecord({ color: 'black' }).color).toBe('black')
  })

  it('accepts all result values', () => {
    expect(makeGameRecord({ result: 'win' }).result).toBe('win')
    expect(makeGameRecord({ result: 'loss' }).result).toBe('loss')
    expect(makeGameRecord({ result: 'draw' }).result).toBe('draw')
  })

  it('accepts all termination values', () => {
    const terminations = ['normal', 'time', 'resign', 'abandoned'] as const
    for (const t of terminations) {
      expect(makeGameRecord({ termination: t }).termination).toBe(t)
    }
  })

  it('stores boolean flags correctly', () => {
    const r = makeGameRecord({ timeLoss: true, openingFail: true, conversionFail: true })
    expect(r.timeLoss).toBe(true)
    expect(r.openingFail).toBe(true)
    expect(r.conversionFail).toBe(true)
  })

  it('stores elo and move count as numbers', () => {
    const r = makeGameRecord({ myElo: 1800, oppElo: 1750, moveCount: 55 })
    expect(typeof r.myElo).toBe('number')
    expect(typeof r.oppElo).toBe('number')
    expect(typeof r.moveCount).toBe('number')
  })
})
