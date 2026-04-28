import type { GameResult } from '../value-objects/GameResult'

export interface GameRecord {
  gameId: string
  date: string
  color: 'white' | 'black'
  result: GameResult
  termination: 'normal' | 'time' | 'resign' | 'abandoned'
  openingName: string
  eco: string
  myElo: number
  oppElo: number
  timeControl: string
  moveCount: number
  timeLoss: boolean
  openingFail: boolean
  conversionFail: boolean
}
