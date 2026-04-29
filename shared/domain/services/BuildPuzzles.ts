import type { MistakeRecord } from '../entities/MistakeRecord'
import type { UserPuzzle } from '../entities/UserPuzzle'
import type { IPuzzleSourcePort } from '../ports/IPuzzleSourcePort'
import type { LeakType } from '../value-objects/LeakType'
import { MIN_PUZZLES, MAX_PUZZLES, MISTAKE_THRESHOLD_CP } from '../config/leakRules'

function dominantLeakType(mistakes: MistakeRecord[]): LeakType {
  const counts = new Map<LeakType, number>()
  for (const m of mistakes) {
    counts.set(m.leakType, (counts.get(m.leakType) ?? 0) + 1)
  }
  let best: LeakType = 'tactics'
  let max = 0
  for (const [type, count] of counts) {
    if (count > max) { max = count; best = type }
  }
  return best
}

function toUserPuzzle(m: MistakeRecord): UserPuzzle {
  return {
    id: `${m.gameId}-${m.moveNumber}`,
    sourceGameId: m.gameId,
    sourceMoveNumber: m.moveNumber,
    fen: m.fenBefore,
    bestMove: m.bestMove,
    playedMove: m.playedMove,
    theme: m.theme,
    ratingHint: null,
  }
}

export async function buildPuzzles(
  mistakes: MistakeRecord[],
  puzzleSource: IPuzzleSourcePort,
): Promise<UserPuzzle[]> {
  const candidates = mistakes.filter(
    m => m.evalSwing !== null && m.evalSwing >= MISTAKE_THRESHOLD_CP,
  )

  const ownPuzzles = candidates.slice(0, MAX_PUZZLES).map(toUserPuzzle)

  if (ownPuzzles.length >= MIN_PUZZLES) {
    return ownPuzzles.slice(0, MAX_PUZZLES)
  }

  const needed = MIN_PUZZLES - ownPuzzles.length
  const leakType = dominantLeakType(mistakes)
  const external = await puzzleSource.fetch(leakType, needed)

  return [...ownPuzzles, ...external].slice(0, MAX_PUZZLES)
}
