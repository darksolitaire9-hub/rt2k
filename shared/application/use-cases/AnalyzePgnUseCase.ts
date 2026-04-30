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

export async function analyzePgn(
  pgn: string,
  playerUsername: string,
  parser: IPgnParserPort,
  engine: IEnginePort,
): Promise<AnalysisResult> {
  const parsedGames = analyzeGames(parser, pgn, playerUsername)

  // Take the MOST RECENT games (usually at the end of the PGN)
  const isCapped = parsedGames.length > MAX_GAMES_PER_ANALYSIS_RUN
  const capped = isCapped 
    ? parsedGames.slice(-MAX_GAMES_PER_ANALYSIS_RUN) 
    : parsedGames

  const games = capped.map(g => g.record)
  
  // isPartial is true if we capped the games OR if we have significant missing data
  const isPartial = isCapped || games.some(g => g.clockPerMove.every(c => c === null))

  const trendReport = computeTrend(games)
  const candidates = detectMistakes(capped)

  const confirmed: MistakeRecord[] = []
  for (const candidate of candidates) {
    const { score, bestMove } = await engine.evaluate(candidate.fen, ENGINE_SEARCH_DEPTH)
    confirmed.push({ ...candidate, engineEval: score, bestMove })
  }

  const leaks = scoreLeaks(confirmed, trendReport)
  const puzzles = buildPuzzles(confirmed)

  return { games, mistakes: confirmed, leaks, puzzles, isPartial, trendReport }
}
