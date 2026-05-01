import { analyzeGames } from '../../domain/services/AnalyzeGames'
import { computeTrend } from '../../domain/services/ComputeTrend'
import { detectMistakes } from '../../domain/services/DetectMistakes'
import { scoreLeaks } from '../../domain/services/ScoreLeaks'
import { buildPuzzles } from '../../domain/services/BuildPuzzles'
import type { IPgnParserPort } from '../../domain/ports/IPgnParserPort'
import type { EngineEvaluatorPort, EvalRequest } from '../../domain/ports/EngineEvaluatorPort'
import type { GameRecord } from '../../domain/entities/GameRecord'
import type { Leak } from '../../domain/entities/Leak'
import type { UserPuzzle } from '../../domain/entities/UserPuzzle'
import type { MistakeRecord } from '../../domain/entities/MistakeRecord'
import type { TrendReport } from '../../domain/entities/TrendReport'
import { LeakType } from '../../domain/value-objects/LeakType'
import {
  ENGINE_SEARCH_DEPTH_DEEP,
  ENGINE_MOVETIME_BURST,
  ENGINE_MOVETIME_DEEP,
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

// Deep tier uses more time for thoroughness; burst/mid use a tight time cap.
function movetimeFor(tier: AnalysisTier): number {
  if (tier === 'deep') return ENGINE_MOVETIME_DEEP
  return ENGINE_MOVETIME_BURST
}

function maxEvalsFor(tier: AnalysisTier): number {
  if (tier === 'burst') return MAX_EVALS_BURST
  if (tier === 'mid') return MAX_EVALS_MID
  return MAX_EVALS_FULL
}

export async function analyzePgn(
  pgn: string | ParsedGame[],
  playerUsername: string,
  parser: IPgnParserPort,
  engine: EngineEvaluatorPort,
  days: number = 90,
  onProgress?: ProgressCallback,
  gameLimit: number = MAX_GAMES_PER_ANALYSIS_RUN,
  tier: AnalysisTier = 'burst',
  sharedCache: Map<string, { score: number; bestMove: string }> = new Map(),
): Promise<AnalysisResult> {
  const t0 = performance.now()
  onProgress?.({ stage: 'parsing', current: 0, total: 1 })
  
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  const parsedGames = typeof pgn === 'string' 
    ? analyzeGames(parser, pgn, playerUsername, { since: cutoff, limit: gameLimit + 20 })
    : pgn
  const t1 = performance.now()

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
  const t2 = performance.now()

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

  const toEvaluate = candidates.filter(c => !evalCache.has(c.fen))
  
  // Handle cached items for progress
  completed = candidates.length - toEvaluate.length
  if (completed > 0) {
    onProgress?.({ stage: 'evaluating', current: completed, total: totalCandidates })
  }

  const movetimeMs = movetimeFor(tier)
  const evalRequests: EvalRequest[] = toEvaluate.map(c => ({
    fen: c.fen,
    movetimeMs
  }))

  const tEval0 = performance.now()
  const evalResults = await engine.evaluatePositions(evalRequests)
  const tEval1 = performance.now()
  
  // Store results in cache
  evalResults.forEach(res => {
    evalCache.set(res.fen, { score: res.scoreCp, bestMove: res.bestMoveUci || '' })
  })

  // Reconstruct mistakes from all candidates using the cache
  const confirmed: MistakeRecord[] = candidates.map(candidate => {
    const cached = evalCache.get(candidate.fen)
    if (!cached) return null
    return { ...candidate, engineEval: cached.score, bestMove: cached.bestMove } as MistakeRecord
  }).filter((r): r is MistakeRecord => r !== null)

  // Final progress update
  onProgress?.({ stage: 'evaluating', current: totalCandidates, total: totalCandidates })

  const t3 = performance.now()
  const leaks = scoreLeaks(confirmed, trendReport)
  const puzzles = buildPuzzles(confirmed)
  const t4 = performance.now()

  console.debug(`[AnalyzePgn] ⏱️ Tier: ${tier}
    - Total: ${(t4 - t0).toFixed(1)}ms
    - Parsing: ${(t1 - t0).toFixed(1)}ms
    - Detecting: ${(t2 - t1).toFixed(1)}ms
    - Evaluating: ${(tEval1 - tEval0).toFixed(1)}ms (Positions: ${evalRequests.length})
    - Post-processing: ${(t4 - t3).toFixed(1)}ms`)

  return { games, mistakes: confirmed, leaks, puzzles, isPartial, trendReport, totalGamesInWindow: totalInWindow }
}
