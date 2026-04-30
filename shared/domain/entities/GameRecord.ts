import type { GameResult } from '../value-objects/GameResult'
import type { TerminationType } from '../value-objects/TerminationType'

export interface GameRecord {
  gameId: string
  date: string
  color: 'white' | 'black'
  result: GameResult
  termination: TerminationType
  openingName: string
  eco: string
  myElo: number
  oppElo: number
  timeControl: string
  moveCount: number
  timeLoss: boolean
  openingFail: boolean
  conversionFail: boolean
  clockPerMove: (number | null)[]
}
