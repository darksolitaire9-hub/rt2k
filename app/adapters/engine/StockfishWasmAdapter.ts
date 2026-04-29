import type { IEnginePort, EngineResult } from '../../../shared/domain/ports/IEnginePort'

export interface StockfishEngine {
  postMessage(msg: string): void
  addEventListener(type: 'message', handler: (event: { data: string }) => void): void
  terminate(): void
}

export class StockfishWasmAdapter implements IEnginePort {
  constructor(private readonly createEngine: () => StockfishEngine) {}

  evaluate(fen: string, depth: number): Promise<EngineResult> {
    return new Promise((resolve) => {
      const engine = this.createEngine()
      let latestScore = 0

      engine.addEventListener('message', ({ data }) => {
        if (data.startsWith('info')) {
          const mateMatch = data.match(/score mate (-?\d+)/)
          if (mateMatch) {
            latestScore = parseInt(mateMatch[1]) > 0 ? 9999 : -9999
          } else {
            const cpMatch = data.match(/score cp (-?\d+)/)
            if (cpMatch) latestScore = parseInt(cpMatch[1])
          }
        }
        if (data.startsWith('uciok')) {
          engine.postMessage('isready')
        }
        if (data.startsWith('readyok')) {
          engine.postMessage(`position fen ${fen}`)
          engine.postMessage(`go depth ${depth}`)
        }
        if (data.startsWith('bestmove')) {
          const bestMove = data.split(' ')[1] ?? ''
          engine.terminate()
          resolve({ score: latestScore, bestMove })
        }
      })

      engine.postMessage('uci')
    })
  }
}

export function createStockfishAdapter(workerUrl: string): StockfishWasmAdapter {
  return new StockfishWasmAdapter(() => new Worker(workerUrl) as unknown as StockfishEngine)
}
