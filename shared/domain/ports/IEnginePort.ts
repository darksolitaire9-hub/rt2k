export interface EngineResult {
  score: number
  bestMove: string
}

export interface IEnginePort {
  evaluate(fen: string, depth: number): Promise<EngineResult>
}
