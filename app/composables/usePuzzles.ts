import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'

export function usePuzzles() {
  const result = useState<AnalysisResult | null>('rt2k-analysis', () => null)
  const puzzles = computed(() => result.value?.puzzles ?? [])

  function findById(id: string) {
    return puzzles.value.find(p => p.id === id) ?? null
  }

  return { puzzles, findById }
}
