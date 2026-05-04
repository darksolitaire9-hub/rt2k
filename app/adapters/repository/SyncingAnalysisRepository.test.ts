import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SyncingAnalysisRepository } from './SyncingAnalysisRepository'
import type { AnalysisRun } from '../../../shared/domain/entities/AnalysisRun'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import type { Leak } from '../../../shared/domain/entities/Leak'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'

// Mock dependencies
const mockLocal = {
  save: vi.fn(),
  findById: vi.fn(),
  listByUser: vi.fn(),
  getSyncQueue: vi.fn(),
  removeFromSyncQueue: vi.fn(),
  getFullAnalysis: vi.fn(),
}

const mockRemote = {
  save: vi.fn(),
  findById: vi.fn(),
  listByUser: vi.fn(),
}

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
}

const RUN: AnalysisRun = {
  id: 'run-1',
  sourceType: 'pgn-upload',
  gamesCount: 5,
  createdAt: '2024-01-15T10:00:00Z',
  isPartial: false,
  trendReport: null,
}

describe('SyncingAnalysisRepository', () => {
  let repository: SyncingAnalysisRepository

  beforeEach(() => {
    vi.resetAllMocks()
    repository = new SyncingAnalysisRepository(
      mockLocal as any,
      mockRemote as any,
      mockSupabase as any
    )
  })

  describe('save', () => {
    it('always saves to local and stays in queue if not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      
      await repository.save(RUN, [], [], [])

      expect(mockLocal.save).toHaveBeenCalledWith(RUN, [], [], [])
      expect(mockRemote.save).not.toHaveBeenCalled()
      expect(mockLocal.removeFromSyncQueue).not.toHaveBeenCalled()
    })

    it('saves to remote and removes from queue if logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockRemote.save.mockResolvedValue(undefined)

      await repository.save(RUN, [], [], [])

      expect(mockLocal.save).toHaveBeenCalled()
      expect(mockRemote.save).toHaveBeenCalledWith(RUN, [], [], [])
      expect(mockLocal.removeFromSyncQueue).toHaveBeenCalledWith(RUN.id)
    })

    it('stays in queue if remote save fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockRemote.save.mockRejectedValue(new Error('Network error'))

      await repository.save(RUN, [], [], [])

      expect(mockLocal.save).toHaveBeenCalled()
      expect(mockRemote.save).toHaveBeenCalled()
      expect(mockLocal.removeFromSyncQueue).not.toHaveBeenCalled()
    })
  })

  describe('syncUnsynced', () => {
    it('does nothing if not logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null } })
      
      await repository.syncUnsynced()

      expect(mockLocal.getSyncQueue).not.toHaveBeenCalled()
    })

    it('syncs items in queue when logged in', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockLocal.getSyncQueue.mockResolvedValue(['run-1', 'run-2'])
      mockLocal.getFullAnalysis.mockImplementation(async (id) => ({
        run: { ...RUN, id },
        games: [],
        leaks: [],
        puzzles: []
      }))

      await repository.syncUnsynced()

      expect(mockRemote.save).toHaveBeenCalledTimes(2)
      expect(mockLocal.removeFromSyncQueue).toHaveBeenCalledWith('run-1')
      expect(mockLocal.removeFromSyncQueue).toHaveBeenCalledWith('run-2')
    })

    it('continues sync even if one item fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockLocal.getSyncQueue.mockResolvedValue(['run-1', 'run-2'])
      mockLocal.getFullAnalysis.mockResolvedValue({ run: RUN, games: [], leaks: [], puzzles: [] })
      
      mockRemote.save
        .mockRejectedValueOnce(new Error('Fail first'))
        .mockResolvedValueOnce(undefined)

      await repository.syncUnsynced()

      expect(mockRemote.save).toHaveBeenCalledTimes(2)
      expect(mockLocal.removeFromSyncQueue).toHaveBeenCalledTimes(1)
      expect(mockLocal.removeFromSyncQueue).toHaveBeenCalledWith('run-2')
    })
  })

  describe('findById', () => {
    it('prefers local result', async () => {
      mockLocal.findById.mockResolvedValue(RUN)
      
      const result = await repository.findById('run-1')
      
      expect(result).toBe(RUN)
      expect(mockRemote.findById).not.toHaveBeenCalled()
    })

    it('tries remote if not found locally and logged in', async () => {
      mockLocal.findById.mockResolvedValue(null)
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
      mockRemote.findById.mockResolvedValue(RUN)

      const result = await repository.findById('run-1')

      expect(result).toBe(RUN)
      expect(mockRemote.findById).toHaveBeenCalledWith('run-1')
    })
  })
})
