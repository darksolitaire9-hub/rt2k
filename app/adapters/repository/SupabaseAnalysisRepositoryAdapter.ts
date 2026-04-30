import type { IAnalysisRepositoryPort } from '../../../shared/domain/ports/IAnalysisRepositoryPort'
import type { AnalysisRun } from '../../../shared/domain/entities/AnalysisRun'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import type { Leak } from '../../../shared/domain/entities/Leak'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'

// Minimal interface compatible with @supabase/supabase-js v2 SupabaseClient
export interface SupabaseClientLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  from(table: string): any
  auth: {
    getUser(): Promise<{ data: { user: { id: string } | null } }>
  }
}

function toRunRow(run: AnalysisRun, userId: string | null): Record<string, unknown> {
  return {
    id: run.id,
    source_type: run.sourceType,
    games_count: run.gamesCount,
    created_at: run.createdAt,
    user_id: userId,
    is_partial: run.isPartial,
  }
}

function fromRunRow(row: Record<string, unknown>): AnalysisRun {
  return {
    id: row['id'] as string,
    sourceType: row['source_type'] as AnalysisRun['sourceType'],
    gamesCount: row['games_count'] as number,
    createdAt: row['created_at'] as string,
    isPartial: (row['is_partial'] as boolean) ?? false,
    trendReport: null,
  }
}

export class SupabaseAnalysisRepositoryAdapter implements IAnalysisRepositoryPort {
  constructor(private readonly db: SupabaseClientLike) {}

  async save(run: AnalysisRun, games: GameRecord[], leaks: Leak[], puzzles: UserPuzzle[]): Promise<void> {
    const { data: authData } = await this.db.auth.getUser()
    const userId = authData?.user?.id ?? null

    const { error: runError } = await this.db.from('analysis_runs').insert([toRunRow(run, userId)])
    if (runError) throw new Error(runError.message)

    if (games.length > 0) {
      const { error } = await this.db.from('game_records').insert(
        games.map(g => ({ ...g, run_id: run.id, user_id: userId })),
      )
      if (error) throw new Error(error.message)
    }

    if (leaks.length > 0) {
      const { error } = await this.db.from('leaks').insert(
        leaks.map(l => ({ ...l, run_id: run.id, user_id: userId })),
      )
      if (error) throw new Error(error.message)
    }

    if (puzzles.length > 0) {
      const { error } = await this.db.from('user_puzzles').insert(
        puzzles.map(p => ({ ...p, run_id: run.id, user_id: userId })),
      )
      if (error) throw new Error(error.message)
    }
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    const { data, error } = await this.db
      .from('analysis_runs')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return fromRunRow(data as Record<string, unknown>)
  }

  async listByUser(userId: string): Promise<AnalysisRun[]> {
    const { data, error } = await this.db
      .from('analysis_runs')
      .select('*')
      .eq('user_id', userId)
    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(fromRunRow)
  }
}
