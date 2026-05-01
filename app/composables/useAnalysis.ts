import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'
import type { WorkerRequest, WorkerResponse } from '../workers/analysis.worker.types'

let worker: Worker | null = null

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null

  if (!worker) {
    worker = new Worker(
      new URL('../workers/analysis.worker.ts', import.meta.url),
      { type: 'module' },
    )
  }

  return worker
}

function send(w: Worker, msg: WorkerRequest): void {
  w.postMessage(msg)
}

function createRequestId(prefix: 'req' | 'pre'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

export function useAnalysis() {
  let activeRequestId = ''

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
      .map(([name, s]) => ({
        name,
        games: s.games,
        winRate: Math.round((s.wins / s.games) * 100),
      }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 8)
  })

  const leaks = computed(() => result.value?.leaks ?? [])
  const puzzles = computed(() => result.value?.puzzles ?? [])
  const puzzleCount = computed(() => puzzles.value.length)
  const isPartial = computed(() => result.value?.isPartial ?? false)

  const hasResult = computed({
    get: () => result.value !== null,
    set: (val) => {
      if (!val) result.value = null
    },
  })

  function resetUi(): void {
    result.value = null
    loading.value = false
    error.value = null
    backgroundRunning.value = false
    progress.value = { stage: '', current: 0, total: 0 }
    backgroundProgress.value = { stage: '', current: 0, total: 0 }
  }

  function handleMessage(event: MessageEvent<WorkerResponse>): void {
    const msg = event.data

    if (msg.type === 'ready') return
    if ('requestId' in msg && msg.requestId !== activeRequestId) return

    switch (msg.type) {
      case 'progress':
        if (msg.tier === 'burst') {
          progress.value = msg.progress
        } else {
          backgroundRunning.value = true
          backgroundProgress.value = msg.progress
        }
        break

      case 'result':
        result.value = msg.result
        if (msg.tier === 'burst') {
          loading.value = false
        } else {
          backgroundRunning.value = true
        }
        break

      case 'done':
        loading.value = false
        backgroundRunning.value = false
        break

      case 'error':
        error.value = msg.message
        loading.value = false
        backgroundRunning.value = false
        break
    }
  }

  onMounted(() => {
    const w = getWorker()
    if (!w) return
    w.addEventListener('message', handleMessage)
    send(w, { type: 'init' })
  })

  onUnmounted(() => {
    const w = getWorker()
    if (!w) return
    if (activeRequestId) send(w, { type: 'cancel', requestId: activeRequestId })
    w.removeEventListener('message', handleMessage)
  })

  function clear(): void {
    const w = getWorker()
    if (w && activeRequestId) {
      send(w, { type: 'cancel', requestId: activeRequestId })
    }
    activeRequestId = ''
    resetUi()
  }

  function preAnalyze(pgn: string, playerUsername: string, days = 90): void {
    const w = getWorker()
    if (!w) return
    if (!pgn || !playerUsername.trim()) return

    send(w, {
      type: 'prewarm',
      requestId: createRequestId('pre'),
      pgn,
      playerUsername: playerUsername.trim(),
      days,
    })
  }

  function analyze(pgn: string, playerUsername: string, days = 90): void {
    const w = getWorker()
    if (!w) return

    if (activeRequestId) {
      send(w, { type: 'cancel', requestId: activeRequestId })
    }

    activeRequestId = createRequestId('req')

    loading.value = true
    backgroundRunning.value = false
    error.value = null
    result.value = null
    progress.value = { stage: 'starting', current: 0, total: 0 }
    backgroundProgress.value = { stage: '', current: 0, total: 0 }

    send(w, {
      type: 'analyze',
      requestId: activeRequestId,
      pgn,
      playerUsername: playerUsername.trim(),
      days,
    })
  }

  function preLoad(): void {
    getWorker()
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
    preAnalyze,
    clear,
  }
}
