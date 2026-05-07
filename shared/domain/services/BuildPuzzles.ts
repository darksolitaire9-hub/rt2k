import type { MistakeRecord } from '../entities/MistakeRecord'
import type { UserPuzzle } from '../entities/UserPuzzle'
import { MAX_PUZZLES } from '../config/leakRules'

function toUserPuzzle(m: MistakeRecord): UserPuzzle {
  return {
    id: `${m.gameId}-${m.moveNumber}`,
    sourceGameId: m.gameId,
    sourceMoveNumber: m.moveNumber,
    sourceOpponent: m.sourceOpponent,
    sourceDate: m.sourceDate,
    fen: m.fen,
    solution: m.bestMove!,
    clockAtMoment: m.clockAtMoment,
    leakType: m.leakType,
  }
}

/**
 * Builds a balanced pool of puzzles from evaluated mistakes.
 * Instead of just taking the first 100, we ensure every game contributes
 * its most crucial mistakes first ("Fair Share").
 */
export function buildPuzzles(confirmed: MistakeRecord[]): UserPuzzle[] {
  const valid = confirmed.filter(m => m.bestMove !== null)
  if (valid.length === 0) return []

  // 1. Group by Game ID
  const gamesMap = new Map<string, MistakeRecord[]>()
  for (const m of valid) {
    const list = gamesMap.get(m.gameId) ?? []
    list.push(m)
    gamesMap.set(m.gameId, list)
  }

  const result: MistakeRecord[] = []
  const remaining = new Set(valid)

  // 2. Round 1: Take up to 2 "Crucial" mistakes from every single game
  // (Mistakes are already prioritized by TacticalMiss/Impact within each game's list)
  for (const gameId of gamesMap.keys()) {
    const gameMistakes = gamesMap.get(gameId)!
    const slice = gameMistakes.slice(0, 2)
    for (const m of slice) {
      result.push(m)
      remaining.delete(m)
    }
  }

  // 3. Round 2: Fill the rest of the MAX_PUZZLES cap with the best remaining mistakes
  const sortedRemaining = [...remaining].sort((a, b) => {
    // Basic prioritization: tactical misses first, then by impact (engine eval swing)
    // Actually, prioritized list logic was already applied upstream, but let's be safe.
    return 0 
  })

  const leftToFill = MAX_PUZZLES - result.length
  if (leftToFill > 0) {
    result.push(...sortedRemaining.slice(0, leftToFill))
  }

  return result.slice(0, MAX_PUZZLES).map(toUserPuzzle)
}
