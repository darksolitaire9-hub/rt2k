import { analyzePgn } from '../../shared/application/use-cases/AnalyzePgnUseCase'
import { ChessJsPgnParserAdapter } from '../adapters/pgn/ChessJsPgnParserAdapter'
import { createStockfishAdapter } from '../adapters/engine/StockfishWasmAdapter'
import { LocalPuzzleSourceAdapter } from '../adapters/puzzles/LocalPuzzleSourceAdapter'
import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'

export function useAnalysis() {
  const result = ref<AnalysisResult | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const parser = new ChessJsPgnParserAdapter()
  const puzzleSource = new LocalPuzzleSourceAdapter()

  const totalGames = computed(() => result.value?.games.length ?? 0)
  const wins = computed(() => result.value?.games.filter(g => g.result === 'win').length ?? 0)
  const losses = computed(() => result.value?.games.filter(g => g.result === 'loss').length ?? 0)
  const draws = computed(() => result.value?.games.filter(g => g.result === 'draw').length ?? 0)
  const timeLosses = computed(() => result.value?.games.filter(g => g.timeLoss).length ?? 0)
  const leaks = computed(() => result.value?.leaks ?? [])
  const puzzles = computed(() => result.value?.puzzles ?? [])
  const isPartial = computed(() => result.value?.isPartial ?? false)
  const hasResult = computed(() => result.value !== null)

  async function analyze(pgn: string, playerUsername: string) {
    loading.value = true
    error.value = null
    result.value = null
    try {
      const engine = createStockfishAdapter('/stockfish/stockfish.js')
      result.value = await analyzePgn(pgn, playerUsername, parser, engine, puzzleSource)
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Analysis failed. Check that your PGN is valid.'
    }
    finally {
      loading.value = false
    }
  }

  return { loading, error, hasResult, totalGames, wins, losses, draws, timeLosses, leaks, puzzles, isPartial, analyze }
}
