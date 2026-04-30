import { analyzePgn } from '../../shared/application/use-cases/AnalyzePgnUseCase'
import { ChessJsPgnParserAdapter } from '../adapters/pgn/ChessJsPgnParserAdapter'
import { createStockfishAdapter } from '../adapters/engine/StockfishWasmAdapter'
import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'

export function useAnalysis() {
  const result = useState<AnalysisResult | null>('rt2k-analysis', () => null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const parser = new ChessJsPgnParserAdapter()

  const totalGames = computed(() => result.value?.games.length ?? 0)
  const wins = computed(() => result.value?.games.filter(g => g.result === 'win').length ?? 0)
  const losses = computed(() => result.value?.games.filter(g => g.result === 'loss').length ?? 0)
  const draws = computed(() => result.value?.games.filter(g => g.result === 'draw').length ?? 0)
  const timeLosses = computed(() => result.value?.games.filter(g => g.timeLoss).length ?? 0)
  const winRate = computed(() => {
    const t = totalGames.value
    return t > 0 ? Math.round((wins.value / t) * 100) : 0
  })
  const ratingRange = computed(() => {
    const elos = result.value?.games.map(g => g.myElo).filter(e => e > 0) ?? []
    if (!elos.length) return null
    return { min: Math.min(...elos), max: Math.max(...elos) }
  })
  const openingStats = computed(() => {
    const games = result.value?.games ?? []
    const map = new Map<string, { games: number; wins: number }>()
    for (const g of games) {
      const name = g.openingName || 'Unknown'
      const entry = map.get(name) ?? { games: 0, wins: 0 }
      entry.games++
      if (g.result === 'win') entry.wins++
      map.set(name, entry)
    }
    return [...map.entries()]
      .map(([name, s]) => ({ name, games: s.games, winRate: Math.round((s.wins / s.games) * 100) }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 8)
  })
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
      result.value = await analyzePgn(pgn, playerUsername, parser, engine)
    }
    catch (e) {
      error.value = e instanceof Error ? e.message : 'Analysis failed. Check that your PGN is valid.'
    }
    finally {
      loading.value = false
    }
  }

  return { loading, error, hasResult, totalGames, wins, losses, draws, timeLosses, winRate, ratingRange, openingStats, leaks, puzzles, isPartial, analyze }
}
