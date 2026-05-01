import { analyzeGames } from '../../domain/services/AnalyzeGames'
import { computeTrend } from '../../domain/services/ComputeTrend'
import { detectMistakes } from '../../domain/services/DetectMistakes'
import { scoreLeaks } from '../../domain/services/ScoreLeaks'
import { buildPuzzles } from '../../domain/services/BuildPuzzles'
import type { IPgnParserPort } from '../../domain/ports/IPgnParserPort'
import type { IEnginePort } from '../../domain/ports/IEnginePort'
import type { GameRecord } from '../../domain/entities/GameRecord'
import type { Leak } from '../../domain/entities/Leak'
import type { UserPuzzle } from '../../domain/entities/UserPuzzle'
import type { MistakeRecord } from '../../domain/entities/MistakeRecord'
import type { TrendReport } from '../../domain/entities/TrendReport'
import { LeakType } from '../../domain/value-objects/LeakType'
import {
  ENGINE_SEARCH_DEPTH,
  ENGINE_SEARCH_DEPTH_FAST,
  ENGINE_SEARCH_DEPTH_DEEP,
  MAX_GAMES_PER_ANALYSIS_RUN,
  MAX_EVALS_BURST,
  MAX_EVALS_FULL,
} from '../../domain/config/leakRules'

export interface AnalysisResult {
  games: GameRecord[]
  mistakes: MistakeRecord[]
  leaks: Leak[]
  puzzles: UserPuzzle[]
  isPartial: boolean
  trendReport: TrendReport
  totalGamesInWindow: number
}

export type ProgressCallback = (data: { stage: 'parsing' | 'detecting' | 'evaluating'; current: number; total: number }) => void

// Depth per leak type — fast positions need a bestMove, not a precise eval
function depthFor(leakType: string, deep: boolean): number {
  if (deep) return ENGINE_SEARCH_DEPTH_DEEP
  if (leakType === LeakType.FlagRisk || leakType === LeakType.PreFlagBlunder) {
    return ENGINE_SEARCH_DEPTH_FAST
  }
  return ENGINE_SEARCH_DEPTH
}

export async function analyzePgn(
  pgn: string,
  playerUsername: string,
  parser: IPgnParserPort,
  engine: IEnginePort,
  days: number = 90,
  onProgress?: ProgressCallback,
  gameLimit: number = MAX_GAMES_PER_ANALYSIS_RUN,
  deep: boolean = false,
): Promise<AnalysisResult> {
  onProgress?.({ stage: 'parsing', current: 0, total: 1 })
  const parsedGames = analyzeGames(parser, pgn, playerUsername)

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const inWindow = parsedGames.filter(g => {
    const dateStr = g.record.date.replace(/\./g, '-')
    const gameDate = new Date(dateStr)
    return !isNaN(gameDate.getTime()) && gameDate >= cutoff
  })

  const pool = inWindow.length >= 20 ? inWindow : parsedGames
  const totalInWindow = pool.length

  const isCapped = pool.length > gameLimit
  const capped = isCapped ? pool.slice(-gameLimit) : pool

  const games = capped.map(g => g.record)
  const isPartial = isCapped || games.some(g => g.clockPerMove.every(c => c === null))

  onProgress?.({ stage: 'detecting', current: 0, total: 1 })
  const trendReport = computeTrend(games)
  const allCandidates = detectMistakes(capped)

  // Prioritise tactical misses — they make the highest-quality puzzles
  const prioritized = [
    ...allCandidates.filter(c => c.leakType === LeakType.TacticalMiss),
    ...allCandidates.filter(c => c.leakType !== LeakType.TacticalMiss),
  ]

  const maxEvals = deep ? MAX_EVALS_FULL : MAX_EVALS_BURST
  const candidates = prioritized.slice(0, maxEvals)

  // Evaluate all candidates concurrently — the worker pool queues internally
  const evalCache = new Map<string, { score: number; bestMove: string }>()
  const totalCandidates = candidates.length
  let completed = 0

  const evalPromises: Promise<MistakeRecord | null>[] = candidates.map(async (candidate) => {
    if (evalCache.has(candidate.fen)) {
      const cached = evalCache.get(candidate.fen)!
      completed++
      onProgress?.({ stage: 'evaluating', current: completed, total: totalCandidates })
      return { ...candidate, engineEval: cached.score, bestMove: cached.bestMove } as MistakeRecord
    }

    try {
      const depth = depthFor(candidate.leakType, deep)
      const { score, bestMove } = await engine.evaluate(candidate.fen, depth)
      evalCache.set(candidate.fen, { score, bestMove })
      completed++
      onProgress?.({ stage: 'evaluating', current: completed, total: totalCandidates })
      return { ...candidate, engineEval: score, bestMove } as MistakeRecord
    } catch {
      completed++
      onProgress?.({ stage: 'evaluating', current: completed, total: totalCandidates })
      return null
    }
  })

  const results = await Promise.all(evalPromises)
  const confirmed: MistakeRecord[] = results.filter((r): r is NonNullable<typeof r> => r !== null)

  const leaks = scoreLeaks(confirmed, trendReport)
  const puzzles = buildPuzzles(confirmed)

  return { games, mistakes: confirmed, leaks, puzzles, isPartial, trendReport, totalGamesInWindow: totalInWindow }
}
