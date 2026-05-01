import { analyzeGames } from '../../domain/services/AnalyzeGames'
import { computeTrend } from '../../domain/services/ComputeTrend'
import { detectMistakes } from '../../domain/services/DetectMistakes'
import { scoreLeaks } from '../../domain/services/ScoreLeaks'
import { buildPuzzles } from '../../domain/services/BuildPuzzles'
import type { IPgnParserPort } from '../../domain/ports/IPgnParserPort'
import type { IEnginePort, EvalOptions } from '../../domain/ports/IEnginePort'
import type { GameRecord } from '../../domain/entities/GameRecord'
import type { Leak } from '../../domain/entities/Leak'
import type { UserPuzzle } from '../../domain/entities/UserPuzzle'
import type { MistakeRecord } from '../../domain/entities/MistakeRecord'
import type { TrendReport } from '../../domain/entities/TrendReport'
import { LeakType } from '../../domain/value-objects/LeakType'
import {
  ENGINE_SEARCH_DEPTH_DEEP,
  ENGINE_MOVETIME_BURST,
  MAX_GAMES_PER_ANALYSIS_RUN,
  MAX_EVALS_BURST,
  MAX_EVALS_MID,
  MAX_EVALS_FULL,
  BURST_GAME_LIMIT,
  MID_GAME_LIMIT,
} from '../../domain/config/leakRules'

// Re-export so composables don't need to reach into domain config directly
export { BURST_GAME_LIMIT, MID_GAME_LIMIT, MAX_GAMES_PER_ANALYSIS_RUN }

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

export type AnalysisTier = 'burst' | 'mid' | 'deep'

// Deep tier uses fixed depth for thoroughness; burst/mid use a time cap so
// latency is bounded regardless of position complexity.
function evalOptionsFor(tier: AnalysisTier): EvalOptions {
  if (tier === 'deep') return { depth: ENGINE_SEARCH_DEPTH_DEEP }
  return { movetime: ENGINE_MOVETIME_BURST }
}

function maxEvalsFor(tier: AnalysisTier): number {
  if (tier === 'burst') return MAX_EVALS_BURST
  if (tier === 'mid') return MAX_EVALS_MID
  return MAX_EVALS_FULL
}

export async function analyzePgn(
  pgn: string,
  playerUsername: string,
  parser: IPgnParserPort,
  engine: IEnginePort,
  days: number = 90,
  onProgress?: ProgressCallback,
  gameLimit: number = MAX_GAMES_PER_ANALYSIS_RUN,
  tier: AnalysisTier = 'burst',
  sharedCache: Map<string, { score: number; bestMove: string }> = new Map(),
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

  const candidates = prioritized.slice(0, maxEvalsFor(tier))

  // Use shared cache so positions evaluated in earlier tiers aren't re-evaluated
  const evalCache = sharedCache
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
      const { score, bestMove } = await engine.evaluate(candidate.fen, evalOptionsFor(tier))
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
