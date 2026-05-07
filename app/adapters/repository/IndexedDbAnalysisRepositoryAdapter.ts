import { get, set, del } from 'idb-keyval'
import type { IAnalysisRepositoryPort } from '#shared/domain/ports/IAnalysisRepositoryPort'
import type { AnalysisRun } from '#shared/domain/entities/AnalysisRun'
import type { GameRecord } from '#shared/domain/entities/GameRecord'
import type { Leak } from '#shared/domain/entities/Leak'
import type { UserPuzzle } from '#shared/domain/entities/UserPuzzle'

const ANALYSIS_INDEX_KEY = 'rt2k-analysis-index'
const PUZZLES_KEY = 'rt2k-puzzles'
const SYNC_QUEUE_KEY = 'rt2k-sync-queue'
const PUZZLE_SYNC_QUEUE_KEY = 'rt2k-puzzle-sync-queue'

function getAnalysisKey(id: string) {
  return `rt2k-analysis-${id}`
}

interface StoredAnalysis {
  run: AnalysisRun
  games: GameRecord[]
  leaks: Leak[]
  puzzles: UserPuzzle[]
}

function sanitize<T>(data: T): T {
  try {
    return structuredClone(data)
  } catch {
    // Fallback for Vue Proxies or objects with uncloneable properties (like methods)
    return JSON.parse(JSON.stringify(data))
  }
}

export class IndexedDbAnalysisRepositoryAdapter implements IAnalysisRepositoryPort {
  async save(run: AnalysisRun, games: GameRecord[], leaks: Leak[], puzzles: UserPuzzle[]): Promise<void> {
    const sRun = sanitize(run)
    const sGames = sanitize(games)
    const sLeaks = sanitize(leaks)
    const sPuzzles = sanitize(puzzles)

    // 1. Save Analysis individually (O(1) IO)
    const analysis: StoredAnalysis = { run: sRun, games: sGames, leaks: sLeaks, puzzles: sPuzzles }
    await set(getAnalysisKey(sRun.id), analysis)

    // 2. Update Index
    const index = (await get<string[]>(ANALYSIS_INDEX_KEY)) || []
    if (!index.includes(sRun.id)) {
      index.push(sRun.id)
      await set(ANALYSIS_INDEX_KEY, index)
    }

    // 3. Save Puzzles globally
    if (sPuzzles.length > 0) {
      const allPuzzles = (await get<Record<string, UserPuzzle>>(PUZZLES_KEY)) || {}
      for (const p of sPuzzles) {
        allPuzzles[p.id] = p
      }
      await set(PUZZLES_KEY, allPuzzles)
    }

    // 4. Add to sync queue
    await this.addToSyncQueue(sRun.id)
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    const analysis = await get<StoredAnalysis>(getAnalysisKey(id))
    return analysis?.run || null
  }

  async getFullAnalysis(id: string): Promise<StoredAnalysis | null> {
    return (await get<StoredAnalysis>(getAnalysisKey(id))) || null
  }

  async listByUser(_userId: string): Promise<AnalysisRun[]> {
    const index = (await get<string[]>(ANALYSIS_INDEX_KEY)) || []
    
    // Load all concurrently (O(N) but non-blocking and faster than sequential)
    const analyses = await Promise.all(index.map(id => get<StoredAnalysis>(getAnalysisKey(id))))
    return analyses.filter((a): a is StoredAnalysis => a !== undefined).map(a => a.run)
  }

  async getLatestAnalysis(): Promise<StoredAnalysis | null> {
    const index = (await get<string[]>(ANALYSIS_INDEX_KEY)) || []
    if (index.length === 0) return null

    // Load all concurrently to find latest
    const all = await Promise.all(index.map(id => get<StoredAnalysis>(getAnalysisKey(id))))
    const valid = all.filter((a): a is StoredAnalysis => a !== undefined)

    if (valid.length === 0) return null
    
    // Sort by createdAt descending and return first
    valid.sort((a, b) => 
      new Date(b.run.createdAt).getTime() - new Date(a.run.createdAt).getTime()
    )
    return valid[0] || null
  }

  async updatePuzzleSolved(id: string): Promise<void> {
    // 1. Update in global puzzles store
    const allPuzzles = (await get<Record<string, UserPuzzle>>(PUZZLES_KEY)) || {}
    const puzzle = allPuzzles[id]
    if (puzzle) {
      puzzle.solved = true
      await set(PUZZLES_KEY, allPuzzles)
    }

    // 2. Update in its specific analysis store (O(1) IO for the correct run)
    const index = (await get<string[]>(ANALYSIS_INDEX_KEY)) || []
    for (const runId of index) {
      const analysis = await get<StoredAnalysis>(getAnalysisKey(runId))
      if (!analysis) continue
      
      const puzzleIndex = analysis.puzzles.findIndex(p => p.id === id)
      if (puzzleIndex !== -1) {
        analysis.puzzles[puzzleIndex]!.solved = true
        await set(getAnalysisKey(runId), analysis)
        break // Puzzles are currently derived from one run
      }
    }

    // 3. Add to puzzle sync queue
    await this.addToPuzzleSyncQueue(id)
  }

  async deleteAnalysis(id: string): Promise<void> {
    await del(getAnalysisKey(id))
    const index = (await get<string[]>(ANALYSIS_INDEX_KEY)) || []
    const newIndex = index.filter(i => i !== id)
    await set(ANALYSIS_INDEX_KEY, newIndex)
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

  // Puzzle Sync Queue Methods
  async getPuzzleSyncQueue(): Promise<string[]> {
    return (await get<string[]>(PUZZLE_SYNC_QUEUE_KEY)) || []
  }

  async addToPuzzleSyncQueue(id: string): Promise<void> {
    const queue = await this.getPuzzleSyncQueue()
    if (!queue.includes(id)) {
      queue.push(id)
      await set(PUZZLE_SYNC_QUEUE_KEY, queue)
    }
  }

  async removeFromPuzzleSyncQueue(id: string): Promise<void> {
    const queue = await this.getPuzzleSyncQueue()
    const index = queue.indexOf(id)
    if (index > -1) {
      queue.splice(index, 1)
      await set(PUZZLE_SYNC_QUEUE_KEY, queue)
    }
  }
}
