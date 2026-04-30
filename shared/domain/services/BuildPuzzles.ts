import type { MistakeRecord } from '../entities/MistakeRecord'
import type { UserPuzzle } from '../entities/UserPuzzle'
import { MAX_PUZZLES } from '../config/leakRules'

function toUserPuzzle(m: MistakeRecord): UserPuzzle {
  return {
    id: `${m.gameId}-${m.moveNumber}`,
    sourceGameId: m.gameId,
    sourceMoveNumber: m.moveNumber,
    fen: m.fen,
    solution: m.bestMove!,
    clockAtMoment: m.clockAtMoment,
    leakType: m.leakType,
  }
}

export function buildPuzzles(confirmed: MistakeRecord[]): UserPuzzle[] {
  return confirmed
    .filter(m => m.bestMove !== null)
    .slice(0, MAX_PUZZLES)
    .map(toUserPuzzle)
}
