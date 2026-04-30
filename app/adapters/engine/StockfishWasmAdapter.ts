import type { IEnginePort, EngineResult } from '../../../shared/domain/ports/IEnginePort'

export interface StockfishEngine {
  postMessage(msg: string): void
  addEventListener(type: 'message', handler: (event: { data: string }) => void): void
  terminate(): void
}

export class StockfishWasmAdapter implements IEnginePort {
  private workers: { engine: StockfishEngine; busy: boolean }[] = []
  private queue: { fen: string; depth: number; resolve: (res: EngineResult) => void }[] = []
  private POOL_SIZE = 3

  constructor(private readonly createEngine: () => StockfishEngine) {}

  private getFreeWorker() {
    return this.workers.find(w => !w.busy)
  }

  private async processQueue() {
    const freeWorker = this.getFreeWorker()
    if (!freeWorker || this.queue.length === 0) return

    const { fen, depth, resolve } = this.queue.shift()!
    freeWorker.busy = true

    let latestScore = 0
    const onMessage = ({ data }: { data: string }) => {
      if (data.startsWith('info')) {
        const mateMatch = data.match(/score mate (-?\d+)/)
        if (mateMatch) {
          latestScore = parseInt(mateMatch[1]) > 0 ? 9999 : -9999
        } else {
          const cpMatch = data.match(/score cp (-?\d+)/)
          if (cpMatch) latestScore = parseInt(cpMatch[1])
        }
      }
      if (data.startsWith('bestmove')) {
        const bestMove = data.split(' ')[1] ?? ''
        freeWorker.engine.removeEventListener('message', onMessage)
        freeWorker.busy = false
        resolve({ score: latestScore, bestMove })
        this.processQueue() // Pick up next task
      }
    }

    freeWorker.engine.addEventListener('message', onMessage)
    freeWorker.engine.postMessage(`position fen ${fen}`)
    freeWorker.engine.postMessage(`go depth ${depth}`)
  }

  evaluate(fen: string, depth: number): Promise<EngineResult> {
    // Initialize pool on first use
    if (this.workers.length === 0) {
      for (let i = 0; i < this.POOL_SIZE; i++) {
        const engine = this.createEngine()
        engine.postMessage('uci')
        this.workers.push({ engine, busy: false })
      }
    }

    return new Promise((resolve) => {
      this.queue.push({ fen, depth, resolve })
      this.processQueue()
    })
  }

  terminate() {
    for (const w of this.workers) {
      w.engine.terminate()
    }
    this.workers = []
    this.queue = []
  }
}

export function createStockfishAdapter(workerUrl: string): StockfishWasmAdapter {
  return new StockfishWasmAdapter(() => new Worker(workerUrl) as unknown as StockfishEngine)
}
