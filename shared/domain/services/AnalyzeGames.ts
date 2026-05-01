import type { IPgnParserPort, PgnParserOptions } from '../ports/IPgnParserPort'
import type { ParsedGame } from '../entities/ParsedGame'

export function analyzeGames(
  parser: IPgnParserPort,
  pgn: string,
  playerUsername: string,
  options?: PgnParserOptions,
): ParsedGame[] {
  return parser.parse(pgn, playerUsername, options)
}
