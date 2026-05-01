import { analyzePgn, BURST_GAME_LIMIT, MID_GAME_LIMIT, MAX_GAMES_PER_ANALYSIS_RUN } from '../../shared/application/use-cases/AnalyzePgnUseCase'
import { ChessJsPgnParserAdapter } from '../adapters/pgn/ChessJsPgnParserAdapter'
import { createStockfishAdapter } from '../adapters/engine/StockfishWasmAdapter'
import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'

let cachedEngine: ReturnType<typeof createStockfishAdapter> | null = null
function getEngine() {
  if (!cachedEngine) cachedEngine = createStockfishAdapter('/stockfish/stockfish.js')
  return cachedEngine
}

export function useAnalysis() {
  const result = useState<AnalysisResult | null>('rt2k-analysis', () => null)
  const loading = ref(false)
  const backgroundRunning = ref(false)
  const progress = ref({ stage: '', current: 0, total: 0 })
  const backgroundProgress = ref({ stage: '', current: 0, total: 0 })
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
  const puzzleCount = computed(() => puzzles.value.length)
  const isPartial = computed(() => result.value?.isPartial ?? false)
  const hasResult = computed({
    get: () => result.value !== null,
    set: (val) => { if (!val) result.value = null },
  })

  function clear() {
    result.value = null
    error.value = null
    backgroundRunning.value = false
  }

  async function analyze(pgn: string, playerUsername: string, days: number = 90) {
    loading.value = true
    backgroundRunning.value = false
    error.value = null
    result.value = null
    progress.value = { stage: 'starting', current: 0, total: 0 }

    // Yield to browser so the spinner paints before heavy work starts
    await new Promise(resolve => setTimeout(resolve, 50))

    // Shared eval cache persists across all three tiers — no position is evaluated twice
    const evalCache = new Map<string, { score: number; bestMove: string }>()

    try {
      const engine = getEngine()

      // Tier 1 — 3 most recent games, max 10 evals, depth 8-12 → ~1s
      const burst = await analyzePgn(pgn, playerUsername, parser, engine, days, (p) => {
        progress.value = p
      }, BURST_GAME_LIMIT, 'burst', evalCache)

      result.value = burst

      // Kick off tiers 2+3 in the background without awaiting
      if (burst.totalGamesInWindow > BURST_GAME_LIMIT) {
        runBackgroundTiers(pgn, playerUsername, days, evalCache)
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Analysis failed. Check that your PGN is valid.'
    } finally {
      loading.value = false
    }
  }

  async function runBackgroundTiers(
    pgn: string,
    playerUsername: string,
    days: number,
    evalCache: Map<string, { score: number; bestMove: string }>,
  ) {
    backgroundRunning.value = true
    backgroundProgress.value = { stage: '', current: 0, total: 0 }

    try {
      const engine = getEngine()

      // Tier 2 — up to 15 games, max 25 evals → ~3-5s, gives richer leak patterns
      const mid = await analyzePgn(pgn, playerUsername, parser, engine, days, (p) => {
        backgroundProgress.value = p
      }, MID_GAME_LIMIT, 'mid', evalCache)

      result.value = mid

      // Tier 3 — full window, up to 100 games, max 60 evals at deeper depth
      if (mid.totalGamesInWindow > MID_GAME_LIMIT) {
        const deep = await analyzePgn(pgn, playerUsername, parser, engine, days, (p) => {
          backgroundProgress.value = p
        }, MAX_GAMES_PER_ANALYSIS_RUN, 'deep', evalCache)

        result.value = deep
      }
    } catch (e) {
      console.error('Background analysis failed', e)
    } finally {
      backgroundRunning.value = false
    }
  }

  function preLoad(_pgn: string) {
    getEngine()
  }

  return {
    loading,
    backgroundRunning,
    progress,
    backgroundProgress,
    error,
    hasResult,
    totalGames,
    wins,
    losses,
    draws,
    timeLosses,
    winRate,
    ratingRange,
    openingStats,
    leaks,
    puzzles,
    puzzleCount,
    isPartial,
    analyze,
    preLoad,
    clear,
  }
}
