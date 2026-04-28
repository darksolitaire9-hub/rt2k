import type { LeakType } from '../value-objects/LeakType'
import type { UserPuzzle } from '../entities/UserPuzzle'

export interface IPuzzleSourcePort {
  fetch(leakType: LeakType, count: number): Promise<UserPuzzle[]>
}
