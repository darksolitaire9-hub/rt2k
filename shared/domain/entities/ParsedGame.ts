import type { GameRecord } from './GameRecord'

export interface ParsedMove {
  moveNumber: number
  san: string
  fenBefore: string
  evalBefore: number | null
  evalAfter: number | null
  timeRemainingSeconds: number | null
}

export interface ParsedGame {
  record: GameRecord
  moves: ParsedMove[]
}
