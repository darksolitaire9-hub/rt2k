import type { ParsedGame } from '../entities/ParsedGame'

export interface IPgnParserPort {
  parse(pgn: string, playerUsername: string): ParsedGame[]
}
