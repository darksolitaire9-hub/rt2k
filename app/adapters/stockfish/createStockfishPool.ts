import type { EngineEvaluatorPort, EvalRequest, EvalResult } from '../../../shared/domain/ports/EngineEvaluatorPort'
import type { WorkerRequest, WorkerResponse } from './workerMessages'

export type StockfishPoolOptions = {
  workerCount: number
  workerScriptUrl: string | URL
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

type Slot = {
  worker: Worker
  idle: boolean
  activeTaskId: string | null
}

export function createStockfishPool(options: StockfishPoolOptions): StockfishPool {
  const slots: Slot[] = []
  const queue: Task[] = []
  const pending = new Map<string, Task>()

  const schedule = () => {
    while (queue.length > 0) {
      const idleSlot = slots.find(s => s.idle)
      if (!idleSlot) break

      const task = queue.shift()!
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
  }

  for (let i = 0; i < options.workerCount; i++) {
    const worker = new Worker(options.workerScriptUrl, { type: 'module' })
    const slot: Slot = { worker, idle: false, activeTaskId: null }
    slots.push(slot)

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data

      if (msg.type === 'READY') {
        slot.idle = true
        schedule()
        return
      }

      if (msg.type === 'EVAL_RESULT' || msg.type === 'ERROR') {
        const taskId = slot.activeTaskId
        
        // Mark slot idle BEFORE looking up the task
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
              task.reject(new Error(msg.error))
            }
          }
        }
      }
    }

    worker.onerror = (err) => {
      console.error('[StockfishPool] Worker error:', err)
      const taskId = slot.activeTaskId
      slot.idle = false // Mark dead
      slot.activeTaskId = null

      if (taskId) {
        const task = pending.get(taskId)
        if (task) {
          pending.delete(taskId)
          task.reject(new Error('Worker crashed'))
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
      
      // Reject and clear pending
      for (const task of pending.values()) {
        task.reject(error)
      }
      pending.clear()
      
      // Reject and clear queue
      while (queue.length > 0) {
        const task = queue.shift()
        task?.reject(error)
      }
    },

    dispose() {
      this.abortPending()
      for (const slot of slots) {
        slot.worker.terminate()
      }
    }
  }
}
