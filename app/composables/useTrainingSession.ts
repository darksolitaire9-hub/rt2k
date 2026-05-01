import type { UserPuzzle } from '../../shared/domain/entities/UserPuzzle'

// Module-level singleton — persists across route changes like useAnalysis
const snapshot = ref<UserPuzzle[]>([])

export function useTrainingSession() {
  function start(puzzles: UserPuzzle[]): void {
    snapshot.value = [...puzzles]
  }

  function clear(): void {
    snapshot.value = []
  }

  return { snapshot, start, clear }
}
