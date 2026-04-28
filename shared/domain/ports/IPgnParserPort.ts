import type { GameRecord } from '../entities/GameRecord'

export interface IPgnParserPort {
  parse(pgn: string, playerUsername: string): GameRecord[]
}
