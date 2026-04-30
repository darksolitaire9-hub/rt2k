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
import { ENGINE_SEARCH_DEPTH, MAX_GAMES_PER_ANALYSIS_RUN } from '../../domain/config/leakRules'

export interface AnalysisResult {
  games: GameRecord[]
  mistakes: MistakeRecord[]
  leaks: Leak[]
  puzzles: UserPuzzle[]
  isPartial: boolean
  trendReport: TrendReport
}

export type ProgressCallback = (data: { stage: 'parsing' | 'detecting' | 'evaluating'; current: number; total: number }) => void

export async function analyzePgn(
  pgn: string,
  playerUsername: string,
  parser: IPgnParserPort,
  engine: IEnginePort,
  days: number = 90,
  onProgress?: ProgressCallback
): Promise<AnalysisResult> {
  onProgress?.({ stage: 'parsing', current: 0, total: 1 })
  const parsedGames = analyzeGames(parser, pgn, playerUsername)

  // 1. Filter by Date (User selected days) or fallback
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  const recentGames = parsedGames.filter(g => {
    const dateStr = g.record.date.replace(/\./g, '-') // YYYY.MM.DD -> YYYY-MM-DD
    const gameDate = new Date(dateStr)
    return !isNaN(gameDate.getTime()) && gameDate >= cutoff
  })

  // Use recentGames if we have enough, otherwise fallback to last N games
  const pool = recentGames.length >= 20 ? recentGames : parsedGames
  const isCapped = pool.length > MAX_GAMES_PER_ANALYSIS_RUN
  const capped = isCapped 
    ? pool.slice(-MAX_GAMES_PER_ANALYSIS_RUN) 
    : pool

  const games = capped.map(g => g.record)
  const isPartial = isCapped || games.some(g => g.clockPerMove.every(c => c === null))

  onProgress?.({ stage: 'detecting', current: 0, total: 1 })
  const trendReport = computeTrend(games)
  const candidates = detectMistakes(capped)

  // 2. Parallel Evaluation with Concurrency Limit
  const confirmed: MistakeRecord[] = []
  const totalCandidates = candidates.length
  const CONCURRENCY = 3
  
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const chunk = candidates.slice(i, i + CONCURRENCY)
    onProgress?.({ stage: 'evaluating', current: i, total: totalCandidates })
    
    const results = await Promise.all(chunk.map(async (candidate) => {
      try {
        const { score, bestMove } = await engine.evaluate(candidate.fen, ENGINE_SEARCH_DEPTH)
        console.log(`[Trace] Eval ${candidate.gameId} m${candidate.moveNumber}: score=${score}, best=${bestMove}, type=${candidate.leakType}`)
        return { ...candidate, engineEval: score, bestMove }
      } catch (e) {
        console.error(`[Trace] Engine failed for ${candidate.gameId} m${candidate.moveNumber}:`, e)
        return null
      }
    }))

    for (const r of results) {
      if (r) confirmed.push(r)
    }
  }

  onProgress?.({ stage: 'evaluating', current: totalCandidates, total: totalCandidates })

  const leaks = scoreLeaks(confirmed, trendReport)
  const puzzles = buildPuzzles(confirmed)

  return { games, mistakes: confirmed, leaks, puzzles, isPartial, trendReport }
}
