import { get, set } from 'idb-keyval'
import type { IAnalysisRepositoryPort } from '../../../shared/domain/ports/IAnalysisRepositoryPort'
import type { AnalysisRun } from '../../../shared/domain/entities/AnalysisRun'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import type { Leak } from '../../../shared/domain/entities/Leak'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'

const ANALYSES_KEY = 'rt2k-analyses'
const PUZZLES_KEY = 'rt2k-puzzles'
const SYNC_QUEUE_KEY = 'rt2k-sync-queue'

interface StoredAnalysis {
  run: AnalysisRun
  games: GameRecord[]
  leaks: Leak[]
  puzzles: UserPuzzle[]
}

export class IndexedDbAnalysisRepositoryAdapter implements IAnalysisRepositoryPort {
  async save(run: AnalysisRun, games: GameRecord[], leaks: Leak[], puzzles: UserPuzzle[]): Promise<void> {
    // 1. Save Analysis
    const analyses = (await get<Record<string, StoredAnalysis>>(ANALYSES_KEY)) || {}
    analyses[run.id] = { run, games, leaks, puzzles }
    await set(ANALYSES_KEY, analyses)

    // 2. Save Puzzles (legacy/global store if needed, but we keep them in StoredAnalysis for sync)
    if (puzzles.length > 0) {
      const allPuzzles = (await get<Record<string, UserPuzzle>>(PUZZLES_KEY)) || {}
      for (const p of puzzles) {
        allPuzzles[p.id] = p
      }
      await set(PUZZLES_KEY, allPuzzles)
    }

    // 3. Add to sync queue
    await this.addToSyncQueue(run.id)
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    const analyses = await get<Record<string, StoredAnalysis>>(ANALYSES_KEY)
    if (!analyses || !analyses[id]) return null
    return analyses[id].run
  }

  async getFullAnalysis(id: string): Promise<StoredAnalysis | null> {
    const analyses = await get<Record<string, StoredAnalysis>>(ANALYSES_KEY)
    if (!analyses || !analyses[id]) return null
    return analyses[id]
  }

  async listByUser(_userId: string): Promise<AnalysisRun[]> {
    // IndexedDB local storage is per-browser, so we return all local analyses
    // We don't strictly filter by userId here as there's usually only one user per browser profile
    const analyses = await get<Record<string, StoredAnalysis>>(ANALYSES_KEY)
    if (!analyses) return []
    return Object.values(analyses).map(a => a.run)
  }

  // Sync Queue Methods
  async getSyncQueue(): Promise<string[]> {
    return (await get<string[]>(SYNC_QUEUE_KEY)) || []
  }

  async addToSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue()
    if (!queue.includes(id)) {
      queue.push(id)
      await set(SYNC_QUEUE_KEY, queue)
    }
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const queue = await this.getSyncQueue()
    const index = queue.indexOf(id)
    if (index > -1) {
      queue.splice(index, 1)
      await set(SYNC_QUEUE_KEY, queue)
    }
  }
}
