import { analyzePgn, BURST_GAME_LIMIT, MID_GAME_LIMIT, MAX_GAMES_PER_ANALYSIS_RUN } from '../../shared/application/use-cases/AnalyzePgnUseCase'
import { ChessJsPgnParserAdapter } from '../adapters/pgn/ChessJsPgnParserAdapter'
import { createStockfishAdapter } from '../adapters/engine/StockfishWasmAdapter'
import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'

// --- Module-level singletons (Change 1) ---
const parser = new ChessJsPgnParserAdapter()
const preAnalysisEvalCache = new Map<string, { score: number; bestMove: string }>()
const preAnalysisResultCache = new Map<string, AnalysisResult>()

let cachedEngine: ReturnType<typeof createStockfishAdapter> | null = null
function getEngine() {
  if (!cachedEngine) cachedEngine = createStockfishAdapter('/stockfish/stockfish.js')
  return cachedEngine
}

// Change 3 — silent pre-analysis, runs as soon as PGN + username are known
async function preAnalyze(pgn: string, playerUsername: string, days = 90) {
  const key = `${playerUsername}::${pgn.length}`
  if (preAnalysisResultCache.has(key)) return

  const engine = getEngine()
  try {
    const burst = await analyzePgn(
      pgn,
      playerUsername,
      parser,
      engine,
      days,
      () => {}, // silent — no progress UI
      BURST_GAME_LIMIT,
      'burst',
      preAnalysisEvalCache,
    )
    preAnalysisResultCache.set(key, burst)
  } catch {
    // silent — analyze() will retry normally
  }
}

export function useAnalysis() {
  // Change 2 — run ID to kill stale background passes
  let currentRunId = 0

  const result = useState<AnalysisResult | null>('rt2k-analysis', () => null)
  const loading = ref(false)
  const backgroundRunning = ref(false)
  const progress = ref({ stage: '', current: 0, total: 0 })
  const backgroundProgress = ref({ stage: '', current: 0, total: 0 })
  const error = ref<string | null>(null)

  const totalGames = computed(() => result.value?.games.length ?? 0)
  const wins = computed(() => result.value?.games.filter(g => g.result === 'win').length ?? 0)
  const losses = computed(() => result.value?.games.filter(g => g.result === 'loss').length ?? 0)
  const draws = computed(() => result.value?.games.filter(g => g.result === 'draw').length ?? 0)
  const timeLosses = computed(() => result.value?.games.filter(g => g.timeLoss).length ?? 0)
  const winRate = computed(() => {
    const t = totalGames.value
    return t > 0 ? Math.round((wins.value / t) * 100) : 0
  })
  // Change 7 — proper type guard on filter
  const ratingRange = computed(() => {
    const elos = result.value?.games.map(g => g.myElo).filter((e): e is number => e != null && e > 0) ?? []
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

  // Change 5 — engine pre-warm before any user interaction
  onMounted(() => {
    getEngine()
  })

  // Change 6 — invalidate stale background runs on unmount
  onUnmounted(() => {
    currentRunId++
    result.value = null
  })

  function clear() {
    result.value = null
    error.value = null
    backgroundRunning.value = false
  }

  async function analyze(pgn: string, playerUsername: string, days: number = 90) {
    // Change 2 — stamp this run so background tiers from a previous call don't write back
    const runId = ++currentRunId

    // Change 4 — serve from pre-analysis cache for zero perceived delay
    const cacheKey = `${playerUsername}::${pgn.length}`
    const cached = preAnalysisResultCache.get(cacheKey)
    if (cached) {
      preAnalysisResultCache.delete(cacheKey)
      result.value = cached
      error.value = null
      if (cached.totalGamesInWindow > BURST_GAME_LIMIT) {
        runBackgroundTiers(pgn, playerUsername, days, runId)
      }
      return
    }

    loading.value = true
    backgroundRunning.value = false
    error.value = null
    result.value = null
    progress.value = { stage: 'starting', current: 0, total: 0 }

    // Yield to browser so the spinner paints before heavy work starts
    await new Promise(resolve => setTimeout(resolve, 50))

    try {
      const engine = getEngine()

      // Tier 1 — 3 most recent games, max 10 evals, depth 8-12 → ~1s
      const burst = await analyzePgn(pgn, playerUsername, parser, engine, days, (p) => {
        progress.value = p
      }, BURST_GAME_LIMIT, 'burst', preAnalysisEvalCache)

      if (runId !== currentRunId) return
      result.value = burst

      if (burst.totalGamesInWindow > BURST_GAME_LIMIT) {
        runBackgroundTiers(pgn, playerUsername, days, runId)
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
    runId: number,
  ) {
    backgroundRunning.value = true
    backgroundProgress.value = { stage: '', current: 0, total: 0 }

    try {
      const engine = getEngine()

      // Tier 2 — up to 15 games, max 25 evals → ~3-5s, gives richer leak patterns
      const mid = await analyzePgn(pgn, playerUsername, parser, engine, days, (p) => {
        backgroundProgress.value = p
      }, MID_GAME_LIMIT, 'mid', preAnalysisEvalCache)

      if (runId !== currentRunId) return
      result.value = mid

      // Tier 3 — full window, up to 100 games, max 60 evals at deeper depth
      if (mid.totalGamesInWindow > MID_GAME_LIMIT) {
        const deep = await analyzePgn(pgn, playerUsername, parser, engine, days, (p) => {
          backgroundProgress.value = p
        }, MAX_GAMES_PER_ANALYSIS_RUN, 'deep', preAnalysisEvalCache)

        if (runId !== currentRunId) return
        result.value = deep
      }
    } catch (e) {
      console.error('Background analysis failed', e)
    } finally {
      backgroundRunning.value = false
    }
  }

  // Change 8 — no parameter needed; engine warm-up happens in onMounted
  function preLoad() {
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
    preAnalyze, // Change 5
    clear,
  }
}
