import type { LeakType } from '../value-objects/LeakType'
import type { Phase } from '../value-objects/Phase'

export interface MistakeRecord {
  gameId: string
  moveNumber: number
  phase: Phase
  leakType: LeakType
  fenBefore: string
  playedMove: string
  bestMove: string
  evalBefore: number | null
  evalAfter: number | null
  evalSwing: number | null
  timeRemainingSeconds: number | null
  theme: string | null
}
