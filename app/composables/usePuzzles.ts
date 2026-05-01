import { useAnalysis } from './useAnalysis'

export function usePuzzles() {
  const { result } = useAnalysis()
  const puzzles = computed(() => result.value?.puzzles ?? [])

  function findById(id: string) {
    return puzzles.value.find(p => p.id === id) ?? null
  }

  return { puzzles, findById }
}
