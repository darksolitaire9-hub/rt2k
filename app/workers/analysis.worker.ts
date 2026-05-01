/// <reference lib="webworker" />

import {
  analyzePgn,
  BURST_GAME_LIMIT,
  MID_GAME_LIMIT,
  MAX_GAMES_PER_ANALYSIS_RUN,
} from '../../shared/application/use-cases/AnalyzePgnUseCase'
import { ChessJsPgnParserAdapter } from '../adapters/pgn/ChessJsPgnParserAdapter'
import { createStockfishPool } from '../adapters/stockfish/createStockfishPool'
import type { AnalysisResult } from '../../shared/application/use-cases/AnalyzePgnUseCase'
import {
  makeCacheKey,
  type AnalyzeTier,
  type WorkerRequest,
  type WorkerResponse,
} from './analysis.worker.types'
import { ENGINE_POOL_SIZE } from '../../shared/domain/config/leakRules'

type ProgressPayload = { stage: string; current: number; total: number }

type AnalyzeTask = {
  kind: 'analyze'
  requestId: string
  pgn: string
  playerUsername: string
  days: number
  cacheKey: string
}

type PrewarmTask = {
  kind: 'prewarm'
  requestId: string
  pgn: string
  playerUsername: string
  days: number
  cacheKey: string
}

type QueueTask = AnalyzeTask | PrewarmTask

const parser = new ChessJsPgnParserAdapter()
const engine = createStockfishPool({
  workerCount: ENGINE_POOL_SIZE,
  workerScriptUrl: new URL('../adapters/stockfish/stockfishWorker.ts', import.meta.url)
})

const evalCache = new Map<string, { score: number; bestMove: string }>()
const burstCache = new Map<string, AnalysisResult>()
const inFlightBurst = new Map<string, Promise<AnalysisResult>>()
const burstProgressCallbacks = new Map<string, Set<(p: ProgressPayload) => void>>()
const cancelledIds = new Set<string>()

const analyzeQueue: AnalyzeTask[] = []
const prewarmQueue: PrewarmTask[] = []
const queuedPrewarmKeys = new Set<string>()

let processing = false
let activeTask: QueueTask | null = null

function post(msg: WorkerResponse): void {
  ;(self as DedicatedWorkerGlobalScope).postMessage(msg)
}

function isCancelled(requestId: string): boolean {
  return cancelledIds.has(requestId)
}

function pruneCancelledIds(): void {
  if (cancelledIds.size <= 1000) return
  const iter = cancelledIds.values()
  while (cancelledIds.size > 800) {
    const next = iter.next()
    if (next.done) break
    cancelledIds.delete(next.value)
  }
}

function addBurstProgressCallback(cacheKey: string, callback?: (p: ProgressPayload) => void): void {
  if (!callback) return
  let callbacks = burstProgressCallbacks.get(cacheKey)
  if (!callbacks) {
    callbacks = new Set()
    burstProgressCallbacks.set(cacheKey, callbacks)
  }
  callbacks.add(callback)
}

function removeBurstProgressCallback(cacheKey: string, callback?: (p: ProgressPayload) => void): void {
  if (!callback) return
  const callbacks = burstProgressCallbacks.get(cacheKey)
  if (!callbacks) return
  callbacks.delete(callback)
  if (callbacks.size === 0) burstProgressCallbacks.delete(cacheKey)
}

async function getOrComputeBurst(
  pgn: string,
  playerUsername: string,
  days: number,
  cacheKey: string,
  onProgress?: (p: ProgressPayload) => void,
): Promise<AnalysisResult> {
  const cached = burstCache.get(cacheKey)
  if (cached) {
    console.debug(`[Worker] 💾 Cache HIT for burst (Key: ${cacheKey.slice(0, 8)})`)
    return cached
  }

  addBurstProgressCallback(cacheKey, onProgress)

  let promise = inFlightBurst.get(cacheKey)
  if (!promise) {
    console.debug(`[Worker] 🚀 Starting NEW burst (Key: ${cacheKey.slice(0, 8)})`)
    promise = analyzePgn(
      pgn,
      playerUsername,
      parser,
      engine,
      days,
      (p) => {
        const callbacks = burstProgressCallbacks.get(cacheKey)
        if (!callbacks) return
        for (const cb of callbacks) cb(p)
      },
      BURST_GAME_LIMIT,
      'burst',
      evalCache,
    )
      .then((result) => {
        burstCache.set(cacheKey, result)
        return result
      })
      .finally(() => {
        inFlightBurst.delete(cacheKey)
      })

    inFlightBurst.set(cacheKey, promise)
  } else {
    console.debug(`[Worker] 🤝 Attaching to in-flight burst (Key: ${cacheKey.slice(0, 8)})`)
  }

  try {
    return await promise
  } finally {
    removeBurstProgressCallback(cacheKey, onProgress)
  }
}

async function runTier(
  requestId: string,
  pgn: string,
  playerUsername: string,
  days: number,
  cacheKey: string,
  tier: AnalyzeTier,
  gameLimit: number,
): Promise<AnalysisResult | null> {
  if (isCancelled(requestId)) return null

  if (tier === 'burst') {
    const result = await getOrComputeBurst(
      pgn,
      playerUsername,
      days,
      cacheKey,
      (p) => {
        if (!isCancelled(requestId)) {
          post({ type: 'progress', requestId, tier: 'burst', progress: p })
        }
      },
    )
    return isCancelled(requestId) ? null : result
  }

  const result = await analyzePgn(
    pgn,
    playerUsername,
    parser,
    engine,
    days,
    (p) => {
      if (!isCancelled(requestId)) {
        post({ type: 'progress', requestId, tier, progress: p })
      }
    },
    gameLimit,
    tier,
    evalCache,
  )

  return isCancelled(requestId) ? null : result
}

async function runAnalysisTask(task: AnalyzeTask): Promise<void> {
  activeTask = task
  const { requestId, pgn, playerUsername, days, cacheKey } = task

  try {
    const burst = await runTier(
      requestId,
      pgn,
      playerUsername,
      days,
      cacheKey,
      'burst',
      BURST_GAME_LIMIT,
    )
    if (!burst) return

    if (isCancelled(requestId)) return
    post({ type: 'result', requestId, tier: 'burst', result: burst })

    if (burst.totalGamesInWindow <= BURST_GAME_LIMIT) {
      post({ type: 'done', requestId })
      return
    }

    const mid = await runTier(
      requestId,
      pgn,
      playerUsername,
      days,
      cacheKey,
      'mid',
      MID_GAME_LIMIT,
    )
    if (!mid) return

    if (isCancelled(requestId)) return
    post({ type: 'result', requestId, tier: 'mid', result: mid })

    if (mid.totalGamesInWindow <= MID_GAME_LIMIT) {
      post({ type: 'done', requestId })
      return
    }

    const deep = await runTier(
      requestId,
      pgn,
      playerUsername,
      days,
      cacheKey,
      'deep',
      MAX_GAMES_PER_ANALYSIS_RUN,
    )
    if (!deep) return

    if (isCancelled(requestId)) return
    post({ type: 'result', requestId, tier: 'deep', result: deep })
    post({ type: 'done', requestId })
  } catch (e) {
    if (!isCancelled(requestId)) {
      post({
        type: 'error',
        requestId,
        message: e instanceof Error ? e.message : 'Analysis failed',
      })
    }
  } finally {
    if (activeTask?.requestId === requestId) activeTask = null
  }
}

async function runPrewarmTask(task: PrewarmTask): Promise<void> {
  if (isCancelled(task.requestId)) return
  if (burstCache.has(task.cacheKey)) return

  activeTask = task
  try {
    await getOrComputeBurst(task.pgn, task.playerUsername, task.days, task.cacheKey)
  } catch {
  } finally {
    if (activeTask?.requestId === task.requestId) activeTask = null
  }
}

function nextTask(): QueueTask | null {
  while (analyzeQueue.length > 0) {
    const task = analyzeQueue.shift()!
    if (!isCancelled(task.requestId)) return task
  }

  while (prewarmQueue.length > 0) {
    const task = prewarmQueue.shift()!
    queuedPrewarmKeys.delete(task.cacheKey)

    if (isCancelled(task.requestId)) continue
    if (burstCache.has(task.cacheKey)) continue
    if (inFlightBurst.has(task.cacheKey)) continue

    return task
  }

  return null
}

async function processQueue(): Promise<void> {
  if (processing) return
  processing = true

  try {
    while (true) {
      const task = nextTask()
      if (!task) break

      if (task.kind === 'analyze') {
        await runAnalysisTask(task)
      } else {
        await runPrewarmTask(task)
      }
    }
  } finally {
    processing = false
    if (analyzeQueue.length > 0 || prewarmQueue.length > 0) {
      queueMicrotask(() => {
        void processQueue()
      })
    }
  }
}

function enqueuePrewarm(task: PrewarmTask): void {
  if (burstCache.has(task.cacheKey)) return
  if (inFlightBurst.has(task.cacheKey)) return
  if (queuedPrewarmKeys.has(task.cacheKey)) return

  console.debug(`[Worker] 📥 Enqueue PREWARM (Key: ${task.cacheKey.slice(0, 8)})`)
  prewarmQueue.push(task)
  queuedPrewarmKeys.add(task.cacheKey)
  void processQueue()
}

function enqueueAnalyze(task: AnalyzeTask): void {
  console.debug(`[Worker] 📥 Enqueue ANALYZE: ${task.requestId} (Key: ${task.cacheKey.slice(0, 8)})`)
  analyzeQueue.push(task)

  // Prewarm is low priority. If a different prewarm is actively running,
  // stop it so the real foreground analyze gets the engine quickly.
  if (
    activeTask?.kind === 'prewarm' &&
    activeTask.cacheKey !== task.cacheKey &&
    !isCancelled(activeTask.requestId)
  ) {
    console.warn(`[Worker] ⚡ Preempting active prewarm for request: ${task.requestId}`)
    cancelledIds.add(activeTask.requestId)
    engine.abortPending()
    pruneCancelledIds()
  }

  void processQueue()
}

function cancelRequest(requestId: string): void {
  cancelledIds.add(requestId)

  if (activeTask?.requestId === requestId) {
    engine.abortPending()
  }

  pruneCancelledIds()
}

;(self as DedicatedWorkerGlobalScope).addEventListener(
  'message',
  (event: MessageEvent<WorkerRequest>) => {
    const msg = event.data

    switch (msg.type) {
      case 'init': {
        post({ type: 'ready' })
        break
      }

      case 'prewarm': {
        const cacheKey = msg.cacheKey || makeCacheKey(msg.playerUsername, msg.days, msg.pgn)

        enqueuePrewarm({
          kind: 'prewarm',
          requestId: msg.requestId,
          pgn: msg.pgn,
          playerUsername: msg.playerUsername,
          days: msg.days,
          cacheKey,
        })
        break
      }

      case 'analyze': {
        const cacheKey = msg.cacheKey || makeCacheKey(msg.playerUsername, msg.days, msg.pgn)

        enqueueAnalyze({
          kind: 'analyze',
          requestId: msg.requestId,
          pgn: msg.pgn,
          playerUsername: msg.playerUsername,
          days: msg.days,
          cacheKey,
        })
        break
      }

      case 'cancel': {
        cancelRequest(msg.requestId)
        break
      }
    }
  },
)
