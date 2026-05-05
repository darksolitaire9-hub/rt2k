import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IndexedDbAnalysisRepositoryAdapter } from './IndexedDbAnalysisRepositoryAdapter'
import { GameResult } from '../../../shared/domain/value-objects/GameResult'
import { TerminationType } from '../../../shared/domain/value-objects/TerminationType'
import { LeakType } from '../../../shared/domain/value-objects/LeakType'
import type { AnalysisRun } from '../../../shared/domain/entities/AnalysisRun'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import type { Leak } from '../../../shared/domain/entities/Leak'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'

// Mock idb-keyval
const mockStore: Record<string, any> = {}

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => mockStore[key]),
  set: vi.fn(async (key: string, val: any) => {
    mockStore[key] = val
  }),
  update: vi.fn(async (key: string, updater: (val: any) => any) => {
    mockStore[key] = updater(mockStore[key])
  })
}))

const RUN: AnalysisRun = {
  id: 'run-1',
  sourceType: 'pgn-upload',
  gamesCount: 5,
  createdAt: '2024-01-15T10:00:00Z',
  isPartial: false,
  trendReport: null,
}

const GAME: GameRecord = {
  gameId: 'g1', date: '2024.01.15', color: 'white', result: GameResult.Win,
  termination: TerminationType.Normal, openingName: 'Italian Game', eco: 'C50',
  myElo: 1800, oppElo: 1750, timeControl: '180+2', moveCount: 35,
  timeLoss: false, openingFail: false, conversionFail: false,
  clockPerMove: [],
}

const LEAK: Leak = {
  type: LeakType.TacticalMiss, score: 12.5, title: 'Tactical blunders',
  description: 'Frequent piece drops', evidenceGameIds: ['g1', 'g2'],
}

const PUZZLE: UserPuzzle = {
  id: 'p1', sourceGameId: 'g1', sourceMoveNumber: 20,
  sourceOpponent: 'Opponent', sourceDate: '2024.01.15',
  fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  solution: 'Nf3', clockAtMoment: 60, leakType: LeakType.TacticalMiss,
}

describe('IndexedDbAnalysisRepositoryAdapter', () => {
  beforeEach(() => {
    // Clear mock store
    for (const key in mockStore) {
      delete mockStore[key]
    }
    vi.clearAllMocks()
  })

  it('saves analysis and puzzles and adds to sync queue', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    await adapter.save(RUN, [GAME], [LEAK], [PUZZLE])

    expect(mockStore['rt2k-analyses']['run-1']).toBeDefined()
    expect(mockStore['rt2k-analyses']['run-1'].run).toEqual(RUN)
    expect(mockStore['rt2k-puzzles']['p1']).toEqual(PUZZLE)
    expect(mockStore['rt2k-sync-queue']).toContain('run-1')
  })

  it('findById returns the analysis run', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    await adapter.save(RUN, [GAME], [LEAK], [])
    
    const result = await adapter.findById('run-1')
    expect(result).toEqual(RUN)
  })

  it('findById returns null if not found', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    const result = await adapter.findById('non-existent')
    expect(result).toBeNull()
  })

  it('listByUser returns all analyses (local storage)', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    await adapter.save(RUN, [GAME], [LEAK], [])
    
    const RUN2 = { ...RUN, id: 'run-2' }
    await adapter.save(RUN2, [], [], [])
    
    const results = await adapter.listByUser('any-user')
    expect(results).toHaveLength(2)
    expect(results.some(r => r.id === 'run-1')).toBe(true)
    expect(results.some(r => r.id === 'run-2')).toBe(true)
  })

  it('manages sync queue', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    
    await adapter.addToSyncQueue('run-1')
    await adapter.addToSyncQueue('run-2')
    expect(await adapter.getSyncQueue()).toEqual(['run-1', 'run-2'])
    
    await adapter.removeFromSyncQueue('run-1')
    expect(await adapter.getSyncQueue()).toEqual(['run-2'])
    
    // Test duplicate avoidance
    await adapter.addToSyncQueue('run-2')
    expect(await adapter.getSyncQueue()).toEqual(['run-2'])
  })

  it('getLatestAnalysis returns the most recent analysis', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    const RUN_OLD = { ...RUN, id: 'old', createdAt: '2023-01-01T00:00:00Z' }
    const RUN_NEW = { ...RUN, id: 'new', createdAt: '2024-01-01T00:00:00Z' }
    
    await adapter.save(RUN_OLD, [], [], [])
    await adapter.save(RUN_NEW, [], [], [])
    
    const latest = await adapter.getLatestAnalysis()
    expect(latest?.run.id).toBe('new')
  })

  it('updatePuzzleSolved updates status and adds to puzzle sync queue', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    await adapter.save(RUN, [], [], [PUZZLE])
    
    await adapter.updatePuzzleSolved('p1')
    
    // Check global store
    expect(mockStore['rt2k-puzzles']['p1'].solved).toBe(true)
    
    // Check analysis store
    expect(mockStore['rt2k-analyses']['run-1'].puzzles[0].solved).toBe(true)
    
    // Check puzzle sync queue
    expect(await adapter.getPuzzleSyncQueue()).toContain('p1')
  })

  it('safely sanitizes objects to prevent DataCloneError from Proxies', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    
    // Create an object that is technically uncloneable by native structuredClone (contains a function)
    const uncloneableRun = {
      ...RUN,
      uncloneable: () => 'i am a function'
    } as any

    await adapter.save(uncloneableRun, [], [], [])

    const saved = await adapter.getFullAnalysis('run-1')
    expect(saved?.run.id).toBe('run-1')
    // Function should be stripped by JSON fallback
    expect((saved?.run as any).uncloneable).toBeUndefined()
  })

  it('manages puzzle sync queue', async () => {
    const adapter = new IndexedDbAnalysisRepositoryAdapter()
    
    await adapter.addToPuzzleSyncQueue('p1')
    await adapter.addToPuzzleSyncQueue('p2')
    expect(await adapter.getPuzzleSyncQueue()).toEqual(['p1', 'p2'])
    
    await adapter.removeFromPuzzleSyncQueue('p1')
    expect(await adapter.getPuzzleSyncQueue()).toEqual(['p2'])
  })
})
