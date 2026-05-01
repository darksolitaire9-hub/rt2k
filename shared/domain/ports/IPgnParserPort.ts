import type { ParsedGame } from '../entities/ParsedGame'

export interface PgnParserOptions {
  limit?: number
  since?: Date
}

export interface IPgnParserPort {
  parse(pgn: string, playerUsername: string, options?: PgnParserOptions): ParsedGame[]
}
