import { describe, it, expect } from 'vitest'
import type { AnalysisRun } from './AnalysisRun'

function makeAnalysisRun(overrides: Partial<AnalysisRun> = {}): AnalysisRun {
  return {
    id: 'run-001',
    sourceType: 'pgn-upload',
    gamesCount: 10,
    createdAt: '2024-01-01T12:00:00Z',
    ...overrides,
  }
}

describe('AnalysisRun', () => {
  it('accepts a valid run', () => {
    const r = makeAnalysisRun()
    expect(r.id).toBe('run-001')
    expect(r.sourceType).toBe('pgn-upload')
    expect(r.gamesCount).toBe(10)
  })

  it('accepts all sourceType values', () => {
    expect(makeAnalysisRun({ sourceType: 'pgn-upload' }).sourceType).toBe('pgn-upload')
    expect(makeAnalysisRun({ sourceType: 'lichess-import' }).sourceType).toBe('lichess-import')
  })

  it('stores gamesCount as a non-negative number', () => {
    const r = makeAnalysisRun({ gamesCount: 0 })
    expect(typeof r.gamesCount).toBe('number')
    expect(r.gamesCount).toBeGreaterThanOrEqual(0)
  })

  it('stores createdAt as a string', () => {
    const r = makeAnalysisRun()
    expect(typeof r.createdAt).toBe('string')
    expect(r.createdAt.length).toBeGreaterThan(0)
  })
})
