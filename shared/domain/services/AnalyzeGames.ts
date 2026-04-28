import type { IPgnParserPort } from '../ports/IPgnParserPort'
import type { GameRecord } from '../entities/GameRecord'

export function analyzeGames(
  parser: IPgnParserPort,
  pgn: string,
  playerUsername: string,
): GameRecord[] {
  return parser.parse(pgn, playerUsername)
}
