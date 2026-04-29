import { analyzeGames } from '../../domain/services/AnalyzeGames'
import { detectMistakes } from '../../domain/services/DetectMistakes'
import { scoreLeaks } from '../../domain/services/ScoreLeaks'
import { buildPuzzles } from '../../domain/services/BuildPuzzles'
import type { IPgnParserPort } from '../../domain/ports/IPgnParserPort'
import type { IEnginePort } from '../../domain/ports/IEnginePort'
import type { IPuzzleSourcePort } from '../../domain/ports/IPuzzleSourcePort'
import type { GameRecord } from '../../domain/entities/GameRecord'
import type { Leak } from '../../domain/entities/Leak'
import type { UserPuzzle } from '../../domain/entities/UserPuzzle'
import type { MistakeRecord } from '../../domain/entities/MistakeRecord'

export interface AnalysisResult {
  games: GameRecord[]
  mistakes: MistakeRecord[]
  leaks: Leak[]
  puzzles: UserPuzzle[]
  isPartial: boolean
}

export async function analyzePgn(
  pgn: string,
  playerUsername: string,
  parser: IPgnParserPort,
  engine: IEnginePort,
  puzzleSource: IPuzzleSourcePort,
): Promise<AnalysisResult> {
  const parsedGames = analyzeGames(parser, pgn, playerUsername)
  const mistakes = await detectMistakes(parsedGames, engine)
  const leaks = scoreLeaks(mistakes)
  const puzzles = await buildPuzzles(mistakes, puzzleSource)

  const games = parsedGames.map(g => g.record)
  const isPartial = parsedGames.some(g =>
    g.moves.every(m => m.evalBefore === null && m.evalAfter === null),
  )

  return { games, mistakes, leaks, puzzles, isPartial }
}
