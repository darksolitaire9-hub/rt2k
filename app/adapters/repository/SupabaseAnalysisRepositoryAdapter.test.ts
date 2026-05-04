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
  findResult?: Record<string, unknown> | null
  listResults?: Record<string, unknown>[]
  insertError?: string
} = {}): SupabaseClientLike & { inserted: Record<string, unknown[]> } {
  const inserted: Record<string, unknown[]> = {}
  const {
    userId = 'user-123',
    findResult = null,
    listResults = [],
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
                  return { data: findResult, error: null }
                },
                then(resolve: (v: unknown) => void) {
                  resolve({ data: listResults, error: null })
                },
              }
            },
          }
        },
      }
    },
  }
}

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

describe('SupabaseAnalysisRepositoryAdapter', () => {
  it('inserts into analyses table with nested JSON for games and leaks', async () => {
    const db = makeMockDb()
    const adapter = new SupabaseAnalysisRepositoryAdapter(db)
    await adapter.save(RUN, [GAME], [LEAK], [])
    
    const [row] = db.inserted['analyses'] as Record<string, unknown>[]
    expect(row['id']).toBe('run-1')
    expect(row['user_id']).toBe('user-123')
    expect(row['game_count']).toBe(5)
    expect(row['created_at']).toBe('2024-01-15T10:00:00Z')
    
    const summary = row['summary'] as any
    expect(summary['sourceType']).toBe('pgn-upload')
    expect(summary['isPartial']).toBe(false)
    
    const games = row['games'] as GameRecord[]
    expect(games[0].gameId).toBe('g1')
    
    const leaks = row['leaks'] as Leak[]
    expect(leaks[0].type).toBe(LeakType.TacticalMiss)
  })

  it('inserts into puzzles table with mapped columns', async () => {
    const db = makeMockDb()
    await new SupabaseAnalysisRepositoryAdapter(db).save(RUN, [], [], [PUZZLE])
    const [row] = db.inserted['puzzles'] as Record<string, unknown>[]
    expect(row['id']).toBe('p1')
    expect(row['user_id']).toBe('user-123')
    expect(row['source_game_id']).toBe('g1')
    expect(row['source_move_number']).toBe(20)
    expect(row['best_move']).toBe('Nf3')
    expect(row['played_move']).toBe('unknown')
  })

  it('findById returns a mapped AnalysisRun from analyses table', async () => {
    const db = makeMockDb({
      findResult: { 
        id: 'run-1', 
        user_id: 'user-123',
        game_count: 5, 
        created_at: '2024-01-15T10:00:00Z',
        summary: { sourceType: 'pgn-upload', isPartial: false, trendReport: null },
        games: [],
        leaks: []
      },
    })
    const result = await new SupabaseAnalysisRepositoryAdapter(db).findById('run-1')
    expect(result).toEqual(RUN)
  })

  it('listByUser returns mapped AnalysisRun array from analyses table', async () => {
    const db = makeMockDb({
      listResults: [
        { 
          id: 'run-1', 
          game_count: 5, 
          created_at: '2024-01-15T10:00:00Z', 
          summary: { sourceType: 'pgn-upload', isPartial: false, trendReport: null },
          games: [],
          leaks: []
        },
        { 
          id: 'run-2', 
          game_count: 10, 
          created_at: '2024-01-16T10:00:00Z', 
          summary: { sourceType: 'lichess-import', isPartial: true, trendReport: null },
          games: [],
          leaks: []
        },
      ],
    })
    const result = await new SupabaseAnalysisRepositoryAdapter(db).listByUser('user-123')
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual(RUN)
    expect(result[1].sourceType).toBe('lichess-import')
    expect(result[1].isPartial).toBe(true)
  })
})
