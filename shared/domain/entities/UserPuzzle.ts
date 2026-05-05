import type { LeakType } from '../value-objects/LeakType'

export interface UserPuzzle {
  id: string
  sourceGameId: string
  sourceMoveNumber: number
  sourceOpponent: string
  sourceDate: string
  fen: string
  solution: string
  clockAtMoment: number | null
  leakType: LeakType
  solved?: boolean
}
