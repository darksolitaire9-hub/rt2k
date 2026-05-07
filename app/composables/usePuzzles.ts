import { useAnalysis } from './useAnalysis'

export function usePuzzles() {
  const { result, markPuzzleSolved } = useAnalysis()

  const BATCH_SIZE = 20

  // The source of truth is always the live analysis result.
  const allPuzzles = computed(() => {
    return result.value?.puzzles ?? []
  })

  // Derived state: Slotted specifically for the "To Do" list
  const unsolvedPuzzles = computed(() => {
    return allPuzzles.value.filter(p => p.solved !== true)
  })

  // The sliding window: always serve the first 20 unsolved puzzles.
  // As the user solves them, the next ones naturally slide into this slice.
  const activePuzzles = computed(() => {
    return unsolvedPuzzles.value.slice(0, BATCH_SIZE)
  })

  // Derived state: Specifically for the "History" view
  const solvedPuzzles = computed(() => {
    return allPuzzles.value.filter(p => p.solved === true)
  })

  function findById(id: string) {
    return allPuzzles.value.find(p => p.id === id) ?? null
  }

  function markSolved(id: string) {
    markPuzzleSolved(id)
  }

  return {
    allPuzzles,
    unsolvedPuzzles,
    activePuzzles,
    solvedPuzzles,
    findById,
    markSolved,
  }
}
