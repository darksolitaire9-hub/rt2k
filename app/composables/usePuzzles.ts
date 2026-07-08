import { useRepository } from './useRepository'
import type { UserPuzzle } from '#shared/domain/entities/UserPuzzle'

const allPuzzles = ref<UserPuzzle[]>([])

export function usePuzzles() {
  const BATCH_SIZE = 20

  async function hydratePuzzles() {
    const repo = useRepository()
    allPuzzles.value = await repo.getAllPuzzles()
  }

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

  async function markSolved(id: string) {
    // Optimistic UI update
    const p = findById(id)
    if (p) p.solved = true

    // Persist
    const repo = useRepository()
    await repo.updatePuzzleSolved(id)
  }

  return {
    allPuzzles,
    unsolvedPuzzles,
    activePuzzles,
    solvedPuzzles,
    findById,
    markSolved,
    hydratePuzzles,
  }
}
