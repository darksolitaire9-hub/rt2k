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

function toAnalysesRow(run: AnalysisRun, games: GameRecord[], leaks: Leak[], userId: string | null): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, gamesCount, createdAt, ...summary } = run
  return {
    id: run.id,
    user_id: userId,
    created_at: run.createdAt,
    game_count: run.gamesCount,
    summary,
    games,
    leaks,
  }
}

function fromAnalysesRow(row: Record<string, unknown>): AnalysisRun {
  const summary = (row['summary'] as Record<string, unknown>) || {}
  return {
    id: row['id'] as string,
    sourceType: summary['sourceType'] as AnalysisRun['sourceType'],
    gamesCount: row['game_count'] as number,
    createdAt: row['created_at'] as string,
    isPartial: (summary['isPartial'] as boolean) ?? false,
    trendReport: (summary['trendReport'] as AnalysisRun['trendReport']) ?? null,
  }
}

function toPuzzleRow(p: UserPuzzle, userId: string | null): Record<string, unknown> {
  return {
    id: p.id,
    user_id: userId,
    source_game_id: p.sourceGameId,
    source_move_number: p.sourceMoveNumber,
    fen: p.fen,
    best_move: p.solution,
    played_move: 'unknown', // Placeholder as UserPuzzle doesn't have it yet
    leak_type: p.leakType,
    // Optional fields
    theme: null,
    rating_hint: null,
    solved: false,
  }
}

export class SupabaseAnalysisRepositoryAdapter implements IAnalysisRepositoryPort {
  constructor(private readonly db: SupabaseClientLike) {}

  async save(run: AnalysisRun, games: GameRecord[], leaks: Leak[], puzzles: UserPuzzle[]): Promise<void> {
    const { data: authData } = await this.db.auth.getUser()
    const userId = authData?.user?.id ?? null

    const { error: runError } = await this.db.from('analyses').insert([toAnalysesRow(run, games, leaks, userId)])
    if (runError) throw new Error(runError.message)

    if (puzzles.length > 0) {
      const { error } = await this.db.from('puzzles').insert(
        puzzles.map(p => toPuzzleRow(p, userId)),
      )
      if (error) throw new Error(error.message)
    }
  }

  async findById(id: string): Promise<AnalysisRun | null> {
    const { data, error } = await this.db
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return null
    return fromAnalysesRow(data as Record<string, unknown>)
  }

  async listByUser(userId: string): Promise<AnalysisRun[]> {
    const { data, error } = await this.db
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
    if (error || !data) return []
    return (data as Record<string, unknown>[]).map(fromAnalysesRow)
  }
}
