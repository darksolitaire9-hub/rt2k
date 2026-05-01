import type { IEnginePort, EngineResult, EvalOptions } from '../../../shared/domain/ports/IEnginePort'

export interface StockfishEngine {
  postMessage(msg: string): void
  addEventListener(type: 'message', handler: (event: { data: string }) => void): void
  removeEventListener(type: 'message', handler: (event: { data: string }) => void): void
  terminate(): void
}

type QueueItem = {
  fen: string
  options: EvalOptions
  resolve: (res: EngineResult) => void
  reject: (error: Error) => void
}

export class StockfishWasmAdapter implements IEnginePort {
  private engine: StockfishEngine | null = null
  private queue: QueueItem[] = []
  private busy = false
  private destroyed = false
  private activeHandler: ((event: { data: string }) => void) | null = null

  constructor(private readonly createEngine: () => StockfishEngine) {}

  private ensureEngine(): StockfishEngine {
    if (!this.engine) {
      this.engine = this.createEngine()
      this.engine.postMessage('uci')
      this.engine.postMessage('isready')
    }
    return this.engine
  }

  private processQueue(): void {
    if (this.destroyed || this.busy || this.queue.length === 0) return

    const engine = this.ensureEngine()
    const job = this.queue.shift()
    if (!job) return

    const { fen, options, resolve, reject } = job
    this.busy = true

    let latestScore = 0
    let settled = false

    const cleanup = () => {
      if (this.activeHandler) {
        engine.removeEventListener('message', this.activeHandler)
        this.activeHandler = null
      }
      this.busy = false
    }

    const finish = (result: EngineResult) => {
      if (settled) return
      settled = true
      cleanup()
      resolve(result)
      this.processQueue()
    }

    const fail = (error: Error) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error)
      this.processQueue()
    }

    const onMessage = ({ data }: { data: string }) => {
      if (typeof data !== 'string') return

      if (data.startsWith('info')) {
        const mateMatch = data.match(/score mate (-?\d+)/)
        if (mateMatch && mateMatch[1]) {
          latestScore = parseInt(mateMatch[1], 10) > 0 ? 9999 : -9999
          return
        }

        const cpMatch = data.match(/score cp (-?\d+)/)
        if (cpMatch && cpMatch[1]) {
          latestScore = parseInt(cpMatch[1], 10)
        }
        return
      }

      if (data.startsWith('bestmove')) {
        const bestMove = data.split(' ')[1] ?? ''
        finish({ score: latestScore, bestMove })
      }
    }

    this.activeHandler = onMessage
    engine.addEventListener('message', onMessage)

    try {
      const goCmd = options.movetime != null
        ? `go movetime ${options.movetime}`
        : `go depth ${options.depth ?? 12}`

      engine.postMessage('ucinewgame')
      engine.postMessage(`position fen ${fen}`)
      engine.postMessage(goCmd)
    } catch {
      fail(new Error('Stockfish engine failed to start search'))
    }
  }

  evaluate(fen: string, options: EvalOptions): Promise<EngineResult> {
    if (this.destroyed) {
      return Promise.reject(new Error('Stockfish adapter has been terminated'))
    }

    return new Promise<EngineResult>((resolve, reject) => {
      this.queue.push({ fen, options, resolve, reject })
      this.processQueue()
    })
  }

  abortPending(): void {
    this.queue = []

    if (this.engine && this.busy) {
      console.warn('[Engine] 🛑 ABORTING: Sending "stop" to Stockfish worker')
      try {
        this.engine.postMessage('stop')
      } catch {
      }
    }
  }

  terminate(): void {
    this.abortPending()
    this.destroyed = true

    if (this.engine && this.activeHandler) {
      this.engine.removeEventListener('message', this.activeHandler)
      this.activeHandler = null
    }

    if (this.engine) {
      this.engine.terminate()
      this.engine = null
    }

    this.busy = false
    this.queue = []
  }
}

export function createStockfishAdapter(workerUrl: string): StockfishWasmAdapter {
  return new StockfishWasmAdapter(
    () => new Worker(workerUrl, { type: 'classic' }) as unknown as StockfishEngine,
  )
}
