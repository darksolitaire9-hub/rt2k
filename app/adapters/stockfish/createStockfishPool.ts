import type { EngineEvaluatorPort, EvalRequest, EvalResult } from '../../../shared/domain/ports/EngineEvaluatorPort'
import type { WorkerRequest, WorkerResponse } from './workerMessages'

export type StockfishPoolOptions = {
  workerCount: number
  createWorker: () => Worker
}

export type StockfishPool = EngineEvaluatorPort & {
  abortPending(): void
  dispose(): void
}

type Task = {
  id: string
  request: EvalRequest
  resolve: (res: EvalResult) => void
  reject: (err: Error) => void
}

const READY_TIMEOUT_MS = 15_000

type Slot = {
  worker: Worker
  idle: boolean
  activeTaskId: string | null
}

export function createStockfishPool(options: StockfishPoolOptions): StockfishPool {
  const slots: Slot[] = []
  const queue: Task[] = []
  let head = 0
  const pending = new Map<string, Task>()

  const schedule = () => {
    while (head < queue.length) {
      const idleSlot = slots.find(s => s.idle)
      if (!idleSlot) break

      const task = queue[head++]!
      pending.set(task.id, task)
      idleSlot.idle = false
      idleSlot.activeTaskId = task.id
      
      const request: WorkerRequest = {
        id: task.id,
        type: 'EVALUATE_POSITION',
        fen: task.request.fen,
        movetimeMs: task.request.movetimeMs
      }
      
      idleSlot.worker.postMessage(request)
    }

    // Cleanup queue memory occasionally
    if (head > 100 && head === queue.length) {
      queue.length = 0
      head = 0
    }
  }

  for (let i = 0; i < options.workerCount; i++) {
    const worker = options.createWorker()
    const slot: Slot = { worker, idle: false, activeTaskId: null }
    slots.push(slot)

    // If the engine never sends READY (e.g. WASM load blocked), surface a clear error
    // instead of hanging the analysis queue forever.
    let readyTimer: ReturnType<typeof setTimeout> | null = setTimeout(() => {
      readyTimer = null
      if (slot.idle) return
      
      const error = new Error('Chess engine failed to start. Refresh the page and try again.')
      console.error('[StockfishPool] Ready timeout exceeded. Engine may be blocked by headers or 404.', {
        workerIndex: i,
        readyTimeoutMs: READY_TIMEOUT_MS
      })
      
      for (const task of pending.values()) task.reject(error)
      pending.clear()
      while (head < queue.length) queue[head++]!.reject(error)
    }, READY_TIMEOUT_MS)

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data

      if (msg.type === 'READY') {
        if (readyTimer !== null) { clearTimeout(readyTimer); readyTimer = null }
        slot.idle = true
        console.debug(`[StockfishPool] Worker ${i} is READY`)
        schedule()
        return
      }

      if (msg.type === 'EVAL_RESULT' || msg.type === 'ERROR') {
        if (msg.id === 'init') {
          // Worker failed to start (e.g. 404 on JS file).
          // Stop the timer and reject the whole queue.
          if (readyTimer !== null) { clearTimeout(readyTimer); readyTimer = null }
          slot.idle = false // Mark dead
          const errorMsg = msg.type === 'ERROR' ? msg.error : 'Engine initialization failed'
          console.error(`[StockfishPool] Worker ${i} failed to initialize:`, errorMsg)
          
          const error = new Error(errorMsg)
          for (const task of pending.values()) task.reject(error)
          pending.clear()
          while (head < queue.length) queue[head++]!.reject(error)
          return
        }

        const taskId = slot.activeTaskId

        // Mark slot idle BEFORE looking up the task to prevent race conditions
        slot.idle = true
        slot.activeTaskId = null
        schedule()

        if (taskId) {
          const task = pending.get(taskId)
          if (task) {
            pending.delete(taskId)
            if (msg.type === 'EVAL_RESULT') {
              // Attach the original FEN since the worker doesn't return it
              task.resolve({ ...msg.result, fen: task.request.fen })
            } else {
              console.warn(`[StockfishPool] Task ${taskId} failed:`, msg.error)
              task.reject(new Error(msg.error))
            }
          }
        }
      }
    }

    worker.onerror = (err) => {
      if (readyTimer !== null) { clearTimeout(readyTimer); readyTimer = null }
      console.error(`[StockfishPool] Worker ${i} crashed:`, err)
      const taskId = slot.activeTaskId
      slot.idle = false // Mark dead
      slot.activeTaskId = null

      if (taskId) {
        const task = pending.get(taskId)
        if (task) {
          pending.delete(taskId)
          task.reject(new Error('Engine worker crashed'))
        }
      }
      // Pool degrades gracefully to N-1 workers
    }
  }

  return {
    async evaluatePositions(requests: EvalRequest[]): Promise<EvalResult[]> {
      const promises = requests.map(req => {
        return new Promise<EvalResult>((resolve, reject) => {
          const id = Math.random().toString(36).slice(2)
          queue.push({ id, request: req, resolve, reject })
        })
      })
      schedule()
      return Promise.all(promises)
    },

    abortPending() {
      const error = new Error('aborted')
      console.warn('[StockfishPool] Aborting all pending tasks')
      
      // Reject and clear pending
      for (const task of pending.values()) {
        task.reject(error)
      }
      pending.clear()
      
      // Reject and clear queue
      while (head < queue.length) {
        const task = queue[head++]
        task?.reject(error)
      }
      queue.length = 0
      head = 0
    },

    dispose() {
      this.abortPending()
      for (const slot of slots) {
        slot.worker.terminate()
      }
    }
  }
}
