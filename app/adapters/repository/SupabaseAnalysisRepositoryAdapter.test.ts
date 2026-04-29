import { describe, it, expect } from 'vitest'
import { SupabaseAnalysisRepositoryAdapter, type SupabaseClientLike } from './SupabaseAnalysisRepositoryAdapter'
import type { AnalysisRun } from '../../../shared/domain/entities/AnalysisRun'
import type { GameRecord } from '../../../shared/domain/entities/GameRecord'
import type { Leak } from '../../../shared/domain/entities/Leak'
import type { UserPuzzle } from '../../../shared/domain/entities/UserPuzzle'
import { GameResult } from '../../../shared/domain/value-objects/GameResult'
import { TerminationType } from '../../../shared/domain/value-objects/TerminationType'
import { LeakType } from '../../../shared/domain/value-objects/LeakType'

function makeMockDb(options: {
  userId?: string
  findRunResult?: Record<string, unknown> | null
  listRunsResult?: Record<string, unknown>[]
  insertError?: string
} = {}): SupabaseClientLike & { inserted: Record<string, unknown[]> } {
  const inserted: Record<string, unknown[]> = {}
  const {
    userId = 'user-123',
    findRunResult = null,
    listRunsResult = [],
    insertError,
  } = options

  return {
    inserted,
    auth: {
      async getUser() {
        return { data: { user: { id: userId } } }
      },
    },
    from(table: string) {
      return {
        async insert(rows: Record<string, unknown>[]) {
          if (insertError) return { error: { message: insertError } }
          inserted[table] = [...(inserted[table] ?? []), ...rows]
          return { error: null }
        },
        select() {
          return {
            eq(_col: string, _val: string) {
              return {
                async single() {
                  return { data: findRunResult, error: null }
                },
                then(resolve: (v: unknown) => void) {
                  resolve({ data: listRunsResult, error: null })
                },
              }
            },
          }
        },
      }
    },
  }
}

const RUN: AnalysisRun = { id: 'run-1', sourceType: 'pgn-upload', gamesCount: 5, createdAt: '2024-01-15T10:00:00Z' }

const GAME: GameRecord = {
  gameId: 'g1', date: '2024.01.15', color: 'white', result: GameResult.Win,
  termination: TerminationType.Normal, openingName: 'Italian Game', eco: 'C50',
  myElo: 1800, oppElo: 1750, timeControl: '180+2', moveCount: 35,
  timeLoss: false, openingFail: false, conversionFail: false,
}

const LEAK: Leak = {
  type: LeakType.Tactics, score: 12.5, title: 'Tactical blunders',
  description: 'Frequent piece drops', evidenceGameIds: ['g1', 'g2'],
}

const PUZZLE: UserPuzzle = {
  id: 'p1', sourceGameId: 'g1', sourceMoveNumber: 20,
  fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
  bestMove: 'Nf3', playedMove: 'Qh5', theme: 'fork', ratingHint: 1400,
}

describe('SupabaseAnalysisRepositoryAdapter', () => {
  it('inserts the analysis run with snake_case columns', async () => {
    const db = makeMockDb()
    const adapter = new SupabaseAnalysisRepositoryAdapter(db)
    await adapter.save(RUN, [], [], [])
    const [row] = db.inserted['analysis_runs'] as Record<string, unknown>[]
    expect(row['id']).toBe('run-1')
    expect(row['source_type']).toBe('pgn-upload')
    expect(row['games_count']).toBe(5)
    expect(row['created_at']).toBe('2024-01-15T10:00:00Z')
    expect(row['user_id']).toBe('user-123')
  })

  it('inserts game records with run_id and user_id', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [GAME], [], [])
    const [row] = db.inserted['game_records'] as Record<string, unknown>[]
    expect(row['gameId']).toBe('g1')
    expect(row['run_id']).toBe('run-1')
    expect(row['user_id']).toBe('user-123')
  })

  it('inserts leaks with run_id', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [LEAK], [])
    const [row] = db.inserted['leaks'] as Record<string, unknown>[]
    expect(row['type']).toBe(LeakType.Tactics)
    expect(row['run_id']).toBe('run-1')
  })

  it('inserts puzzles with run_id', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [], [PUZZLE])
    const [row] = db.inserted['user_puzzles'] as Record<string, unknown>[]
    expect(row['id']).toBe('p1')
    expect(row['run_id']).toBe('run-1')
  })

  it('skips game_records insert when games array is empty', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [], [])
    expect(db.inserted['game_records']).toBeUndefined()
  })

  it('skips leaks insert when leaks array is empty', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [], [])
    expect(db.inserted['leaks']).toBeUndefined()
  })

  it('skips puzzles insert when puzzles array is empty', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [], [])
    expect(db.inserted['user_puzzles']).toBeUndefined()
  })

  it('throws when the analysis_run insert fails', async () => {
    const db = makeMockDb({ insertError: 'DB connection failed' })
    await expect(new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [], [])).rejects.toThrow('DB connection failed')
  })

  it('findById returns null when no row is found', async () => {
    const db = makeMockDb({ findRunResult: null })
    const result = await new SupabaseAnalysisRepositoryAdapter(db).findById('run-1')
    expect(result).toBeNull()
  })

  it('findById returns a mapped AnalysisRun when a row exists', async () => {
    const db = makeMockDb({
      findRunResult: { id: 'run-1', source_type: 'pgn-upload', games_count: 5, created_at: '2024-01-15T10:00:00Z' },
    })
    const result = await new SupabaseAnalysisRepositoryAdapter(db).findById('run-1')
    expect(result).toEqual({ id: 'run-1', sourceType: 'pgn-upload', gamesCount: 5, createdAt: '2024-01-15T10:00:00Z' })
  })

  it('listByUser returns empty array when no runs exist', async () => {
    const db = makeMockDb({ listRunsResult: [] })
    const result = await new SupabaseAnalysisRepositoryAdapter(db).listByUser('user-123')
    expect(result).toEqual([])
  })

  it('listByUser returns mapped AnalysisRun array', async () => {
    const db = makeMockDb({
      listRunsResult: [
        { id: 'run-1', source_type: 'pgn-upload', games_count: 5, created_at: '2024-01-15T10:00:00Z' },
        { id: 'run-2', source_type: 'lichess-import', games_count: 10, created_at: '2024-01-16T10:00:00Z' },
      ],
    })
    const result = await new SupabaseAnalysisRepositoryAdapter(db).listByUser('user-123')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ id: 'run-1', sourceType: 'pgn-upload', gamesCount: 5, createdAt: '2024-01-15T10:00:00Z' })
    expect(result[1].sourceType).toBe('lichess-import')
  })
})
