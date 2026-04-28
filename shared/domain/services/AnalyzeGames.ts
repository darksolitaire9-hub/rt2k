import type { IPgnParserPort } from '../ports/IPgnParserPort'
import type { ParsedGame } from '../entities/ParsedGame'

export function analyzeGames(
  parser: IPgnParserPort,
  pgn: string,
  playerUsername: string,
): ParsedGame[] {
  return parser.parse(pgn, playerUsername)
}
