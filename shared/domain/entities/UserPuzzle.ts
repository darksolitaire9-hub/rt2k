import type { LeakType } from '../value-objects/LeakType'

export interface UserPuzzle {
  id: string
  sourceGameId: string
  sourceMoveNumber: number
  fen: string
  solution: string
  clockAtMoment: number | null
  leakType: LeakType
}
