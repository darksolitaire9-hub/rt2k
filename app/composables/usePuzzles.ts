import { useAnalysis } from './useAnalysis'
import { useTrainingSession } from './useTrainingSession'

export function usePuzzles() {
  const { result } = useAnalysis()
  const { snapshot } = useTrainingSession()

  // Use the frozen training snapshot when one exists so a background analysis
  // update can't invalidate the puzzle the user is currently solving.
  const puzzles = computed(() => {
    const raw = snapshot.value.length ? snapshot.value : result.value?.puzzles ?? []
    return raw.filter(p => p.solved !== true)
  })

  function findById(id: string) {
    return puzzles.value.find(p => p.id === id) ?? null
  }

  return { puzzles, findById }
}
