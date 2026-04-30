import type { LeakType } from '../value-objects/LeakType'

export interface MistakeRecord {
  gameId: string
  moveNumber: number
  fen: string
  leakType: LeakType
  clockAtMoment: number | null
  heuristicReason: string
  engineEval: number | null
  bestMove: string | null
}
