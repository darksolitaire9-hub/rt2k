/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from './workerMessages'

// We re-implement a minimal version of the adapter logic here to handle the UCI protocol
// and keep the worker self-contained.

class EngineProxy {
  private worker: Worker
  private latestScoreCp: number = 0
  private currentTaskId: string | null = null

  constructor(workerUrl: string, onReady: () => void, onResult: (taskId: string, score: number, bestMove: string | null) => void, onError: (err: string) => void) {
    this.worker = new Worker(workerUrl, { type: 'classic' })
    
    this.worker.onmessage = (e) => {
      const line = e.data
      if (typeof line !== 'string') return

      if (line === 'readyok') {
        onReady()
      } else if (line.startsWith('info')) {
        const cpMatch = line.match(/score cp (-?\d+)/)
        if (cpMatch) {
          this.latestScoreCp = parseInt(cpMatch[1], 10)
        }
        const mateMatch = line.match(/score mate (-?\d+)/)
        if (mateMatch) {
          const mateIn = parseInt(mateMatch[1], 10)
          this.latestScoreCp = mateIn > 0 ? 9999 : -9999
        }
      } else if (line.startsWith('bestmove')) {
        if (this.currentTaskId) {
          const bestMove = line.split(' ')[1] || null
          onResult(this.currentTaskId, this.latestScoreCp, bestMove)
          this.currentTaskId = null
        }
      }
    }

    this.worker.onerror = (err) => {
      onError(err.message || 'Engine worker error')
    }

    this.worker.postMessage('uci')
    this.worker.postMessage('isready')
  }

  evaluate(id: string, fen: string, movetimeMs: number) {
    this.currentTaskId = id
    this.latestScoreCp = 0
    this.worker.postMessage('ucinewgame')
    this.worker.postMessage(`position fen ${fen}`)
    this.worker.postMessage(`go movetime ${movetimeMs}`)
  }

  terminate() {
    this.worker.terminate()
  }
}

let proxy: EngineProxy | null = null

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data

  if (msg.type === 'EVALUATE_POSITION') {
    if (!proxy) {
      // We'll initialize on first demand if not already done, 
      // but initEngine() is called at the bottom.
      return
    }
    proxy.evaluate(msg.id, msg.fen, msg.movetimeMs)
  }
})

function init() {
  proxy = new EngineProxy(
    '/stockfish/stockfish.js',
    () => {
      self.postMessage({ id: 'init', type: 'READY' } as WorkerResponse)
    },
    (taskId, score, bestMove) => {
      self.postMessage({
        id: taskId,
        type: 'EVAL_RESULT',
        result: { fen: '', scoreCp: score, bestMoveUci: bestMove }
      } as WorkerResponse)
    },
    (err) => {
      self.postMessage({ id: 'init', type: 'ERROR', error: err } as WorkerResponse)
    }
  )
}

init()
