import type { IAnalysisRepositoryPort } from '../../../shared/domain/ports/IAnalysisRepositoryPort'
import type { AnalysisRun } from '../../../shared/domain/entities/AnalysisRun'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import type { Leak } from '../../../shared/domain/entities/Leak'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'
import type { IndexedDbAnalysisRepositoryAdapter } from './IndexedDbAnalysisRepositoryAdapter'
import type { SupabaseAnalysisRepositoryAdapter, SupabaseClientLike } from './SupabaseAnalysisRepositoryAdapter'

export class SyncingAnalysisRepository implements IAnalysisRepositoryPort {
  constructor(
    private readonly local: IndexedDbAnalysisRepositoryAdapter,
    private readonly remote: SupabaseAnalysisRepositoryAdapter,
    private readonly supabase: SupabaseClientLike
  ) {}

  async save(run: AnalysisRun, games: GameRecord[], leaks: Leak[], puzzles: UserPuzzle[]): Promise<void> {
    // 1. Always save to local first
    await this.local.save(run, games, leaks, puzzles)

    // 2. Check if user is logged in
    const { data } = await this.supabase.auth.getUser()
    if (!data.user) {
      return // Stay in local sync queue
    }

    // 3. Try to save to remote
    try {
      await this.remote.save(run, games, leaks, puzzles)
      // 4. If remote succeeds, remove from sync queue
      await this.local.removeFromSyncQueue(run.id)
    } catch (error) {
      console.error('Failed to sync to remote:', error)
      // Stay in sync queue for later retry
    }
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    // Try local first as it's faster and contains offline data
    const localRun = await this.local.findById(id)
    if (localRun) return localRun

    // If not found locally, try remote
    const { data } = await this.supabase.auth.getUser()
    if (data.user) {
      return await this.remote.findById(id)
    }

    return null
  }

  async listByUser(userId: string): Promise<AnalysisRun[]> {
    // This is tricky. Local listByUser might return all local analyses (anonymous).
    // Remote listByUser returns only those for the specific user.
    // For now, we merge or prefer remote if logged in?
    
    // In our case, listByUser is called with a specific userId.
    // If we are logged in, we probably want both?
    
    const { data } = await this.supabase.auth.getUser()
    if (data.user && data.user.id === userId) {
      const remoteRuns = await this.remote.listByUser(userId)
      const localRuns = await this.local.listByUser(userId)
      
      // Merge by ID, preferring local if there's a conflict (as it might have unsynced changes, though runs are mostly immutable)
      const runMap = new Map<string, AnalysisRun>()
      remoteRuns.forEach(r => runMap.set(r.id, r))
      localRuns.forEach(r => runMap.set(r.id, r))
      
      return Array.from(runMap.values()).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }

    return await this.local.listByUser(userId)
  }

  async syncUnsynced(): Promise<void> {
    const { data } = await this.supabase.auth.getUser()
    if (!data.user) return

    const queue = await this.local.getSyncQueue()
    if (queue.length === 0) return

    console.info(`Syncing ${queue.length} unsynced analyses...`)

    for (const id of queue) {
      try {
        const full = await this.local.getFullAnalysis(id)
        if (full) {
          await this.remote.save(full.run, full.games, full.leaks, full.puzzles)
          await this.local.removeFromSyncQueue(id)
        } else {
          // ID in queue but not found? Remove it to avoid stuck queue
          await this.local.removeFromSyncQueue(id)
        }
      } catch (error) {
        console.error(`Failed to sync analysis ${id}:`, error)
        // Stop processing queue on error? Or continue? 
        // Better to continue and try others.
      }
    }
  }
}
