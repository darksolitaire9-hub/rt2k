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
  totalGamesInWindow: number
}

export type ProgressCallback = (data: { stage: 'parsing' | 'detecting' | 'evaluating'; current: number; total: number }) => void

export async function analyzePgn(
  pgn: string,
  playerUsername: string,
  parser: IPgnParserPort,
  engine: IEnginePort,
  days: number = 90,
  onProgress?: ProgressCallback,
  gameLimit: number = MAX_GAMES_PER_ANALYSIS_RUN
): Promise<AnalysisResult> {
  onProgress?.({ stage: 'parsing', current: 0, total: 1 })
  const parsedGames = analyzeGames(parser, pgn, playerUsername)

  // 1. Filter by Date (User selected days) or fallback
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)
  
  const inWindow = parsedGames.filter(g => {
    const dateStr = g.record.date.replace(/\./g, '-') // YYYY.MM.DD -> YYYY-MM-DD
    const gameDate = new Date(dateStr)
    return !isNaN(gameDate.getTime()) && gameDate >= cutoff
  })

  // Use inWindow if we have enough, otherwise fallback to last N games
  const pool = inWindow.length >= 20 ? inWindow : parsedGames
  const totalInWindow = pool.length

  const isCapped = pool.length > gameLimit
  const capped = isCapped 
    ? pool.slice(-gameLimit) 
    : pool

  const games = capped.map(g => g.record)
  const isPartial = isCapped || games.some(g => g.clockPerMove.every(c => c === null))

  onProgress?.({ stage: 'detecting', current: 0, total: 1 })
  const trendReport = computeTrend(games)
  const allCandidates = detectMistakes(capped)
  
  // 2. Prioritize and Cap Candidates
  // We prioritize Tactical Misses as they make the best puzzles
  const prioritized = [
    ...allCandidates.filter(c => c.leakType === 'TACTICAL_MISS'),
    ...allCandidates.filter(c => c.leakType !== 'TACTICAL_MISS')
  ]
  
  const MAX_EVALS = 100
  const candidates = prioritized.slice(0, MAX_EVALS)

  // 3. Parallel Evaluation with Caching and Pool-aware Concurrency
  const confirmed: MistakeRecord[] = []
  const evalCache = new Map<string, { score: number, bestMove: string }>()
  const totalCandidates = candidates.length
  const CONCURRENCY = 3 // Matches StockfishWasmAdapter POOL_SIZE
  
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    const chunk = candidates.slice(i, i + CONCURRENCY)
    onProgress?.({ stage: 'evaluating', current: i, total: totalCandidates })
    
    const results = await Promise.all(chunk.map(async (candidate) => {
      // Check Cache
      if (evalCache.has(candidate.fen)) {
        const cached = evalCache.get(candidate.fen)!
        return { ...candidate, engineEval: cached.score, bestMove: cached.bestMove }
      }

      try {
        const { score, bestMove } = await engine.evaluate(candidate.fen, ENGINE_SEARCH_DEPTH)
        evalCache.set(candidate.fen, { score, bestMove })
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

  return { games, mistakes: confirmed, leaks, puzzles, isPartial, trendReport, totalGamesInWindow: totalInWindow }
}
